const preprocessingResultsDiv = document.getElementById("preprocessing-results");
const trainingResultsDiv = document.getElementById("training-results");
const resultsContainer = document.getElementById("results-container");
const trainControlsSection = document.getElementById("trainControlsSection"); // This ID is in the new HTML
const trainBtn = document.getElementById("trainBtn");
const modelSelect = document.getElementById("modelSelect");
const predictBtn = document.getElementById("predictBtn");
const downloadPredictionsBtn = document.getElementById("downloadPredictionsBtn");
const fileInput = document.getElementById("fileInput");
const fileNameSpan = document.getElementById("fileName");
const xgbParamsDiv = document.getElementById("xgbParams");

modelSelect.addEventListener("change", () => {
  xgbParamsDiv.style.display = modelSelect.value === "xgb" ? "flex" : "none";
});

// Helper functions
function addStep(message, isLoading = false) {
  resultsContainer.style.display = "block";
  const step = document.createElement("div");
  step.className = "step";
  step.innerHTML = isLoading ? `<span class="loading"></span> ${message}` : message;
  preprocessingResultsDiv.appendChild(step);
  return step;
}

function updateStep(stepElement, newMessage, extraContent = "") {
  stepElement.innerHTML = newMessage + extraContent;
}

// Update filename display and enable upload button
fileInput.addEventListener("change", () => {
  const uploadBtn = document.getElementById("uploadBtn");
  if (fileInput.files.length > 0) {
    fileNameSpan.textContent = fileInput.files[0].name;
    uploadBtn.disabled = false;
  } else {
    fileNameSpan.textContent = "No file chosen";
    uploadBtn.disabled = true;
  }
});

// Upload CSV and process dataset
document.getElementById("uploadBtn").addEventListener("click", async () => {
  const file = fileInput.files[0];
  if (!file) return alert("Please choose a file first.");

  preprocessingResultsDiv.innerHTML = ""; // Clear old preprocessing results
  trainingResultsDiv.innerHTML = ""; // Clear old training results
  downloadPredictionsBtn.style.display = "none"; // Hide download button on new upload
  const step1 = addStep("Uploading and processing dataset...", true);

  let formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("https://orbital-horizon-backend.onrender.com/upload", {
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
    trainControlsSection.style.display = "block";

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
  trainingResultsDiv.innerHTML = ""; // Clear previous results
  trainingResultsDiv.style.display = "block";

  const step = addStep("Training model...", true);

  // Collect XGB hyperparameters
  const n_estimators = parseInt(document.getElementById("nEstimators").value) || 100; // Corrected ID
  const max_depth = parseInt(document.getElementById("maxDepth").value) || 3;
  const learning_rate = parseFloat(document.getElementById("learningRate").value) || 0.1;

  const hyperparams = { n_estimators, max_depth, learning_rate };

  try {
    const response = await fetch("https://orbital-horizon-backend.onrender.com/train", {
      method:"POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({model, hyperparams})
    });

    const result = await response.json();
    if(result.error){
      updateStep(step, "❌ Error: " + result.error);
      return;
    }

    // Remove the "Training..." step from the preprocessing area
    step.remove();

    let trainingHTML = `<div class="step">✅ Model trained successfully!</div>`;

    // 🔹 Metrics
    trainingHTML += `<div class="metrics-grid">`;
    trainingHTML += `<div class="metric-card"><h4>Accuracy</h4><p>${(result.accuracy * 100).toFixed(2)}%</p></div>`;
    if(result.auc_score) {
      trainingHTML += `<div class="metric-card"><h4>ROC AUC Score</h4><p>${result.auc_score.toFixed(3)}</p></div>`;
    }
    trainingHTML += `</div>`;

    // 🔹 Plots
    trainingHTML += `<div class="plots-grid">`;

    // 🔹 Confusion Matrix
    const cm_src = `data:image/png;base64,${result.confusion_matrix_plot}`;
    trainingHTML += `<div class="plot-card">
                        <div class="plot-header">
                            <h4>Confusion Matrix</h4>
                            <a href="${cm_src}" download="confusion_matrix.png" class="download-btn" title="Download Plot"><i class="fas fa-download"></i></a>
                        </div>
                        <img src="${cm_src}" alt="Confusion Matrix">
                     </div>`;

    // 🔹 ROC Curve (if available)
    if(result.roc_plot){
      const roc_src = `data:image/png;base64,${result.roc_plot}`;
      trainingHTML += `<div class="plot-card">
                            <div class="plot-header">
                                <h4>ROC Curve</h4>
                                <a href="${roc_src}" download="roc_curve.png" class="download-btn" title="Download Plot"><i class="fas fa-download"></i></a>
                            </div>
                            <img src="${roc_src}" alt="ROC Curve">
                         </div>`;
    }

    // 🔹 Accuracy Plot (Training History)
    if(result.accuracy_plot && result.accuracy_plot !== "null"){
      const acc_src = `data:image/png;base64,${result.accuracy_plot}`;
      trainingHTML += `<div class="plot-card">
                            <div class="plot-header">
                                <h4>Training History</h4>
                                <a href="${acc_src}" download="training_history.png" class="download-btn" title="Download Plot"><i class="fas fa-download"></i></a>
                            </div>
                            <img src="${acc_src}" alt="Training History">
                         </div>`;
    } else {
      trainingHTML += `<div class="plot-card"><div class="plot-header"><h4>Training History</h4></div><p><i>No training history plot available for this model.</i></p></div>`;
    }

    trainingHTML += `</div>`; // end plots-grid

    trainingResultsDiv.innerHTML = trainingHTML;

  } catch(err){
    // If training fails, update the step in the preprocessing area
    updateStep(step, "❌ Training Error: " + err.message);
  }
});

// Predict with pre-trained model
predictBtn.addEventListener("click", async () => {
  trainingResultsDiv.innerHTML = ""; // Clear previous results
  trainingResultsDiv.style.display = "block";

  const step = addStep("Running prediction with pre-trained model...", true);

  try {
    const response = await fetch("https://orbital-horizon-backend.onrender.com/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const errorResult = await response.json();
      throw new Error(errorResult.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    // Remove the "Predicting..." step
    step.remove();

    let predictionHTML = `<div class="step">✅ Prediction complete! Found ${result.count} potential objects.</div>`;

    // --- New: Count all prediction types ---
    const counts = { 0: 0, 1: 0, 2: 0 };
    const confirmedPlanets = []; // This will now hold data objects
    result.predictions.forEach((pred, index) => {
        counts[pred] = (counts[pred] || 0) + 1;
        if (pred === 2) {
            // Get the raw data for this planet from the initial upload result
            const planetData = result.raw_data_for_prediction[index];
            confirmedPlanets.push({ index: index + 1, data: planetData });
        }
    });

    predictionHTML += `<div class="metrics-grid">
                        <div class="metric-card">
                            <h4>Confirmed Planets Found</h4>
                            <p>${counts[2]}</p>
                        </div>
                        <div class="metric-card">
                            <h4>Candidates Found</h4>
                            <p>${counts[1]}</p>
                        </div>
                        <div class="metric-card">
                            <h4>False Positives</h4>
                            <p>${counts[0]}</p>
                        </div>
                       </div>`;

    if (confirmedPlanets.length > 0) {
      predictionHTML += `<div class="plot-card">
                            <div class="plot-header"><h4>Discovered Planets (Prediction = 2)</h4></div>`;
      let tableHTML = "<table><tr><th>Original Row #</th><th>Action</th></tr>";
      confirmedPlanets.forEach(planet => {
        // Create URL parameters from the planet's data
        const params = new URLSearchParams({
            radius: planet.data.pl_rade || 50, // Default to 50 if null
            temp: planet.data.pl_eqt || 0,
            insol: planet.data.pl_insol || 50,
            stellar_temp: planet.data.st_teff || 'N/A',
            name: planet.data.kepoi_name || planet.data.pl_name || `Predicted Planet #${planet.index}`,
            stellar_radius: planet.data.st_rad || 'N/A',
            period: planet.data.pl_orbper || 'N/A'
        }).toString();
        tableHTML += `<tr><td>${planet.index}</td><td><a href="planet.html?${params}" target="_blank" class="sim-link">Visualize in Simulator <i class="fas fa-external-link-alt"></i></a></td></tr>`;
      });
      tableHTML += "</table>";
      predictionHTML += tableHTML;
      predictionHTML += `</div>`;
    }

    trainingResultsDiv.innerHTML = predictionHTML;

    // Show the download button
    downloadPredictionsBtn.style.display = "inline-block";

  } catch (err) {
    console.error("❌ Prediction error:", err);
    updateStep(step, "❌ Prediction Error: " + err.message);
  }
});

// Download predictions
downloadPredictionsBtn.addEventListener("click", async () => {
  try {
    const response = await fetch("https://orbital-horizon-backend.onrender.com/download_predictions", {
      method: "GET"
    });

    if (!response.ok) {
      const errorResult = await response.json();
      throw new Error(errorResult.error || "Failed to download CSV.");
    }

    // Trigger file download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "orbital_horizon_predictions.csv";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();

  } catch (err) {
    alert("Download Error: " + err.message);
    console.error("❌ Download error:", err);
  }
});
