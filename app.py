from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import pandas as pd
import numpy as np
import io, re, base64
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, confusion_matrix, roc_auc_score, roc_curve
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
import xgboost
from xgboost import XGBClassifier
import lightgbm as lgb
from lightgbm import LGBMClassifier, log_evaluation, early_stopping

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Temporary storage for last uploaded data
global_features = None
global_target = None

# 🔹 Normalize column names (lowercase + strip non-alphanumeric)
def normalize(col):
    return re.sub(r'[^a-z0-9]', '', col.lower())

# 🔹 Find candidate columns based on keyword lists
def find_columns(df, keywords):
    normalized = {normalize(c): c for c in df.columns}
    matches = [
        orig for norm, orig in normalized.items()
        if any(k in norm for k in keywords)
    ]
    return matches

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/upload", methods=["POST"])
def upload_csv():
    global global_features, global_target

    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    raw_data = file.read().decode("utf-8", errors="ignore")

    # 🔹 Possible target column names
    target_keywords = ["koi_disposition", "tfopwg_disp", "disposition"]

    # 🔹 Try to detect the header dynamically
    df = None
    header_line = None
    for skip in range(300):
        try:
            candidate = pd.read_csv(io.StringIO(raw_data), skiprows=skip, nrows=5)
            if any(col.lower() in [t.lower() for t in target_keywords] for col in candidate.columns):
                df = pd.read_csv(io.StringIO(raw_data), skiprows=skip)
                header_line = skip
                break
        except Exception:
            continue

    if df is None:
        return jsonify({"error": "Could not detect valid dataset header"}), 400

    # 🔹 Count missing values
    missing_counts = df.isnull().sum().to_dict()

    # 🔹 DEBUG: print available columns
    print("🔍 Available columns:", list(df.columns))

    # 🔹 Define search keywords for temperature & radius
    temp_keywords = ["temp", "teq", "eqt", "teff", "steff"]
    rad_keywords  = ["prad", "rade", "radj", "srad", "rad"]

    # 🔹 Detect candidate columns
    temp_cols = find_columns(df, temp_keywords)
    rad_cols  = find_columns(df, rad_keywords)

    # 🔹 Drop candidate columns that are completely empty (all NaN)
    threshold = 300 
    temp_cols = [c for c in temp_cols if df[c].notna().sum() > threshold]
    rad_cols  = [c for c in rad_cols  if df[c].notna().sum() > threshold]

    # 🔹 Detect target column dynamically
    normalized_map = {normalize(c): c for c in df.columns}
    target_col = None
    for norm_col, orig_col in normalized_map.items():
        for key in target_keywords:
            if normalize(key) in norm_col:
                target_col = orig_col
                break
        if target_col:
            break

    extracted = []
    feature_engineered = []
    targets_raw = []
    targets_numeric = []

    if temp_cols and rad_cols and target_col:
        # Drop rows with NaN in any relevant column
        subset_cols = temp_cols + rad_cols + [target_col]
        cleaned = df.dropna(subset=subset_cols)[subset_cols]

        # 🔹 Choose specific columns dynamically
        planet_rad_col = next((c for c in rad_cols if "prad" in c.lower()), None)
        stellar_rad_col = next((c for c in rad_cols if "srad" in c.lower()), None)
        stellar_temp_col = next((c for c in temp_cols if "steff" in c.lower()), None)
        eq_temp_col = next((c for c in temp_cols if "teq" in c.lower()), None)

        # 🔹 Start with base features
        features = cleaned[temp_cols + rad_cols].copy()

        # ---- Feature engineering ----

        # Planet radius-based features
        if planet_rad_col:
            features["planet_radius_sq"] = cleaned[planet_rad_col] ** 2

            if stellar_temp_col:
                features["stellar_temp_x_planet_rad"] = cleaned[stellar_temp_col] * cleaned[planet_rad_col]
                features["stellar_temp_div_planet_rad"] = cleaned[stellar_temp_col] / cleaned[planet_rad_col].replace(0, 1)

            elif eq_temp_col:
                features["eq_temp_x_planet_rad"] = cleaned[eq_temp_col] * cleaned[planet_rad_col]
                features["eq_temp_div_planet_rad"] = cleaned[eq_temp_col] / cleaned[planet_rad_col].replace(0, 1)

        # Stellar radius-based features
        if stellar_rad_col:
            features["stellar_radius_sq"] = cleaned[stellar_rad_col] ** 2

            if stellar_temp_col:
                features["stellar_temp_x_stellar_rad"] = cleaned[stellar_temp_col] * cleaned[stellar_rad_col]
                features["stellar_temp_div_stellar_rad"] = cleaned[stellar_temp_col] / cleaned[stellar_rad_col].replace(0, 1)

            elif eq_temp_col:
                features["eq_temp_x_stellar_rad"] = cleaned[eq_temp_col] * cleaned[stellar_rad_col]
                features["eq_temp_div_stellar_rad"] = cleaned[eq_temp_col] / cleaned[stellar_rad_col].replace(0, 1)

        # Normalize
        scaler = StandardScaler()
        scaled_features = pd.DataFrame(
            scaler.fit_transform(features),
            columns=features.columns
        )

        # Targets (numeric)
        non_null_target = cleaned[target_col].astype(str)
        le = LabelEncoder()
        encoded_target = le.fit_transform(non_null_target)

        # Store globals
        global_features = scaled_features
        global_target = encoded_target 

        # For frontend preview
        extracted = cleaned[temp_cols + rad_cols].head(5).to_dict(orient="records")
        
        engineered_cols = [c for c in features.columns if c not in (temp_cols + rad_cols)]
        feature_engineered = scaled_features[engineered_cols].head(5).to_dict(orient="records")
        
        targets_raw = non_null_target.head(5).tolist()
        targets_numeric = encoded_target[:10].tolist()

    return jsonify({
        "header_line": header_line,
        "target_column": target_col,
        "missing_counts": missing_counts,
        "temperature_columns": temp_cols,
        "radius_columns": rad_cols,
        "extracted_raw": extracted,
        "extracted_normalized": feature_engineered,
        "targets_raw": targets_raw,
        "targets_numeric": targets_numeric
    })

@app.route("/train", methods=["POST"])
def train_model():
    global global_features, global_target
    if global_features is None or global_target is None:
        return jsonify({"error": "No dataset uploaded yet."}), 400

    data = request.json
    model_choice = data.get("model")
    hyperparams = data.get("hyperparams", {})

    if model_choice not in ["xgb", "lgbm"]:
        return jsonify({"error": "Invalid model choice."}), 400

    X_train, X_test, y_train, y_test = train_test_split(
        global_features, global_target, test_size=0.2, random_state=42
    )

    num_classes = len(np.unique(y_train))

    evals_result = {}  # to store training history

    # ------------------------- XGBoost -------------------------
    if model_choice == "xgb":
        n_estimators = hyperparams.get("n_estimators", 100)
        max_depth = hyperparams.get("max_depth", 3)
        learning_rate = hyperparams.get("learning_rate", 0.1)

        if num_classes > 2:
            objective = "multi:softprob"
        else:
            objective = "binary:logistic"

        model = XGBClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            learning_rate=learning_rate,
            objective=objective,
            num_class=num_classes if num_classes > 2 else None,
            random_state=42
        )

        model.fit(
            X_train, y_train,
            eval_set=[(X_train, y_train), (X_test, y_test)],
            verbose=False
        )
        evals_result = model.evals_result()

    # ------------------------- LightGBM -------------------------
    elif model_choice == "lgbm":
        model = LGBMClassifier(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=-1,
            random_state=42
        )

        # choose metric depending on problem type
        if num_classes > 2:
            metrics = ["multi_logloss", "multi_error"]
        else:
            metrics = ["binary_logloss", "binary_error"]

        model.fit(
            X_train, y_train,
            eval_set=[(X_train, y_train), (X_test, y_test)],
            eval_metric=metrics,
            callbacks=[
                log_evaluation(period=10),
                early_stopping(stopping_rounds=20),
            ]
        )

        # LightGBM stores in model.evals_result_
        raw_result = model.evals_result_

        # 🔄 Normalize to match XGBoost style
        for dataset_name, metrics_dict in raw_result.items():
            evals_result[dataset_name] = {}
            for metric_name, values in metrics_dict.items():
                evals_result[dataset_name][metric_name] = values

    # ------------------------- Evaluation -------------------------
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1] if num_classes == 2 else None

    acc = accuracy_score(y_test, y_pred)
    cm = confusion_matrix(y_test, y_pred)

    # Confusion matrix plot
    plt.figure(figsize=(5, 4))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues")
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    plt.tight_layout()
    buf = io.BytesIO()
    plt.savefig(buf, format="png")
    plt.close("all")
    cm_plot = base64.b64encode(buf.getbuffer()).decode("utf8")

    # ROC curve (binary only)
    roc_plot = None
    auc_score = None
    if y_proba is not None:
        fpr, tpr, _ = roc_curve(y_test, y_proba)
        auc_score = roc_auc_score(y_test, y_proba)
        plt.figure(figsize=(5, 4))
        plt.plot(fpr, tpr, label=f"AUC={auc_score:.3f}")
        plt.plot([0, 1], [0, 1], "k--")
        plt.xlabel("False Positive Rate")
        plt.ylabel("True Positive Rate")
        plt.title("ROC Curve")
        plt.legend()
        plt.tight_layout()
        buf = io.BytesIO()
        plt.savefig(buf, format="png")
        plt.close()
        roc_plot = base64.b64encode(buf.getbuffer()).decode("utf8")

    # Accuracy/history plot (shared for both models)
    acc_plot = None
    if evals_result:
        plt.figure(figsize=(6, 4))
        for dataset_name, metrics_dict in evals_result.items():
            for metric_name, values in metrics_dict.items():
                plt.plot(values, label=f"{dataset_name}-{metric_name}")
        plt.xlabel("Iteration")
        plt.ylabel("Metric")
        plt.title("Training History")
        plt.legend()
        plt.tight_layout()
        buf = io.BytesIO()
        plt.savefig(buf, format="png")
        plt.close()
        acc_plot = base64.b64encode(buf.getbuffer()).decode("utf8")

    return jsonify({
        "accuracy": acc,
        "confusion_matrix_plot": cm_plot,
        "roc_plot": roc_plot,
        "auc_score": auc_score,
        "accuracy_plot": acc_plot
    })

if __name__ == "__main__":
    app.run(debug=True)
