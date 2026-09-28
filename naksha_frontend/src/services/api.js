import axios from "axios";


// ============================================================
// API BASE URL
// ============================================================
//
// For local development the FastAPI server is running at:
// http://127.0.0.1:8000
//
// Later, when deployed, we can change this through:
// REACT_APP_API_BASE_URL
// ============================================================

const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  "http://127.0.0.1:8000";


export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});


// ============================================================
// BASIC API
// ============================================================

export async function getApiHealth() {
  const response = await api.get("/health");
  return response.data;
}


export async function getApiConfig() {
  const response = await api.get("/config");
  return response.data;
}


// ============================================================
// LAYER METADATA
// ============================================================

export async function getLayers() {
  const response = await api.get("/layers");
  return response.data;
}


export async function getRecommendedLayers(purpose) {
  const response = await api.get(
    `/layers/recommended/${encodeURIComponent(purpose)}`
  );

  return response.data;
}


// ============================================================
// SPATIAL LAYERS
// ============================================================

export async function getLayerData(
  tableName,
  params = {}
) {
  if (!tableName) {
    throw new Error("tableName is required.");
  }

  const response = await api.get(
    `/layers/data/${encodeURIComponent(tableName)}`,
    {
      params,
    }
  );

  return response.data;
}


// ============================================================
// TABULAR RECORDS
// ============================================================

export async function getTableRecords(tableName) {
  if (!tableName) {
    throw new Error("tableName is required.");
  }

  const response = await api.get(
    `/records/${encodeURIComponent(tableName)}`
  );

  return response.data;
}


// ============================================================
// IMAGERY METADATA
// ============================================================

export async function getImageryMetadata() {
  const response = await api.get("/imagery");
  return response.data;
}


// ============================================================
// PARCEL DETAIL
// ============================================================

export async function getParcelDetail(parcelId) {
  if (!parcelId) {
    throw new Error("parcelId is required.");
  }

  const response = await api.get(
    `/parcels/${encodeURIComponent(parcelId)}`
  );

  return response.data;
}


// ============================================================
// EXISTING ANALYTICS
// ============================================================

export async function getEncroachments() {
  const response = await api.get(
    "/analytics/encroachments"
  );

  return response.data;
}


export async function getBufferViolations(
  bufferMeters
) {
  if (
    bufferMeters === undefined ||
    bufferMeters === null
  ) {
    throw new Error("bufferMeters is required.");
  }

  const response = await api.get(
    `/analytics/buffer-violation/${encodeURIComponent(
      bufferMeters
    )}`
  );

  return response.data;
}


export async function getAuditReport() {
  const response = await api.get(
    "/analytics/audit-report"
  );

  return response.data;
}


// ============================================================
// AOI ANALYSIS
// ============================================================

export async function runAOIAnalysis(payload) {
  if (!payload) {
    throw new Error(
      "AOI analysis payload is required."
    );
  }

  const response = await api.post(
    "/analytics/aoi",
    payload
  );

  return response.data;
}


// ============================================================
// CONFLICT DETECTION
// ============================================================

export async function refreshConflicts() {
  const response = await api.post(
    "/analytics/conflicts/refresh"
  );

  return response.data;
}


export async function getConflicts(params = {}) {
  const response = await api.get(
    "/analytics/conflicts",
    {
      params,
    }
  );

  return response.data;
}


// ============================================================
// REPORTS
// ============================================================

export async function downloadLayerReport(
  payload
) {
  const response = await api.post(
    "/analytics/reports/layer",
    payload,
    {
      responseType: "blob",
    }
  );

  return response;
}


export async function downloadCombinedReport(
  payload
) {
  const response = await api.post(
    "/analytics/reports/combined",
    payload,
    {
      responseType: "blob",
    }
  );

  return response;
}


export default api;