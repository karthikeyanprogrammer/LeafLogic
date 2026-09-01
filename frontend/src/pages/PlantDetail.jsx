import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, ImagePlus, Pencil, Save, Trash2, UploadCloud, X } from "lucide-react";
import api from "../services/api";

const numericFields = [
  { key: "height_cm", label: "Height", unit: "cm" },
  { key: "leaf_count", label: "Leaves", unit: "" },
  { key: "flower_count", label: "Flowers", unit: "" },
  { key: "fruit_count", label: "Fruit", unit: "" },
  { key: "watering_amount_ml", label: "Watering", unit: "ml" },
  { key: "sunlight_hours", label: "Sunlight", unit: "h" },
  { key: "temperature_c", label: "Temperature", unit: "C" },
  { key: "humidity_percent", label: "Humidity", unit: "%" },
];

const trendGroups = [
  {
    title: "Growth Trends",
    fields: [
      { key: "height_cm", label: "Height", unit: "cm" },
      { key: "leaf_count", label: "Leaves", unit: "" },
      { key: "flower_count", label: "Flowers", unit: "" },
      { key: "fruit_count", label: "Fruit", unit: "" },
    ],
  },
  {
    title: "Care Trends",
    fields: [
      { key: "watering_amount_ml", label: "Watering", unit: "ml" },
      { key: "days_since_last_watering", label: "Days since watering", unit: "d" },
    ],
  },
  {
    title: "Environment Trends",
    fields: [
      { key: "sunlight_hours", label: "Sunlight", unit: "h" },
      { key: "temperature_c", label: "Temperature", unit: "C" },
      { key: "humidity_percent", label: "Humidity", unit: "%" },
    ],
  },
  {
    title: "Health Trends",
    fields: [
      { key: "leaf_count", label: "Leaf count", unit: "" },
      { key: "flower_count", label: "Flowering", unit: "" },
    ],
  },
];

const options = {
  growth_stage: ["Seedling", "Young Plant", "Vegetative", "Flowering", "Fruiting", "Mature", "Drying"],
  soil_moisture: ["Very Dry", "Dry", "Slightly Dry", "Moist", "Wet", "Waterlogged"],
  rain_exposure: ["No Rain", "Light Rain", "Moderate Rain", "Heavy Rain"],
  wind_exposure: ["None", "Low", "Moderate", "Strong"],
  leaf_color: ["Dark Green", "Healthy Green", "Pale Green", "Yellowing", "Browning", "Black Spots", "White Patches", "Mixed Colors"],
  leaf_condition: ["Healthy", "Drooping", "Curling", "Dry Edges", "Crispy", "Wilting", "Holes", "Spotted", "Torn"],
  stem_condition: ["Strong", "Weak", "Bending", "Soft", "Cracked", "Rotting"],
  pest_signs: ["None", "Small Insects", "Holes in Leaves", "White Powder", "Sticky Residue", "Webbing", "Chewed Leaves", "Unknown Pest Signs"],
  disease_signs: ["None", "Yellow Spots", "Brown Spots", "White Mold", "Black Mold", "Root Rot Signs", "Leaf Rot", "Stem Rot", "Unknown Disease Signs"],
  overall_health: ["Excellent", "Good", "Average", "Poor", "Very Poor"],
  fertilizer_used: ["None", "Compost", "Organic Fertilizer", "Liquid Fertilizer", "Nitrogen Rich", "Phosphorus Rich", "Potassium Rich", "Balanced Fertilizer"],
  pruning_status: ["No Pruning", "Light Pruning", "Heavy Pruning"],
  pesticide_used: ["None", "Neem Oil", "Organic Pesticide", "Chemical Pesticide", "Fungicide"],
};

const numericLogKeys = new Set([
  "height_cm",
  "leaf_count",
  "flower_count",
  "fruit_count",
  "watering_amount_ml",
  "days_since_last_watering",
  "sunlight_hours",
  "temperature_c",
  "humidity_percent",
]);

const initialLog = {
  log_date: new Date().toISOString().slice(0, 10),
  image_path: "",
  height_cm: "",
  leaf_count: "",
  flower_count: "",
  fruit_count: "",
  growth_stage: "",
  watering_amount_ml: "",
  days_since_last_watering: "",
  soil_moisture: "",
  sunlight_hours: "",
  temperature_c: "",
  humidity_percent: "",
  rain_exposure: "",
  wind_exposure: "",
  leaf_color: "",
  leaf_condition: "",
  stem_condition: "",
  pest_signs: "",
  disease_signs: "",
  overall_health: "",
  fertilizer_used: "",
  pruning_status: "",
  pesticide_used: "",
  general_notes: "",
};

const logSteps = [
  "Growth",
  "Watering",
  "Environment",
  "Health",
  "Care actions",
  "Media",
  "Notes",
];

const logDetailGroups = [
  {
    title: "Growth",
    fields: [
      { key: "height_cm", label: "Height cm", type: "number" },
      { key: "leaf_count", label: "Leaf count", type: "number" },
      { key: "flower_count", label: "Flower count", type: "number" },
      { key: "fruit_count", label: "Fruit count", type: "number" },
      { key: "growth_stage", label: "Growth stage", type: "select" },
    ],
  },
  {
    title: "Watering",
    fields: [
      { key: "watering_amount_ml", label: "Watering amount ml", type: "number" },
      { key: "days_since_last_watering", label: "Days since last watering", type: "number" },
      { key: "soil_moisture", label: "Soil moisture", type: "select" },
    ],
  },
  {
    title: "Environment",
    fields: [
      { key: "sunlight_hours", label: "Sunlight hours", type: "number" },
      { key: "temperature_c", label: "Temperature C", type: "number" },
      { key: "humidity_percent", label: "Humidity %", type: "number" },
      { key: "rain_exposure", label: "Rain exposure", type: "select" },
      { key: "wind_exposure", label: "Wind exposure", type: "select" },
    ],
  },
  {
    title: "Health",
    fields: [
      { key: "leaf_color", label: "Leaf color", type: "select" },
      { key: "leaf_condition", label: "Leaf condition", type: "select" },
      { key: "stem_condition", label: "Stem condition", type: "select" },
      { key: "pest_signs", label: "Pest signs", type: "select" },
      { key: "disease_signs", label: "Disease signs", type: "select" },
      { key: "overall_health", label: "Overall health", type: "select" },
    ],
  },
  {
    title: "Care actions",
    fields: [
      { key: "fertilizer_used", label: "Fertilizer used", type: "select" },
      { key: "pruning_status", label: "Pruning status", type: "select" },
      { key: "pesticide_used", label: "Pesticide used", type: "select" },
    ],
  },
  {
    title: "Media",
    fields: [
      { key: "image_path", label: "Image record", type: "text" },
    ],
  },
  {
    title: "Notes",
    fields: [
      { key: "general_notes", label: "General notes", type: "textarea" },
    ],
  },
];

function normalizeLogForForm(log) {
  return Object.fromEntries(
    Object.keys(initialLog).map((key) => [key, log?.[key] ?? ""])
  );
}

function buildLogPayload(formData) {
  return Object.fromEntries(
    Object.entries(formData).map(([key, value]) => {
      if (value === "") return [key, null];
      if (numericLogKeys.has(key)) return [key, Number(value)];
      return [key, value];
    })
  );
}

function MiniChart({ logs, field, label, unit }) {
  const points = logs
    .slice()
    .reverse()
    .filter((log) => log[field] !== null && log[field] !== undefined)
    .map((log) => ({ date: log.log_date, value: Number(log[field]) }));

  if (points.length < 2) {
    return (
      <article className="chart-card">
        <h3>{label}</h3>
        <p className="muted">Add at least two logs.</p>
      </article>
    );
  }

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const chartPoints = points.map((point, index) => {
    const x = (index / (points.length - 1)) * 100;
    const y = 90 - ((point.value - min) / range) * 75;
    return `${x},${y}`;
  });
  const latest = points[points.length - 1];

  return (
    <article className="chart-card">
      <div className="chart-heading">
        <h3>{label}</h3>
        <strong>{latest.value}{unit}</strong>
      </div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="trend-chart">
        <polyline points={chartPoints.join(" ")} />
      </svg>
      <p className="muted">{points[0].date} to {latest.date}</p>
    </article>
  );
}

function formatValue(value, fallback = "-") {
  return value === null || value === undefined || value === "" ? fallback : value;
}

function difference(latest, previous, key) {
  if (!latest || !previous || latest[key] === null || previous[key] === null || latest[key] === undefined || previous[key] === undefined) {
    return null;
  }

  return Number(latest[key]) - Number(previous[key]);
}

function describeDelta(delta, unit = "") {
  if (delta === null) return "not enough comparable data";
  if (delta > 0) return `up ${Number(delta.toFixed(1))}${unit}`;
  if (delta < 0) return `down ${Math.abs(Number(delta.toFixed(1)))}${unit}`;
  return "unchanged";
}

function insightTitle(insightType) {
  const titles = {
    growth: "Growth slowing",
    watering: "Watering stress",
    foliage: "Leaf count dropped",
    pests: "Pest signs",
    disease: "Disease signs",
    environment: "Low humidity",
    species_sunlight_low: "Sunlight below species range",
    species_sunlight_high: "Sunlight above species range",
    species_growth_sunlight: "Low sunlight may be slowing Basil growth",
    species_temperature_low: "Temperature below species range",
    species_temperature_high: "Temperature above species range",
    species_soil_moisture: "Soil moisture outside preference",
    species_watering_frequent: "Watering more often than ideal",
    species_watering_infrequent: "Watering less often than ideal",
    baseline: "Tracking baseline",
  };

  return titles[insightType] || insightType.replaceAll("_", " ");
}

function insightCause(insightType) {
  if (insightType === "growth") return "Sunlight dropped while height gains slowed.";
  if (insightType === "species_growth_sunlight") return "The plant is below its species sunlight range and recent growth has slowed.";
  if (insightType === "pests") return "Pest signs were selected in the latest health check.";
  if (insightType === "environment") return "Humidity is below the comfortable range for many plants.";
  if (insightType.startsWith("species_sunlight")) return "The latest sunlight value is outside the selected species profile.";
  if (insightType.startsWith("species_temperature")) return "The latest temperature value is outside the selected species profile.";
  if (insightType === "species_soil_moisture") return "The latest soil moisture selection does not match the species preference.";
  if (insightType.startsWith("species_watering")) return "The latest watering interval is outside the species profile range.";
  return "The latest structured log contains a condition worth watching.";
}

function insightRecommendation(insightType) {
  if (insightType === "growth") return "Move the plant to brighter indirect light or track whether light improves over the next logs.";
  if (insightType === "species_growth_sunlight") return "Increase suitable light exposure and watch whether height or leaf growth improves in the next two logs.";
  if (insightType === "pests") return "Inspect leaf undersides, isolate if needed, and log whether treatment helps.";
  if (insightType === "environment") return "Increase humidity gently and watch leaf edges in the next log.";
  if (insightType === "species_sunlight_low") return "Increase suitable light exposure gradually and compare growth in the next few logs.";
  if (insightType === "species_sunlight_high") return "Reduce harsh exposure or move the plant to a less intense spot.";
  if (insightType === "species_temperature_low") return "Move the plant to a warmer protected location if possible.";
  if (insightType === "species_temperature_high") return "Add shade, improve airflow, or move the plant away from heat stress.";
  if (insightType === "species_soil_moisture") return "Adjust watering so the next log matches the species moisture preference more closely.";
  if (insightType === "species_watering_frequent") return "Wait longer between waterings unless the soil and leaves show stress.";
  if (insightType === "species_watering_infrequent") return "Shorten the watering interval and watch whether leaf condition improves.";
  return "Keep logging consistently and compare the next two entries.";
}

function insightMetrics(insightType) {
  if (insightType === "growth") return ["height", "sunlight"];
  if (insightType === "environment") return ["humidity", "leaf condition"];
  if (insightType.includes("sunlight")) return ["sunlight", "species profile"];
  if (insightType.includes("temperature")) return ["temperature", "species profile"];
  if (insightType.includes("soil")) return ["soil moisture", "species profile"];
  if (insightType.includes("watering")) return ["watering interval", "species profile"];
  return ["health", "care"];
}

function isSpeciesInsight(insightType) {
  return insightType.startsWith("species_");
}

function sortInsightsForDisplay(insightsToSort) {
  const severityRank = { high: 0, medium: 1, low: 2 };

  return insightsToSort.slice().sort((first, second) => {
    const severityDifference = (severityRank[first.severity] ?? 3) - (severityRank[second.severity] ?? 3);

    if (severityDifference !== 0) {
      return severityDifference;
    }

    if (isSpeciesInsight(first.insight_type) && !isSpeciesInsight(second.insight_type)) {
      return -1;
    }

    if (!isSpeciesInsight(first.insight_type) && isSpeciesInsight(second.insight_type)) {
      return 1;
    }

    return 0;
  });
}

function mergeRelatedInsights(insightsToMerge) {
  const hasGrowth = insightsToMerge.some((insight) => insight.insight_type === "growth");
  const sunlightLow = insightsToMerge.find((insight) => insight.insight_type === "species_sunlight_low");

  if (!hasGrowth || !sunlightLow) {
    return insightsToMerge;
  }

  return [
    {
      insight_type: "species_growth_sunlight",
      severity: "medium",
      message: `${sunlightLow.message} Growth has also slowed while sunlight decreased, so light is a likely factor to watch.`,
    },
    ...insightsToMerge.filter((insight) => !["growth", "species_sunlight_low"].includes(insight.insight_type)),
  ];
}

const defaultHealthScore = {
  score: 0,
  label: "Needs Attention",
  subscores: {
    current_health: 0,
    growth_trend: 0,
    care_consistency: 0,
    environment_fit: 0,
    risk: 0,
  },
  reasons: [],
};

const analysisModules = [
  {
    key: "health_score",
    title: "Health Score",
    description: "Explain the current score.",
    action: "Generate Health Score",
  },
  {
    key: "weekly_summary",
    title: "Weekly Summary",
    description: "Summarize recent changes.",
    action: "Generate Weekly Summary",
  },
  {
    key: "growth_trends",
    title: "Growth Trends",
    description: "Check growth direction.",
    action: "Analyze Growth Trends",
  },
  {
    key: "environment_conditions",
    title: "Environment Conditions",
    description: "Compare conditions to species needs.",
    action: "Analyze Environment Conditions",
  },
  {
    key: "health_risks",
    title: "Health Risks",
    description: "Look for repeated warning signs.",
    action: "Check Health Risks",
  },
];

function buildAnalysis(logs, backendInsights, healthScoreData = defaultHealthScore) {
  const orderedLogs = logs.slice().reverse();
  const latest = orderedLogs[orderedLogs.length - 1];
  const previous = orderedLogs[orderedLogs.length - 2];
  const recentLogs = orderedLogs.slice(-6);

  if (!latest) {
    return {
      overview: {
        healthScore: healthScoreData.score,
        healthLabel: healthScoreData.label,
        growthStage: "-",
        lastLoggedDate: "-",
        daysSinceLastWatering: "-",
        overallStatus: "No logs yet",
      },
      healthScore: healthScoreData,
      keyInsights: [],
      weeklySummary: {
        growth: "Add logs to summarize growth.",
        watering: "Add watering data to summarize care consistency.",
        environment: "Add environment data to summarize growing conditions.",
        health: "Add health data to summarize plant condition.",
      },
      recommendations: ["Add the first structured log for this plant."],
      alerts: [],
      timeline: [],
    };
  }

  const heightDelta = difference(latest, previous, "height_cm");
  const leafDelta = difference(latest, previous, "leaf_count");
  const sunlightDelta = difference(latest, previous, "sunlight_hours");
  const humidityDelta = difference(latest, previous, "humidity_percent");

  const keyInsights = sortInsightsForDisplay(mergeRelatedInsights(backendInsights)).map((insight) => ({
    title: insightTitle(insight.insight_type),
    observation: insight.message,
    possibleCause: insightCause(insight.insight_type),
    recommendation: insightRecommendation(insight.insight_type),
    severity: insight.severity,
    relatedMetrics: insightMetrics(insight.insight_type),
  }));

  if (keyInsights.length === 0 || keyInsights.every((insight) => insight.title === "Baseline")) {
    keyInsights.push({
      title: "Tracking baseline",
      observation: "There is not enough unusual movement yet to flag a strong issue.",
      possibleCause: "The available logs look stable or need more history.",
      recommendation: "Keep logging every few days so LeafLogic can compare growth and care patterns.",
      severity: "low",
      relatedMetrics: ["height", "watering", "sunlight", "health"],
    });
  }

  const weeklySummary = {
    growth: `Growth remains ${heightDelta !== null && heightDelta > 0 ? "positive" : "limited"} overall. Height is ${describeDelta(heightDelta, "cm")} and leaf count is ${describeDelta(leafDelta)} compared with the previous log.`,
    watering: latest.days_since_last_watering
      ? `Latest watering gap was ${latest.days_since_last_watering} day(s), with soil marked ${formatValue(latest.soil_moisture).toLowerCase()}.`
      : `Latest soil moisture is ${formatValue(latest.soil_moisture).toLowerCase()}; add watering gap data for consistency analysis.`,
    environment: `Recent environment is mixed: sunlight is ${describeDelta(sunlightDelta, "h")} and humidity is ${describeDelta(humidityDelta, "%")} compared with the previous log.`,
    health: `Latest self-assessment is ${formatValue(latest.overall_health).toLowerCase()}, with leaf condition ${formatValue(latest.leaf_condition).toLowerCase()}.`,
  };

  const alerts = [];
  if (latest.pest_signs && latest.pest_signs !== "None") alerts.push(`Pest signs: ${latest.pest_signs}.`);
  if (latest.disease_signs && latest.disease_signs !== "None") alerts.push(`Disease signs: ${latest.disease_signs}.`);
  if (["Very Dry", "Dry"].includes(latest.soil_moisture) && ["Drooping", "Wilting"].includes(latest.leaf_condition)) {
    alerts.push("Dry soil and stressed leaves were logged together.");
  }
  if (latest.humidity_percent !== null && latest.humidity_percent < 35) alerts.push("Humidity is below 35%.");

  const recommendations = [];
  if (latest.pest_signs && latest.pest_signs !== "None") recommendations.push("Inspect leaves closely and continue logging pest signs after treatment.");
  if (["Very Dry", "Dry"].includes(latest.soil_moisture)) recommendations.push("Check soil before the next watering and consider a steadier watering rhythm.");
  if (latest.humidity_percent !== null && latest.humidity_percent < 35) recommendations.push("Raise humidity slightly or move the plant away from dry airflow.");
  if (sunlightDelta !== null && sunlightDelta < 0) recommendations.push("Prioritize light: increase suitable sunlight exposure and check whether growth improves in the next two logs.");
  if (recommendations.length === 0) recommendations.push("Keep the current routine and add another log in a few days for better trend confidence.");

  return {
    overview: {
      healthScore: healthScoreData.score,
      healthLabel: healthScoreData.label,
      growthStage: latest.growth_stage || "-",
      lastLoggedDate: latest.log_date,
      daysSinceLastWatering: latest.days_since_last_watering ?? "-",
      overallStatus: alerts.length > 0 ? "Needs attention" : healthScoreData.label,
    },
    healthScore: healthScoreData,
    keyInsights,
    weeklySummary,
    recommendations,
    alerts,
    timeline: recentLogs,
  };
}

function SelectField({ name, label, value, onChange }) {
  return (
    <label>
      {label}
      <select name={name} value={value} onChange={onChange}>
        <option value="">Select</option>
        {options[name].map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function PlantDetail() {
  const { plantId } = useParams();
  const navigate = useNavigate();
  const [plant, setPlant] = useState(null);
  const [insights, setInsights] = useState([]);
  const [healthScore, setHealthScore] = useState(defaultHealthScore);
  const [analysisResults, setAnalysisResults] = useState({});
  const [analysisLoading, setAnalysisLoading] = useState({});
  const [expandedModules, setExpandedModules] = useState({});
  const [analysisError, setAnalysisError] = useState("");
  const [logForm, setLogForm] = useState(initialLog);
  const [imageFile, setImageFile] = useState(null);
  const [activeTab, setActiveTab] = useState("logs");
  const [activeLogStep, setActiveLogStep] = useState(0);
  const [selectedLog, setSelectedLog] = useState(null);
  const [editLogForm, setEditLogForm] = useState(initialLog);
  const [isEditingLog, setIsEditingLog] = useState(false);
  const [logDetailError, setLogDetailError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadPlant() {
    const [plantResponse, insightResponse, healthScoreResponse] = await Promise.all([
      api.get(`/plants/${plantId}`),
      api.get(`/plants/${plantId}/insights`),
      api.get(`/plants/${plantId}/health-score`),
    ]);

    setPlant(plantResponse.data);
    setInsights(insightResponse.data);
    setHealthScore(healthScoreResponse.data);
  }

  useEffect(() => {
    loadPlant()
      .catch((requestError) => {
        setError(requestError.response?.data?.detail || "Unable to load plant.");
      })
      .finally(() => setLoading(false));
  }, [plantId]);

  const latestLog = useMemo(() => plant?.logs?.[0], [plant]);
  const analysis = useMemo(
    () => buildAnalysis(plant?.logs || [], insights, healthScore),
    [plant, insights, healthScore]
  );

  const generateAnalysis = async (moduleKey) => {
    setAnalysisError("");
    setExpandedModules((current) => ({ ...current, [moduleKey]: true }));
    setAnalysisLoading((current) => ({ ...current, [moduleKey]: true }));

    try {
      await new Promise((resolve) => setTimeout(resolve, 450));
      const response = await api.get(`/plants/${plantId}/analysis/${moduleKey}`);
      setAnalysisResults((current) => ({ ...current, [moduleKey]: response.data }));
    } catch (requestError) {
      setAnalysisError(requestError.response?.data?.detail || "Unable to generate analysis.");
    } finally {
      setAnalysisLoading((current) => ({ ...current, [moduleKey]: false }));
    }
  };

  const toggleAnalysisModule = (moduleKey) => {
    setExpandedModules((current) => ({ ...current, [moduleKey]: !current[moduleKey] }));
  };

  const isAnalysisGenerated = (moduleKey) => Boolean(analysisResults[moduleKey]);
  const allAnalysisGenerated = analysisModules.every((module) => isAnalysisGenerated(module.key));

  const renderSectionAction = (moduleKey) => {
    const module = analysisModules.find((item) => item.key === moduleKey);
    const isLoading = analysisLoading[moduleKey];
    const hasResult = isAnalysisGenerated(moduleKey);

    return (
      <button
        className={hasResult ? "ghost-button" : "primary-button"}
        disabled={isLoading}
        type="button"
        onClick={() => generateAnalysis(moduleKey)}
      >
        {isLoading ? "Analyzing..." : hasResult ? "Refresh" : module.action}
      </button>
    );
  };

  const renderSectionLoading = (moduleKey) => (
    analysisLoading[moduleKey] ? (
      <div className="module-loading">
        <span />
        Checking recent logs and species rules...
      </div>
    ) : null
  );

  const renderLockedSection = (message) => (
    <div className="analysis-empty-state">
      {message}
    </div>
  );

  const renderAnalysisResult = (result) => {
    if (!result) return null;

    return (
      <div className={`analysis-result ${result.severity || "low"}`}>
        <div className="analysis-result-header">
          <h3>{result.title}</h3>
          {result.severity && <span>{result.severity}</span>}
        </div>
        <p>{result.summary}</p>

        {Object.keys(result.metrics || {}).length > 0 && (
          <dl className="result-metrics">
            {Object.entries(result.metrics).map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value ?? "-"}</dd>
              </div>
            ))}
          </dl>
        )}

        {result.alerts?.length > 0 && (
          <div className="result-block urgent">
            <strong>Alerts</strong>
            {result.alerts.map((alert) => <p key={alert}>{alert}</p>)}
          </div>
        )}

        {result.reasons?.length > 0 && (
          <div className="result-block">
            <strong>Why this matters</strong>
            {result.reasons.map((reason) => <p key={reason}>{reason}</p>)}
          </div>
        )}

        {result.recommendations?.length > 0 && (
          <div className="result-block next-steps">
            <strong>Next steps</strong>
            {result.recommendations.map((recommendation) => <p key={recommendation}>{recommendation}</p>)}
          </div>
        )}
      </div>
    );
  };

  const handleChange = (event) => {
    const { name, type, checked, value } = event.target;
    setLogForm({
      ...logForm,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleEditLogChange = (event) => {
    const { name, value } = event.target;
    setEditLogForm({
      ...editLogForm,
      [name]: value,
    });
  };

  const handleImageSelect = (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    setError("");
    setImageFile(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    handleImageSelect(event.dataTransfer.files?.[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const payload = buildLogPayload(logForm);

    try {
      if (imageFile) {
        const imageBody = new FormData();
        imageBody.append("image", imageFile);

        const imageResponse = await api.post(`/plants/${plantId}/images`, imageBody, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        payload.image_path = imageResponse.data.image_path;
      }

      await api.post(`/plants/${plantId}/logs`, payload);
      setLogForm(initialLog);
      setImageFile(null);
      setActiveLogStep(0);
      await loadPlant();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Unable to add log.");
    }
  };

  const handleSelectLog = (log) => {
    setSelectedLog(log);
    setEditLogForm(normalizeLogForForm(log));
    setIsEditingLog(false);
    setLogDetailError("");
  };

  const handleSaveLogEdit = async (event) => {
    event.preventDefault();
    setLogDetailError("");

    try {
      const response = await api.put(
        `/plants/${plantId}/logs/${selectedLog.id}`,
        buildLogPayload(editLogForm)
      );

      setSelectedLog(response.data);
      setEditLogForm(normalizeLogForForm(response.data));
      setIsEditingLog(false);
      await loadPlant();
    } catch (requestError) {
      setLogDetailError(requestError.response?.data?.detail || "Unable to update log.");
    }
  };

  const handleDeletePlant = async () => {
    const confirmed = window.confirm(`Delete ${plant.name}? This will also remove its logs.`);

    if (!confirmed) return;

    setDeleteError("");

    try {
      await api.delete(`/plants/${plantId}`);
      navigate("/");
    } catch (requestError) {
      setDeleteError(requestError.response?.data?.detail || "Unable to delete plant.");
    }
  };

  const goToNextStep = () => {
    setActiveLogStep((current) => Math.min(current + 1, logSteps.length - 1));
  };

  const goToPreviousStep = () => {
    setActiveLogStep((current) => Math.max(current - 1, 0));
  };

  const renderEditableField = (field) => {
    if (field.type === "select") {
      return (
        <SelectField
          key={field.key}
          name={field.key}
          label={field.label}
          value={editLogForm[field.key]}
          onChange={handleEditLogChange}
        />
      );
    }

    if (field.type === "textarea") {
      return (
        <label key={field.key}>
          {field.label}
          <textarea name={field.key} value={editLogForm[field.key]} onChange={handleEditLogChange} />
        </label>
      );
    }

    if (field.key === "image_path") {
      return (
        <label key={field.key}>
          {field.label}
          <input name={field.key} value={editLogForm[field.key]} onChange={handleEditLogChange} />
        </label>
      );
    }

    return (
      <label key={field.key}>
        {field.label}
        <input
          name={field.key}
          type={field.type}
          step={field.type === "number" ? "0.1" : undefined}
          value={editLogForm[field.key]}
          onChange={handleEditLogChange}
        />
      </label>
    );
  };

  if (loading) {
    return <main className="app-shell"><p className="muted">Loading plant...</p></main>;
  }

  if (!plant) {
    return <main className="app-shell"><p className="form-error">{error || "Plant not found."}</p></main>;
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">{plant.species}</p>
          <h1>{plant.name}</h1>
              <p className="muted">
                {plant.location || "No location set"}
                {plant.plant_type ? ` - ${plant.plant_type}` : ""}
                {plant.soil_type ? ` - ${plant.soil_type}` : ""}
                {plant.planted_date ? ` - planted ${plant.planted_date}` : ""}
              </p>
        </div>
        <div className="topbar-actions">
          <button className="danger-button" type="button" onClick={handleDeletePlant}>
            <Trash2 size={18} />
            <span>Delete</span>
          </button>
          <Link className="ghost-button link-button" to="/">
            <ArrowLeft size={18} />
            <span>Dashboard</span>
          </Link>
        </div>
      </header>

      {deleteError && <p className="form-error">{deleteError}</p>}

      <section className="summary-grid">
        <article className="metric-card">
          <div>
            <p>Latest height</p>
            <strong>{latestLog?.height_cm ?? "-"} cm</strong>
          </div>
        </article>
        <article className="metric-card">
          <div>
            <p>Latest leaves</p>
            <strong>{latestLog?.leaf_count ?? "-"}</strong>
          </div>
        </article>
        <article className="metric-card">
          <div>
            <p>Logs</p>
            <strong>{plant.logs.length}</strong>
          </div>
        </article>
      </section>

      <nav className="tab-list" aria-label="Plant detail sections">
        <button className={activeTab === "logs" ? "active" : ""} type="button" onClick={() => setActiveTab("logs")}>
          Logs
        </button>
        <button className={activeTab === "trends" ? "active" : ""} type="button" onClick={() => setActiveTab("trends")}>
          Trends
        </button>
      </nav>

      {activeTab === "trends" && (
        <section className="analysis-dashboard tab-panel">
          <section className="analysis-intro">
            <div>
              <h2>Analysis</h2>
              <p className="section-description">Choose what LeafLogic should evaluate.</p>
            </div>
            <span>{plant.logs.length} log{plant.logs.length === 1 ? "" : "s"} available</span>
          </section>

          <section>
            <h2>Recent metrics</h2>
            <p className="section-description">Latest logged values.</p>
            <div className="recent-metrics-row">
              <div><p>Last logged</p><strong>{latestLog?.log_date || "-"}</strong></div>
              <div><p>Growth stage</p><strong>{latestLog?.growth_stage || "-"}</strong></div>
              <div><p>Height</p><strong>{latestLog?.height_cm ?? "-"} cm</strong></div>
              <div><p>Leaves</p><strong>{latestLog?.leaf_count ?? "-"}</strong></div>
              <div><p>Watering gap</p><strong>{latestLog?.days_since_last_watering ?? "-"} d</strong></div>
              <div><p>Sunlight</p><strong>{latestLog?.sunlight_hours ?? "-"} h</strong></div>
            </div>
          </section>

          {analysisError && <p className="form-error">{analysisError}</p>}

          <section className="generated-analysis-stack">
            <section>
              <div className="analysis-section-heading">
                <div>
                  <h2>Plant overview</h2>
                  <p className="section-description">Current status and score breakdown.</p>
                </div>
                {renderSectionAction("health_score")}
              </div>
              {renderSectionLoading("health_score")}
              {isAnalysisGenerated("health_score") ? (
                <>
                  <div className="overview-grid">
                    <article className="health-score-card">
                      <p>Health score</p>
                      <strong>{analysis.overview.healthScore}</strong>
                      <span>/100</span>
                      <em>{analysis.overview.healthLabel}</em>
                    </article>
                    <article className="subscore-card"><span>Current</span><strong>{analysis.healthScore.subscores.current_health}<small>/100</small></strong></article>
                    <article className="subscore-card"><span>Growth</span><strong>{analysis.healthScore.subscores.growth_trend}<small>/100</small></strong></article>
                    <article className="subscore-card"><span>Care</span><strong>{analysis.healthScore.subscores.care_consistency}<small>/100</small></strong></article>
                    <article className="subscore-card"><span>Environment</span><strong>{analysis.healthScore.subscores.environment_fit}<small>/100</small></strong></article>
                    <article className="subscore-card"><span>Risk</span><strong>{analysis.healthScore.subscores.risk}<small>/100</small></strong></article>
                  </div>
                  <div className="overview-detail-grid">
                    <article className="overview-mini-card"><p>Growth stage</p><strong>{analysis.overview.growthStage}</strong></article>
                    <article className="overview-mini-card"><p>Last logged</p><strong>{analysis.overview.lastLoggedDate}</strong></article>
                    <article className="overview-mini-card"><p>Days since watering</p><strong>{analysis.overview.daysSinceLastWatering}</strong></article>
                    <article className="overview-mini-card"><p>Overall status</p><strong>{analysis.overview.overallStatus}</strong></article>
                  </div>
                  <div className="score-reasons">
                    {analysis.healthScore.reasons.map((reason) => (
                      <p key={reason}>{reason}</p>
                    ))}
                  </div>
                </>
              ) : (
                renderLockedSection("Generate the health score to show the overview dashboard.")
              )}
            </section>

            <section>
              <div className="analysis-section-heading">
                <div>
                  <h2>Recommendations and alerts</h2>
                  <p className="section-description">What needs attention first.</p>
                </div>
                {renderSectionAction("health_risks")}
              </div>
              {renderSectionLoading("health_risks")}
              {isAnalysisGenerated("health_risks") ? (
                <section className="priority-output">
                  <div>
                    <h2>Recommendations</h2>
                    <p className="section-description">What to do next.</p>
                    <div className="action-list">
                      {analysis.recommendations.map((recommendation) => (
                        <article className="recommendation-card" key={recommendation}>{recommendation}</article>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h2>Alerts</h2>
                    <p className="section-description">Issues to check first.</p>
                    <div className="action-list">
                      {analysis.alerts.length === 0 ? (
                        <article className="alert-card low">No urgent alerts from the latest logs.</article>
                      ) : analysis.alerts.map((alert) => (
                        <article className="alert-card high" key={alert}>{alert}</article>
                      ))}
                    </div>
                  </div>
                </section>
              ) : (
                renderLockedSection("Check health risks to show recommendations and alerts.")
              )}
            </section>

            <section>
              <div className="analysis-section-heading">
                <div>
                    <h2>Key insights</h2>
                    <p className="section-description">What the data suggests.</p>
                </div>
                {renderSectionAction("health_risks")}
              </div>
              {renderSectionLoading("health_risks")}
              {isAnalysisGenerated("health_risks") ? (
                    <div className="insight-card-grid">
                      {analysis.keyInsights.map((insight, index) => (
                        <article className={`analysis-insight ${insight.severity}`} key={`${insight.title}-${index}`}>
                          <div className="insight-title-row">
                            <h3>{insight.title}</h3>
                            <span>{insight.severity}</span>
                          </div>
                          <dl>
                            <div><dt>Observation</dt><dd>{insight.observation}</dd></div>
                            <div><dt>Possible cause</dt><dd>{insight.possibleCause}</dd></div>
                            <div><dt>Recommendation</dt><dd>{insight.recommendation}</dd></div>
                            <div><dt>Related metrics</dt><dd>{insight.relatedMetrics.join(", ")}</dd></div>
                          </dl>
                        </article>
                      ))}
                    </div>
              ) : (
                renderLockedSection("Check health risks to show key insights.")
              )}
            </section>

            <section>
              <div className="analysis-section-heading">
                <div>
                  <h2>Weekly summary</h2>
                  <p className="section-description">Recent changes at a glance.</p>
                </div>
                {renderSectionAction("weekly_summary")}
              </div>
              {renderSectionLoading("weekly_summary")}
              {isAnalysisGenerated("weekly_summary") ? (
                  <div className="summary-grid">
                    <article className="summary-card"><h3>Growth</h3><p>{analysis.weeklySummary.growth}</p></article>
                    <article className="summary-card"><h3>Watering</h3><p>{analysis.weeklySummary.watering}</p></article>
                    <article className="summary-card"><h3>Environment</h3><p>{analysis.weeklySummary.environment}</p></article>
                    <article className="summary-card"><h3>Health</h3><p>{analysis.weeklySummary.health}</p></article>
                  </div>
              ) : (
                renderLockedSection("Generate the weekly summary to compare recent changes.")
              )}
            </section>

            <section>
              <div className="analysis-section-heading">
                <div>
                  <h2>Trends</h2>
                  <p className="section-description">Charts grouped by topic.</p>
                </div>
                <div className="section-action-group">
                  {renderSectionAction("growth_trends")}
                  {renderSectionAction("environment_conditions")}
                </div>
              </div>
              {renderSectionLoading("growth_trends")}
              {renderSectionLoading("environment_conditions")}
              {(isAnalysisGenerated("growth_trends") || isAnalysisGenerated("environment_conditions")) ? (
                  <div className="trend-section-stack">
                    {trendGroups
                      .filter((group) => {
                        if (group.title === "Growth Trends") return isAnalysisGenerated("growth_trends");
                        if (group.title === "Care Trends") return isAnalysisGenerated("weekly_summary");
                        if (group.title === "Environment Trends") return isAnalysisGenerated("environment_conditions");
                        if (group.title === "Health Trends") return isAnalysisGenerated("health_risks");
                        return false;
                      })
                      .map((group) => (
                        <section className="trend-group" key={group.title}>
                          <h3>{group.title}</h3>
                          <div className="chart-grid">
                            {group.fields.map((field) => (
                              <MiniChart key={`${group.title}-${field.key}`} field={field.key} logs={plant.logs} {...field} />
                            ))}
                          </div>
                        </section>
                      ))}
                  </div>
              ) : (
                renderLockedSection("Analyze growth or environment conditions to show trend charts.")
              )}
            </section>

            <section>
              <div className="analysis-section-heading">
                <div>
                  <h2>Timeline</h2>
                  <p className="section-description">Recent logs in order.</p>
                </div>
              </div>
              {allAnalysisGenerated ? (
                  <div className="timeline-list">
                    {analysis.timeline.map((log) => (
                      <article className="timeline-item" key={log.id}>
                        <time>{log.log_date}</time>
                        <div>
                          <strong>{log.growth_stage || "Logged care"}</strong>
                          <p>
                            Height {formatValue(log.height_cm)} cm, leaves {formatValue(log.leaf_count)}, soil {formatValue(log.soil_moisture).toLowerCase()}, health {formatValue(log.overall_health).toLowerCase()}.
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
              ) : (
                renderLockedSection("Generate all analysis sections to unlock the full timeline.")
              )}
            </section>
          </section>
        </section>
      )}

      {activeTab === "logs" && (
        <section className="detail-grid tab-panel">
          <form className="form-card" onSubmit={handleSubmit}>
            <h2>Add log</h2>
            <p className="section-description">Add a new plant record.</p>
            <label>Log date<input type="date" name="log_date" value={logForm.log_date} onChange={handleChange} required /></label>

            <ol className="stepper" aria-label="Log form progress">
              {logSteps.map((step, index) => (
                <li className={index === activeLogStep ? "active" : index < activeLogStep ? "complete" : ""} key={step}>
                  <button type="button" onClick={() => setActiveLogStep(index)}>
                    <span>{index + 1}</span>
                    {step}
                  </button>
                </li>
              ))}
            </ol>

            {activeLogStep === 0 && (
              <section className="form-section">
                <h3>Growth</h3>
                <div className="field-grid">
                  <label>Height cm<input type="number" step="0.1" name="height_cm" value={logForm.height_cm} onChange={handleChange} /></label>
                  <label>Leaf count<input type="number" name="leaf_count" value={logForm.leaf_count} onChange={handleChange} /></label>
                  <label>Flower count<input type="number" name="flower_count" value={logForm.flower_count} onChange={handleChange} /></label>
                  <label>Fruit count<input type="number" name="fruit_count" value={logForm.fruit_count} onChange={handleChange} /></label>
                  <SelectField name="growth_stage" label="Growth stage" value={logForm.growth_stage} onChange={handleChange} />
                </div>
              </section>
            )}

            {activeLogStep === 1 && (
              <section className="form-section">
                <h3>Watering</h3>
                <div className="field-grid">
                  <label>Watering amount ml<input type="number" step="0.1" name="watering_amount_ml" value={logForm.watering_amount_ml} onChange={handleChange} /></label>
                  <label>Days since last watering<input type="number" step="0.1" name="days_since_last_watering" value={logForm.days_since_last_watering} onChange={handleChange} /></label>
                  <SelectField name="soil_moisture" label="Soil moisture" value={logForm.soil_moisture} onChange={handleChange} />
                </div>
              </section>
            )}

            {activeLogStep === 2 && (
              <section className="form-section">
                <h3>Environment</h3>
                <div className="field-grid">
                  <label>Sunlight hours per day<input type="number" step="0.1" name="sunlight_hours" value={logForm.sunlight_hours} onChange={handleChange} /></label>
                  <label>Temperature C<input type="number" step="0.1" name="temperature_c" value={logForm.temperature_c} onChange={handleChange} /></label>
                  <label>Humidity %<input type="number" step="0.1" name="humidity_percent" value={logForm.humidity_percent} onChange={handleChange} /></label>
                  <SelectField name="rain_exposure" label="Rain exposure" value={logForm.rain_exposure} onChange={handleChange} />
                  <SelectField name="wind_exposure" label="Wind exposure" value={logForm.wind_exposure} onChange={handleChange} />
                </div>
              </section>
            )}

            {activeLogStep === 3 && (
              <section className="form-section">
                <h3>Health</h3>
                <div className="field-grid">
                  <SelectField name="leaf_color" label="Leaf color" value={logForm.leaf_color} onChange={handleChange} />
                  <SelectField name="leaf_condition" label="Leaf condition" value={logForm.leaf_condition} onChange={handleChange} />
                  <SelectField name="stem_condition" label="Stem condition" value={logForm.stem_condition} onChange={handleChange} />
                  <SelectField name="pest_signs" label="Pest signs" value={logForm.pest_signs} onChange={handleChange} />
                  <SelectField name="disease_signs" label="Disease signs" value={logForm.disease_signs} onChange={handleChange} />
                  <SelectField name="overall_health" label="Overall health" value={logForm.overall_health} onChange={handleChange} />
                </div>
              </section>
            )}

            {activeLogStep === 4 && (
              <section className="form-section">
                <h3>Care actions</h3>
                <div className="field-grid">
                  <SelectField name="fertilizer_used" label="Fertilizer used" value={logForm.fertilizer_used} onChange={handleChange} />
                  <SelectField name="pruning_status" label="Pruning status" value={logForm.pruning_status} onChange={handleChange} />
                  <SelectField name="pesticide_used" label="Pesticide used" value={logForm.pesticide_used} onChange={handleChange} />
                </div>
              </section>
            )}

            {activeLogStep === 5 && (
              <section className="form-section">
                <h3>Media</h3>
                <label className="upload-dropzone" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
                  <input
                    accept="image/*"
                    type="file"
                    onChange={(event) => handleImageSelect(event.target.files?.[0])}
                  />
                  <UploadCloud size={28} />
                  <span>{imageFile ? imageFile.name : "Drop an image here or browse"}</span>
                  <small>Visual record only</small>
                </label>
              </section>
            )}

            {activeLogStep === 6 && (
              <section className="form-section">
                <h3>Notes</h3>
                <label>General notes<textarea name="general_notes" value={logForm.general_notes} onChange={handleChange} /></label>
              </section>
            )}

            {error && <p className="form-error">{error}</p>}

            <div className="wizard-actions">
              <button className="ghost-button" disabled={activeLogStep === 0} type="button" onClick={goToPreviousStep}>
                <ChevronLeft size={18} />
                <span>Previous</span>
              </button>

              {activeLogStep < logSteps.length - 1 ? (
                <button className="primary-button" type="button" onClick={goToNextStep}>
                  <span>Next</span>
                  <ChevronRight size={18} />
                </button>
              ) : (
                <button className="primary-button" type="submit">
                  <Save size={18} />
                  <span>Save log</span>
                </button>
              )}
            </div>
          </form>

          <section className="log-panel">
            <h2>Past logs</h2>
            <p className="section-description">Review or edit old logs.</p>
            {selectedLog && (
              <section className="log-detail-card">
                <header className="log-detail-header">
                  <div>
                    <p className="eyebrow">Selected log</p>
                    <h3>{selectedLog.log_date}</h3>
                  </div>
                  <div className="topbar-actions">
                    {isEditingLog ? (
                      <button className="ghost-button" type="button" onClick={() => {
                        setIsEditingLog(false);
                        setEditLogForm(normalizeLogForForm(selectedLog));
                      }}>
                        <X size={18} />
                        <span>Cancel</span>
                      </button>
                    ) : (
                      <button className="ghost-button" type="button" onClick={() => setIsEditingLog(true)}>
                        <Pencil size={18} />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                </header>

                {logDetailError && <p className="form-error">{logDetailError}</p>}

                {isEditingLog ? (
                  <form className="log-edit-form" onSubmit={handleSaveLogEdit}>
                    <label>
                      Log date
                      <input type="date" name="log_date" value={editLogForm.log_date} onChange={handleEditLogChange} required />
                    </label>

                    {logDetailGroups.map((group) => (
                      <section className="form-section" key={group.title}>
                        <h3>{group.title}</h3>
                        <div className={group.title === "Notes" ? "" : "field-grid"}>
                          {group.fields.map(renderEditableField)}
                        </div>
                      </section>
                    ))}

                    <button className="primary-button" type="submit">
                      <Save size={18} />
                      <span>Save changes</span>
                    </button>
                  </form>
                ) : (
                  <div className="log-detail-groups">
                    {logDetailGroups.map((group) => (
                      <section className="log-detail-group" key={group.title}>
                        <h3>{group.title}</h3>
                        <dl>
                          {group.fields.map((field) => (
                            <div key={field.key}>
                              <dt>{field.label}</dt>
                              <dd>{selectedLog[field.key] ?? "-"}</dd>
                            </div>
                          ))}
                        </dl>
                      </section>
                    ))}
                  </div>
                )}
              </section>
            )}

            <div className="log-list">
              {plant.logs.map((log) => (
                <button
                  className={`log-entry log-entry-button ${selectedLog?.id === log.id ? "active" : ""}`}
                  key={log.id}
                  type="button"
                  onClick={() => handleSelectLog(log)}
                >
                  <h3>{log.log_date}</h3>
                  <p>{log.general_notes || log.health_notes || "No notes recorded."}</p>
                  <dl>
                    <div><dt>Height</dt><dd>{log.height_cm ?? "-"} cm</dd></div>
                    <div><dt>Leaves</dt><dd>{log.leaf_count ?? "-"}</dd></div>
                    <div><dt>Water</dt><dd>{log.watering_amount_ml ?? "-"} ml</dd></div>
                    <div><dt>Sun</dt><dd>{log.sunlight_hours ?? "-"} h</dd></div>
                    <div><dt>Stage</dt><dd>{log.growth_stage || "-"}</dd></div>
                    <div><dt>Health</dt><dd>{log.overall_health || "-"}</dd></div>
                  </dl>
                  {log.image_path && (
                    <p className="image-record">
                      <ImagePlus size={16} />
                      <span>{log.image_path}</span>
                    </p>
                  )}
                </button>
              ))}
            </div>
          </section>
        </section>
      )}
    </main>
  );
}

export default PlantDetail;
