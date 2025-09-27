from flask import Flask, request, jsonify, render_template, send_file
from flask_cors import CORS
import pandas as pd
import numpy as np
import io, base64, joblib
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, confusion_matrix, roc_auc_score, roc_curve
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier, log_evaluation, early_stopping

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Temporary storage for last uploaded data
global global_features
global global_target
global global_df_core
global global_df_unscaled
global global_predictions

global_features = None
global_target = None
global_df_core = None
global_df_unscaled = None
global_predictions = None

def extract_features_and_target(df, feature_keywords, target_keywords):
    # Filter features to only those present in df
    feature_cols = [col for col in feature_keywords if col in df.columns]

    # Detect target column
    target_col = next((col for col in target_keywords if col in df.columns), None)
    if target_col is None:
        raise ValueError("No valid target column found in this dataset.")

    # Subset dataframe
    df_core = df[feature_cols + [target_col]].copy()

    return df_core, feature_cols, target_col

def detect_header(raw_data, target_keywords, max_skip=300):
    df = None
    header_line = None

    for skip in range(max_skip):
        try:
            candidate = pd.read_csv(io.StringIO(raw_data), skiprows=skip, nrows=5)
            if any(col.lower() in [t.lower() for t in target_keywords] for col in candidate.columns):
                df = pd.read_csv(io.StringIO(raw_data), skiprows=skip)
                header_line = skip
                break
        except Exception:
            continue

    if df is None:
        return None, None, "Could not detect valid dataset header"

    return df, header_line, None

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/upload", methods=["POST"])
def upload_csv():
    global global_features, global_target, global_df_core, global_df_unscaled, global_predictions

    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    raw_data = file.read().decode("utf-8", errors="ignore")

    # Possible target column names
    target_keywords = ["koi_disposition", "tfopwg_disp", "disposition"]

    # Possible identifier column names
    id_keywords = ["kepoi_name", "pl_name", "kepid", "tic_id"]

    df, header_line, error = detect_header(raw_data, target_keywords)
    if error:
        return jsonify({"error": error}), 400

    # DEBUG: print available columns
    print("🔍 Available columns:", list(df.columns))

    # Define search keywords for important features
    feature_keywords = [
        # kepler features
        'koi_prad', 'koi_period', 'koi_depth', 'koi_duration',
        'koi_teq', 'koi_insol',
        'koi_steff', 'koi_srad',
        # 'koi_score', 'koi_model_snr',

        # k2 features
        'pl_rade', 'pl_orbper', 'pl_trandep', 'pl_trandur',
        'pl_eqt', 'pl_insol',
        'st_teff', 'st_rad', # 'st_mass',
        # 'rv_flag', 'tran_flag',

        # tess features
        'pl_rade', 'pl_orbper', 'pl_trandurh',
        'pl_eqt', 'pl_insol',
        # 'st_teff', 'st_rad', 'st_tmag'
    ]

    feature_keywords = list(dict.fromkeys(feature_keywords))

    # Encode target labels uniformly
    target_map = {
        # NOT A PLANET
        'FALSE POSITIVE': 0,
        'REFUTED': 0,
        'FP': 0,
        'FA': 0,

        # CANDIDATE
        'CANDIDATE': 1,
        'PC': 1,
        'CP': 1,
        'APC': 1,

        # PLANET
        'CONFIRMED': 2,
        'KP': 2
    }
    
    # Find the first available ID column
    id_col = next((col for col in id_keywords if col in df.columns), None)

    # Extract features and target
    # Add id_col to feature_cols if it exists, so it's preserved
    df_core, feature_cols, target_col = extract_features_and_target(df, feature_keywords, target_keywords)

    # Rename features for uniformity
    rename_map = {
        # Kepler
        'koi_prad':'pl_rade', 'koi_period':'pl_orbper',
        'koi_depth':'pl_trandep', 'koi_duration':'pl_trandur',
        'koi_teq':'pl_eqt', 'koi_insol':'pl_insol',
        'koi_steff':'st_teff', 'koi_srad':'st_rad',
        'koi_score':'score', 'koi_model_snr':'snr',
        # TESS
        'pl_trandurh':'pl_trandur',
        'st_tmag':'st_mag'
    }

    # Filter to only rename columns that exist in the current DataFrame
    rename_map = {k: v for k, v in rename_map.items() if k in df_core.columns}

    df_core.rename(columns=rename_map, inplace=True)

    # Add the original ID column to df_core if it was found
    if id_col:
        df_core[id_col] = df[id_col]

    # Map target to numeric
    df_core['target'] = df_core[target_col].map(target_map)
    df_core = df_core[df_core['target'].notna()]

    df_core = df_core.drop(columns=[target_col])

    df_core['target'] = df_core['target'].astype(int)

    # Fill missing numeric values with median
    numeric_cols = df_core.select_dtypes(include=np.number).columns.drop('target', errors='ignore')
    for col in numeric_cols:
        df_core[col] = df_core[col].fillna(df_core[col].median())

    # Store the unscaled data before normalization
    global_df_unscaled = df_core.copy()

    # Normalize numeric features
    scaler = MinMaxScaler()
    feature_cols = [col for col in df_core.columns if col not in ['target', id_col] and df_core[col].dtype in ['int64', 'float64']]
    df_core[feature_cols] = scaler.fit_transform(df_core[feature_cols])

    # Define feature order
    canonical_order = [
        # Planetary features
        'pl_rade', 'pl_orbper', 'pl_trandep', 'pl_trandur', 'pl_eqt', 'pl_insol',

        # Stellar features
        'st_teff', 'st_rad', 'st_mass', 'st_mag',

        # Other features
        'score', 'snr', 'rv_flag', 'tran_flag'
    ]

    # Keep only features that exist in df_core
    final_cols = [col for col in canonical_order if col in df_core.columns]
    # Add back the target and id columns
    final_cols.append('target')
    if id_col: final_cols.append(id_col)

    # Reorder columns
    df_core = df_core[final_cols]

    # Prepare JSON-serializable data
    extracted_raw = df_core[feature_cols].head(5).to_dict(orient="records") if len(feature_cols) > 0 else []
    extracted_normalized = df_core[feature_cols].head(5).to_dict(orient="records") if len(feature_cols) > 0 else []
    targets_raw = df_core['target'].head(5).tolist()
    targets_numeric = df_core['target'].head(5).tolist()

    # Missing counts
    missing_counts = df_core.isnull().sum().to_dict()

    # Optionally identify temperature/radius columns if they exist
    temp_cols = [c for c in feature_cols if 'teff' in c.lower()]
    rad_cols = [c for c in feature_cols if 'rad' in c.lower()]

    # Store globally for training later
    global_features = [col for col in df_core.columns if col not in ['target', id_col]]
    global_target = 'target'
    global_df_core = df_core.copy() # This is the scaled data for the model

    # Reset predictions when a new file is uploaded
    global_predictions = None

    return jsonify({
        "header_line": header_line,
        "target_column": target_col,
        "missing_counts": missing_counts,
        "temperature_columns": temp_cols,
        "radius_columns": rad_cols,
        "extracted_raw": extracted_raw,
        "extracted_normalized": extracted_normalized,
        "targets_raw": targets_raw,
        "targets_numeric": targets_numeric
    })

@app.route("/save", methods=["GET"])
def save_processed_data():
    global global_df_core
    if global_df_core is None:
        return jsonify({"error": "No dataset uploaded yet."}), 400

    # Save DataFrame to a BytesIO buffer
    buf = io.BytesIO()
    global_df_core.to_csv(buf, index=False)
    buf.seek(0)
    
    return send_file(
        buf,
        mimetype="text/csv",
        as_attachment=True,
        download_name="processed_data.csv"
    )

@app.route("/train", methods=["POST"])
def train_model():
    global global_df_core
    if global_df_core is None:
        return jsonify({"error": "No dataset uploaded yet."}), 400

    data = request.json
    model_choice = data.get("model")
    hyperparams = data.get("hyperparams", {})

    X = global_df_core[global_features] # Use the curated feature list
    y = global_df_core['target']

    if model_choice not in ["xgb", "lgbm"]:
        return jsonify({"error": "Invalid model choice."}), 400

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
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

@app.route("/predict", methods=["POST"])
def predict_with_pretrained():
    global global_df_core, global_df_unscaled, global_predictions
    if global_df_core is None:
        return jsonify({"error": "No dataset uploaded yet."}), 400
    
    try:
        # Load pretrained model
        model = joblib.load("xgb_final_model_v2.pkl")

        X = global_df_core[global_features] # Use the curated feature list to exclude non-numeric IDs

        # Use the unscaled dataframe to get the original values for visualization
        raw_data_for_prediction = global_df_unscaled.to_dict(orient='records')

        preds = model.predict(X)
        
        # Store predictions globally for download
        global_predictions = preds.tolist()

        return jsonify({
            "predictions": preds.tolist(),
            "count": len(preds),
            "raw_data_for_prediction": raw_data_for_prediction # Send the data to the frontend
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/download_predictions", methods=["GET"])
def download_predictions():
    global global_df_unscaled, global_predictions
    if global_df_unscaled is None or global_predictions is None:
        return jsonify({"error": "No predictions have been generated to download."}), 400

    try:
        df_to_download = global_df_unscaled.copy()
        df_to_download['prediction'] = global_predictions
        
        # Map numeric predictions back to human-readable labels
        prediction_map = {0: 'FALSE POSITIVE', 1: 'CANDIDATE', 2: 'CONFIRMED'}
        df_to_download['prediction_label'] = df_to_download['prediction'].map(prediction_map)

        buf = io.BytesIO()
        df_to_download.to_csv(buf, index=False)
        buf.seek(0)
        
        return send_file(
            buf,
            mimetype="text/csv",
            as_attachment=True,
            download_name="orbital_horizon_predictions.csv"
        )
    except Exception as e:
        return jsonify({"error": f"Failed to create CSV: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(debug=True)
