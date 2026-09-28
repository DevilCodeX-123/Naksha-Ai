export const MAP_LAYER_CONFIG = {

  parcels: {
    id: 'parcels',
    table: 'parcels',
    name: 'Cadastral Parcels',
    category: 'Land & Records',
    type: 'polygon',
    map: true,
    analysis: true,
    endpointType: 'spatial',
  },

  buildings: {
    id: 'buildings',
    table: 'buildings',
    name: 'Building Footprints',
    category: 'Built Environment',
    type: 'polygon',
    map: true,
    analysis: true,
    endpointType: 'spatial',
  },

  roads: {
    id: 'roads',
    table: 'roads',
    name: 'Road Network',
    category: 'Infrastructure',
    type: 'line',
    map: true,
    analysis: true,
    endpointType: 'spatial',
  },

  utilities: {
    id: 'utilities',
    table: 'utilities',
    name: 'Utility Network',
    category: 'Infrastructure',
    type: 'line',
    map: true,
    analysis: true,
    endpointType: 'spatial',
  },

  gnss_points: {
    id: 'gnss_points',
    table: 'gnss_points',
    name: 'GNSS / CORS',
    category: 'Survey & Verification',
    type: 'point',
    map: true,
    analysis: true,
    endpointType: 'spatial',
  },

  ground_truth: {
    id: 'ground_truth',
    table: 'ground_truth',
    name: 'Ground Truthing',
    category: 'Survey & Verification',
    type: 'point',
    map: true,
    analysis: true,
    endpointType: 'spatial',
  },

  ai_features: {
    id: 'ai_features',
    table: 'ai_features',
    name: 'AI-Generated Features',
    category: 'AI / Intelligence',
    type: 'polygon',
    map: true,
    analysis: true,
    endpointType: 'spatial',
  },

  municipal_records: {
    id: 'municipal_records',
    table: 'municipal_records',
    name: 'Municipal Records',
    category: 'Land & Records',
    type: 'mixed',
    map: true,
    analysis: true,
    endpointType: 'spatial',
  },

  imagery_metadata: {
    id: 'imagery_metadata',
    table: 'imagery_metadata',
    name: 'Imagery / ORI Coverage',
    category: 'Imagery & Elevation',
    type: 'polygon',
    map: true,
    analysis: true,
    endpointType: 'imagery',
  },

  revenue_records: {
    id: 'revenue_records',
    table: 'revenue_records',
    name: 'Revenue / RoR Records',
    category: 'Land & Records',
    type: 'table',
    map: false,
    analysis: true,
    endpointType: 'records',
  },

  building_changes: {
    id: 'building_changes',
    table: 'building_changes',
    name: 'Building Change Detection',
    category: 'AI / Intelligence',
    type: 'mixed',
    map: true,
    analysis: true,
    endpointType: 'spatial',
  },

};


// ============================================================
// LAYER CATEGORIES
// ============================================================

export const LAYER_CATEGORIES = [
  'Land & Records',
  'Analysis & AOI',
  'Imagery & Elevation',
  'Built Environment',
  'Infrastructure',
  'Survey & Verification',
  'AI / Intelligence',
];


// ============================================================
// ANALYSIS-CAPABLE LAYERS
// ============================================================

export const ANALYSIS_LAYER_IDS = Object.values(
  MAP_LAYER_CONFIG
)
  .filter((layer) => layer.analysis)
  .map((layer) => layer.id);


// ============================================================
// MAP-CAPABLE LAYERS
// ============================================================

export const MAP_LAYER_IDS = Object.values(
  MAP_LAYER_CONFIG
)
  .filter((layer) => layer.map)
  .map((layer) => layer.id);


// ============================================================
// HELPER
// ============================================================

export function getLayerConfig(layerId) {
  return MAP_LAYER_CONFIG[layerId] || null;
}