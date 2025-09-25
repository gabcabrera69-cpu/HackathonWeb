const stepsDiv = document.getElementById("steps");
const trainSection = document.getElementById("trainSection");
const trainBtn = document.getElementById("trainBtn");
const modelSelect = document.getElementById("modelSelect");
const xgbParamsDiv = document.getElementById("xgbParams");

modelSelect.addEventListener("change", () => {
  xgbParamsDiv.style.display = modelSelect.value === "xgb" ? "block" : "none";
});

// Helper functions
function addStep(message, isLoading = false) {
  const step = document.createElement("div");
  step.className = "step";
  step.innerHTML = isLoading ? `<span class="loading"></span>${message}` : message;
  stepsDiv.appendChild(step);
  return step;
}

function updateStep(stepElement, newMessage, extraContent = "") {
  stepElement.innerHTML = newMessage + extraContent;
}

// Upload CSV and process dataset
document.getElementById("uploadBtn").addEventListener("click", async () => {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  if (!file) return alert("Please choose a file first.");

  stepsDiv.innerHTML = "";
  const step1 = addStep("Uploading and processing dataset...", true);

  let formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("https://orbital-horizon-backend.onrender.com", {
      method: "POST",
      body: formData
    });

    const result = await response.json();
    console.log("✅ Backend response:", result);

    if(result.error){
      updateStep(step1, "❌ Error: " + result.error);
      return;
    }

    updateStep(step1, "✅ Dataset processed successfully!");

    // Show training section after successful upload
    trainSection.style.display = "block";

    // Step 2: Missing values
    const step2 = addStep("Checking for missing values...");
    if (result.missing_counts) {
      let tableHTML = "<table><tr><th>Column</th><th>Missing Values</th></tr>";
      for (let col in result.missing_counts) {
        tableHTML += `<tr><td>${col}</td><td>${result.missing_counts[col]}</td></tr>`;
      }
      tableHTML += "</table>";
      updateStep(step2, "✅ Missing values check complete.", tableHTML);
    } else {
      updateStep(step2, "⚠️ Missing values info not available.");
    }

    // Step 3: Extracted raw features (Temp & Radius)
    const step3 = addStep("Extracting Temperature & Radius...");
    if (result.temperature_columns.length > 0 || result.radius_columns.length > 0) {
      let html = "";

      // 🔹 Temperature Table
      if (result.temperature_columns.length > 0) {
        html += "<h4>Temperature Columns:</h4>";
        let tempKeys = result.temperature_columns;
        let tempTable = `<table><tr>${tempKeys.map(k => `<th>${k}</th>`).join("")}</tr>`;
        result.extracted_raw.forEach(r => {
          tempTable += `<tr>${tempKeys.map(k => `<td>${r[k] !== undefined ? r[k] : ""}</td>`).join("")}</tr>`;
        });
        tempTable += "</table>";
        html += tempTable;
      }

      // 🔹 Radius Table
      if (result.radius_columns.length > 0) {
        html += "<h4>Radius Columns:</h4>";
        let radKeys = result.radius_columns;
        let radTable = `<table><tr>${radKeys.map(k => `<th>${k}</th>`).join("")}</tr>`;
        result.extracted_raw.forEach(r => {
          radTable += `<tr>${radKeys.map(k => `<td>${r[k] !== undefined ? r[k] : ""}</td>`).join("")}</tr>`;
        });
        radTable += "</table>";
        html += radTable;
      }

      updateStep(step3, "✅ Temp & Radius extracted.", html);
    } else {
      updateStep(step3, "❌ Could not find Temperature & Radius columns.");
    }

    // Step 4: Feature engineered (only engineered cols)
    const step4 = addStep("Normalizing & engineering features...");
    if (result.extracted_normalized && Array.isArray(result.extracted_normalized) && result.extracted_normalized.length > 0) {
      let keys = Object.keys(result.extracted_normalized[0]);
      let tableHTML = `<table><tr>${keys.map(k => `<th>${k}</th>`).join("")}</tr>`;
      result.extracted_normalized.forEach(r => {
        tableHTML += `<tr>${keys.map(k => `<td>${r[k].toFixed ? r[k].toFixed(3) : r[k]}</td>`).join("")}</tr>`;
      });
      tableHTML += "</table>";
      updateStep(step4, "✅ Engineered features generated.", tableHTML);
    } else {
      updateStep(step4, "⚠️ No engineered features found.");
    }

    // Step 5: Target column
    const step5 = addStep("Extracting target column...");
    if (result.targets_raw && Array.isArray(result.targets_raw) && result.targets_raw.length > 0) {
      let rawList = "<pre>" + JSON.stringify(result.targets_raw, null, 2) + "</pre>";
      let numList = "<pre>" + JSON.stringify(result.targets_numeric, null, 2) + "</pre>";
      updateStep(
        step5,
        `✅ Target column extracted (${result.target_column || "unknown"}).`,
        `<h4>Raw values:</h4>${rawList}<h4>Numeric encoding:</h4>${numList}`
      );
    } else {
      updateStep(step5, "❌ Target column not found.");
    }

  } catch (err) {
    console.error("❌ Frontend error:", err);
    updateStep(step1, "❌ Error: " + err.message);
  }
});

// Train model
trainBtn.addEventListener("click", async () => {
  const model = document.getElementById("modelSelect").value;
  const metricsDiv = document.getElementById("metrics");
  const plotsDiv = document.getElementById("plots");
  metricsDiv.innerHTML = "";
  plotsDiv.innerHTML = "";

  // Collect XGB hyperparameters
  const n_estimators = parseInt(document.getElementById("nEstimators").value) || 100;
  const max_depth = parseInt(document.getElementById("maxDepth").value) || 3;
  const learning_rate = parseFloat(document.getElementById("learningRate").value) || 0.1;

  const hyperparams = { n_estimators, max_depth, learning_rate };

  const step = addStep("Training model...", true);

  try {
    const response = await fetch("https://your-project-name.onrender.com/train", {
      method:"POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({model, hyperparams})
    });

    const result = await response.json();
    if(result.error){
      updateStep(step, "❌ Error: " + result.error);
      return;
    }

    updateStep(step, `✅ Model trained! Accuracy: ${(result.accuracy*100).toFixed(2)}%`);
    metricsDiv.innerHTML = `<p>Accuracy: ${(result.accuracy*100).toFixed(2)}%</p>`;
    if(result.auc_score) metricsDiv.innerHTML += `<p>ROC AUC: ${result.auc_score.toFixed(3)}</p>`;

    // 🔹 Confusion Matrix
    plotsDiv.innerHTML += "<h4>Confusion Matrix</h4>";
    const cmImg = document.createElement("img");
    cmImg.src = "data:image/png;base64," + result.confusion_matrix_plot;
    cmImg.style.maxWidth = "400px";
    plotsDiv.appendChild(cmImg);

    // 🔹 ROC Curve (if available)
    if(result.roc_plot){
      plotsDiv.innerHTML += "<h4>ROC Curve</h4>";
      const rocImg = document.createElement("img");
      rocImg.src = "data:image/png;base64," + result.roc_plot;
      rocImg.style.maxWidth = "400px";
      plotsDiv.appendChild(rocImg);
    }

    // 🔹 Accuracy Plot (Training History)
    if(result.accuracy_plot && result.accuracy_plot !== "null"){
      plotsDiv.innerHTML += "<h4>Training History</h4>";
      const accImg = document.createElement("img");
      accImg.src = "data:image/png;base64," + result.accuracy_plot;
      accImg.style.maxWidth = "400px";
      plotsDiv.appendChild(accImg);
    } else {
      plotsDiv.innerHTML += "<p><i>No training history available for this model.</i></p>";
    }
    
  } catch(err){
    updateStep(step, "❌ Training error: " + err.message);
  }
});
