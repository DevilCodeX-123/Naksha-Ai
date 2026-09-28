import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import * as maplibregl from 'maplibre-gl';
import axios from 'axios';

import {
  ChevronDown,
  ChevronRight,
  Crosshair,
  Save,
  Trash2,
  MapPinned,
  SquareMousePointer,
  FileText,
  LocateFixed,
} from 'lucide-react';

import 'maplibre-gl/dist/maplibre-gl.css';

import AdministrativeSelector from '../mapping/AdministrativeSelector';
import { MAP_LAYER_CONFIG } from '../../config/layerConfig.js';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';

const DEFAULT_COUNTRY = 'India';

const AOI_SOURCE_ID = 'naksha-aoi-preview';
const AOI_FILL_LAYER_ID = 'naksha-aoi-fill';
const AOI_LINE_LAYER_ID = 'naksha-aoi-line';
const AOI_POINTS_LAYER_ID = 'naksha-aoi-points';

const SAVED_LOCATIONS_KEY =
  'naksha_saved_locations';

const SAVED_POLYGONS_KEY =
  'naksha_saved_polygons';

/*/* ============================================================
   LAYER CATEGORIES
   ============================================================ */

const LAYER_GROUP_DEFINITIONS = [
  {
    title: '🗺️ LAND & RECORDS',
    layerIds: [
      'parcels',
      'municipal_records',
      'revenue_records',
    ],
  },

  {
    title: '🎯 ANALYSIS & AOI',
    layerIds: [
      'aoi',
    ],
  },

  {
    title: '🛰️ IMAGERY & ELEVATION',
    layerIds: [
      'imagery_metadata',
    ],
  },

  {
    title: '🏢 BUILT ENVIRONMENT',
    layerIds: [
      'buildings',
      'building_changes',
    ],
  },

  {
    title: '🚧 INFRASTRUCTURE',
    layerIds: [
      'roads',
      'utilities',
    ],
  },

  {
    title: '📍 SURVEY & VERIFICATION',
    layerIds: [
      'gnss_points',
      'ground_truth',
    ],
  },

  {
    title: '🤖 AI / INTELLIGENCE',
    layerIds: [
      'ai_features',
    ],
  },
];


const LAYER_CATEGORIES =
  LAYER_GROUP_DEFINITIONS.map(
    category => ({
      title: category.title,

      layers: category.layerIds
        .map(layerId => {
          if (layerId === 'aoi') {
            return {
              id: 'aoi',
              name: 'Survey / AOI',
              isReal: false,
            };
          }

          const config =
            MAP_LAYER_CONFIG[layerId];

          if (!config) {
            return null;
          }

          return {
            ...config,

            /*
             * The frontend now decides whether the layer
             * is spatial/record/imagery from layer.js.
             */
            isReal:
              config.endpointType ||
              'spatial',
          };
        })
        .filter(Boolean),
    })
  );
/* ============================================================
   STORAGE HELPERS
   ============================================================ */

function readStorage(key) {
  try {
    const raw = localStorage.getItem(key);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch (error) {
    console.error(
      `Unable to read ${key}:`,
      error
    );

    return [];
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify(value)
    );
  } catch (error) {
    console.error(
      `Unable to save ${key}:`,
      error
    );
  }
}

/* ============================================================
   YOUR WORK PANEL
   ============================================================ */

function YourWorkPanel({
  currentSelection,
  polygonPoints,
  onLoadLocation,
  onStartPolygon,
  onClearPolygon,
  onAddCoordinatePoint,
  onAddPlacePoint,
  onLoadPolygon,
}) {
  const [
    savedLocations,
    setSavedLocations,
  ] = useState([]);

  const [
    savedPolygons,
    setSavedPolygons,
  ] = useState([]);

  const [
    locationName,
    setLocationName,
  ] = useState('');

  const [
    polygonName,
    setPolygonName,
  ] = useState('');

  const [
    pointLatitude,
    setPointLatitude,
  ] = useState('');

  const [
    pointLongitude,
    setPointLongitude,
  ] = useState('');

  const [
    pointPlace,
    setPointPlace,
  ] = useState('');

  const [
    placeLoading,
    setPlaceLoading,
  ] = useState(false);

  useEffect(() => {
    setSavedLocations(
      readStorage(
        SAVED_LOCATIONS_KEY
      )
    );

    setSavedPolygons(
      readStorage(
        SAVED_POLYGONS_KEY
      )
    );
  }, []);

  function saveCurrentLocation() {
    const coordinates =
      currentSelection?.coordinates;

    if (!coordinates) {
      alert(
        'Select a coordinate or a mapped location first.'
      );

      return;
    }

    if (!locationName.trim()) {
      alert(
        'Enter a name for this location.'
      );

      return;
    }

    const location = {
      id:
        crypto.randomUUID(),
      name:
        locationName.trim(),
      latitude:
        coordinates.latitude,
      longitude:
        coordinates.longitude,
      context:
        currentSelection,
      createdAt:
        new Date().toISOString(),
    };

    const next = [
      ...savedLocations,
      location,
    ];

    setSavedLocations(next);

    writeStorage(
      SAVED_LOCATIONS_KEY,
      next
    );

    setLocationName('');
  }

  function deleteLocation(id) {
    const next =
      savedLocations.filter(
        item => item.id !== id
      );

    setSavedLocations(next);

    writeStorage(
      SAVED_LOCATIONS_KEY,
      next
    );
  }

  function saveCurrentPolygon() {
    if (polygonPoints.length < 3) {
      alert(
        'A polygon requires at least three points.'
      );

      return;
    }

    if (!polygonName.trim()) {
      alert(
        'Enter a name for this polygon.'
      );

      return;
    }

    const polygon = {
      id:
        crypto.randomUUID(),
      name:
        polygonName.trim(),
      points:
        polygonPoints,
      createdAt:
        new Date().toISOString(),
    };

    const next = [
      ...savedPolygons,
      polygon,
    ];

    setSavedPolygons(next);

    writeStorage(
      SAVED_POLYGONS_KEY,
      next
    );

    setPolygonName('');
  }

  function deletePolygon(id) {
    const next =
      savedPolygons.filter(
        item => item.id !== id
      );

    setSavedPolygons(next);

    writeStorage(
      SAVED_POLYGONS_KEY,
      next
    );
  }

  async function addPlacePoint() {
    if (!pointPlace.trim()) {
      alert(
        'Enter a place name first.'
      );

      return;
    }

    if (!onAddPlacePoint) {
      return;
    }

    setPlaceLoading(true);

    try {
      await onAddPlacePoint(
        pointPlace.trim()
      );

      setPointPlace('');
    } catch (error) {
      console.error(
        'Place lookup failed:',
        error
      );

      alert(
        'The place could not be located.'
      );
    } finally {
      setPlaceLoading(false);
    }
  }

  return (
    <div
      style={{
        paddingTop: '6px',
      }}
    >
      <div
        style={{
          marginBottom: '14px',
        }}
      >
        <h2
          style={{
            margin:
              '0 0 5px 0',
            color:
              '#0f172a',
            fontSize:
              '1.1rem',
            fontWeight:
              '700',
          }}
        >
          Your Work
        </h2>

        <div
          style={{
            fontSize:
              '11px',
            color:
              '#64748b',
            lineHeight:
              1.45,
          }}
        >
          Save important locations and analysis
          polygons for later access.
        </div>
      </div>

      {/* ======================================================
          SAVED LOCATION
          ====================================================== */}

      <div
        style={{
          padding:
            '14px',
          border:
            '1px solid #e2e8f0',
          borderRadius:
            '8px',
          background:
            '#ffffff',
          marginBottom:
            '12px',
        }}
      >
        <div
          style={{
            display:
              'flex',
            alignItems:
              'center',
            gap:
              '7px',
            fontSize:
              '12px',
            fontWeight:
              '700',
            color:
              '#334155',
            marginBottom:
              '9px',
          }}
        >
          <MapPinned
            size={15}
            color="#2563eb"
          />
          Save Current Location
        </div>

        <input
          value={
            locationName
          }
          onChange={event =>
            setLocationName(
              event.target.value
            )
          }
          placeholder="Name this location"
          style={{
            width:
              '100%',
            boxSizing:
              'border-box',
            padding:
              '9px 10px',
            border:
              '1px solid #cbd5e1',
            borderRadius:
              '6px',
            fontSize:
              '12px',
            marginBottom:
              '8px',
          }}
        />

        <button
          type="button"
          onClick={
            saveCurrentLocation
          }
          style={{
            width:
              '100%',
            display:
              'flex',
            alignItems:
              'center',
            justifyContent:
              'center',
            gap:
              '6px',
            padding:
              '9px',
            border:
              'none',
            borderRadius:
              '6px',
            background:
              '#2563eb',
            color:
              '#ffffff',
            fontSize:
              '12px',
            fontWeight:
              '600',
            cursor:
              'pointer',
          }}
        >
          <Save
            size={14}
          />
          Save Location
        </button>
      </div>

      {/* ======================================================
          SAVED LOCATIONS
          ====================================================== */}

      {savedLocations.length >
        0 && (
        <div
          style={{
            marginBottom:
              '14px',
          }}
        >
          <div
            style={{
              fontSize:
                '11px',
              fontWeight:
                '700',
              color:
                '#475569',
              marginBottom:
                '7px',
            }}
          >
            Saved Locations
          </div>

          {savedLocations.map(
            location => (
              <div
                key={
                  location.id
                }
                style={{
                  padding:
                    '9px 10px',
                  border:
                    '1px solid #e2e8f0',
                  borderRadius:
                    '6px',
                  marginBottom:
                    '6px',
                  background:
                    '#f8fafc',
                }}
              >
                <div
                  style={{
                    fontSize:
                      '12px',
                    fontWeight:
                      '700',
                    color:
                      '#0f172a',
                  }}
                >
                  {location.name}
                </div>

                <div
                  style={{
                    marginTop:
                      '3px',
                    fontSize:
                      '10px',
                    color:
                      '#64748b',
                  }}
                >
                  {location.latitude}
                  {', '}
                  {location.longitude}
                </div>

                <div
                  style={{
                    display:
                      'flex',
                    gap:
                      '6px',
                    marginTop:
                      '7px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      onLoadLocation(
                        location
                      )
                    }
                    style={{
                      flex:
                        1,
                      border:
                        '1px solid #bfdbfe',
                      borderRadius:
                        '5px',
                      background:
                        '#eff6ff',
                      color:
                        '#1d4ed8',
                      padding:
                        '6px',
                      cursor:
                        'pointer',
                      fontSize:
                        '10px',
                    }}
                  >
                    Open
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      deleteLocation(
                        location.id
                      )
                    }
                    style={{
                      border:
                        '1px solid #fecaca',
                      borderRadius:
                        '5px',
                      background:
                        '#fef2f2',
                      color:
                        '#b91c1c',
                      padding:
                        '6px 9px',
                      cursor:
                        'pointer',
                    }}
                  >
                    <Trash2
                      size={12}
                    />
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* ======================================================
          POLYGON WORKSPACE
          ====================================================== */}

      <div
        style={{
          padding:
            '14px',
          border:
            '1px solid #e2e8f0',
          borderRadius:
            '8px',
          background:
            '#ffffff',
          marginBottom:
            '14px',
        }}
      >
        <div
          style={{
            display:
              'flex',
            alignItems:
              'center',
            gap:
              '7px',
            fontSize:
              '12px',
            fontWeight:
              '700',
            color:
              '#334155',
            marginBottom:
              '9px',
          }}
        >
          <SquareMousePointer
            size={15}
            color="#2563eb"
          />
          Polygon Workspace
        </div>

        <button
          type="button"
          onClick={
            onStartPolygon
          }
          style={{
            width:
              '100%',
            padding:
              '9px',
            border:
              '1px solid #2563eb',
            borderRadius:
              '6px',
            background:
              '#eff6ff',
            color:
              '#1d4ed8',
            fontSize:
              '12px',
            fontWeight:
              '600',
            cursor:
              'pointer',
            marginBottom:
              '10px',
          }}
        >
          Start Polygon Selection
        </button>

        <div
          style={{
            fontSize:
              '10px',
            color:
              '#64748b',
            marginBottom:
              '8px',
            lineHeight:
              1.4,
          }}
        >
          Add polygon points from the map, by
          coordinates, or by place name.
        </div>

        {/* POINT BY COORDINATES */}

        <div
          style={{
            padding:
              '10px',
            background:
              '#f8fafc',
            borderRadius:
              '6px',
            marginBottom:
              '8px',
          }}
        >
          <div
            style={{
              fontSize:
                '10px',
              fontWeight:
                '700',
              color:
                '#475569',
              marginBottom:
                '6px',
            }}
          >
            Add Point by Coordinates
          </div>

          <div
            style={{
              display:
                'flex',
              gap:
                '6px',
              marginBottom:
                '6px',
            }}
          >
            <input
              type="number"
              step="any"
              value={
                pointLatitude
              }
              onChange={event =>
                setPointLatitude(
                  event.target.value
                )
              }
              placeholder="Latitude"
              style={{
                flex:
                  1,
                minWidth:
                  0,
                padding:
                  '7px',
                border:
                  '1px solid #cbd5e1',
                borderRadius:
                  '5px',
                fontSize:
                  '10px',
              }}
            />

            <input
              type="number"
              step="any"
              value={
                pointLongitude
              }
              onChange={event =>
                setPointLongitude(
                  event.target.value
                )
              }
              placeholder="Longitude"
              style={{
                flex:
                  1,
                minWidth:
                  0,
                padding:
                  '7px',
                border:
                  '1px solid #cbd5e1',
                borderRadius:
                  '5px',
                fontSize:
                  '10px',
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              const lat =
                Number(
                  pointLatitude
                );

              const lng =
                Number(
                  pointLongitude
                );

              if (
                !Number.isFinite(
                  lat
                ) ||
                !Number.isFinite(
                  lng
                ) ||
                lat < -90 ||
                lat > 90 ||
                lng < -180 ||
                lng > 180
              ) {
                alert(
                  'Enter valid latitude and longitude.'
                );

                return;
              }

              onAddCoordinatePoint(
                [lng, lat]
              );

              setPointLatitude(
                ''
              );

              setPointLongitude(
                ''
              );
            }}
            style={{
              width:
                '100%',
              padding:
                '7px',
              border:
                'none',
              borderRadius:
                '5px',
              background:
                '#2563eb',
              color:
                '#ffffff',
              fontSize:
                '10px',
              fontWeight:
                '600',
              cursor:
                'pointer',
            }}
          >
            Add Coordinate Point
          </button>
        </div>

        {/* POINT BY PLACE */}

        <div
          style={{
            padding:
              '10px',
            background:
              '#f8fafc',
            borderRadius:
              '6px',
            marginBottom:
              '10px',
          }}
        >
          <div
            style={{
              fontSize:
                '10px',
              fontWeight:
                '700',
              color:
                '#475569',
              marginBottom:
                '6px',
            }}
          >
            Add Point by Place
          </div>

          <input
            type="text"
            value={
              pointPlace
            }
            onChange={event =>
              setPointPlace(
                event.target.value
              )
            }
            placeholder="e.g. Albert Hall, Jaipur"
            style={{
              width:
                '100%',
              boxSizing:
                'border-box',
              padding:
                '7px',
              border:
                '1px solid #cbd5e1',
              borderRadius:
                '5px',
              fontSize:
                '10px',
              marginBottom:
                '6px',
            }}
          />

          <button
            type="button"
            disabled={
              placeLoading
            }
            onClick={
              addPlacePoint
            }
            style={{
              width:
                '100%',
              padding:
                '7px',
              border:
                'none',
              borderRadius:
                '5px',
              background:
                placeLoading
                  ? '#94a3b8'
                  : '#475569',
              color:
                '#ffffff',
              fontSize:
                '10px',
              fontWeight:
                '600',
              cursor:
                placeLoading
                  ? 'default'
                  : 'pointer',
            }}
          >
            {placeLoading
              ? 'Locating...'
              : 'Add Place Point'}
          </button>
        </div>

        {/* POLYGON STATUS */}

        <div
          style={{
            fontSize:
              '10px',
            color:
              polygonPoints.length >= 3
                ? '#166534'
                : '#64748b',
            marginBottom:
              '8px',
          }}
        >
          {polygonPoints.length}
          {' '}
          polygon point
          {polygonPoints.length === 1
            ? ''
            : 's'}
        </div>

        <input
          type="text"
          value={
            polygonName
          }
          onChange={event =>
            setPolygonName(
              event.target.value
            )
          }
          placeholder="Name this polygon"
          style={{
            width:
              '100%',
            boxSizing:
              'border-box',
            padding:
              '8px',
            border:
              '1px solid #cbd5e1',
            borderRadius:
              '5px',
            fontSize:
              '11px',
            marginBottom:
              '7px',
          }}
        />

        <div
          style={{
            display:
              'flex',
            gap:
              '6px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (
                polygonPoints.length <
                3
              ) {
                alert(
                  'A polygon needs at least three points.'
                );

                return;
              }

              if (
                !polygonName.trim()
              ) {
                alert(
                  'Enter a name for the polygon.'
                );

                return;
              }

              const polygon = {
                id:
                  crypto.randomUUID(),
                name:
                  polygonName.trim(),
                points:
                  polygonPoints,
                createdAt:
                  new Date().toISOString(),
              };

              const current =
                readStorage(
                  SAVED_POLYGONS_KEY
                );

              const next = [
                ...current,
                polygon,
              ];

              writeStorage(
                SAVED_POLYGONS_KEY,
                next
              );

              setSavedPolygons(
                next
              );

              setPolygonName('');
            }}
            style={{
              flex:
                1,
              padding:
                '8px',
              border:
                'none',
              borderRadius:
                '5px',
              background:
                '#16a34a',
              color:
                '#ffffff',
              fontSize:
                '10px',
              fontWeight:
                '600',
              cursor:
                'pointer',
            }}
          >
            Save Polygon
          </button>

          <button
            type="button"
            onClick={
              onClearPolygon
            }
            style={{
              padding:
                '8px 10px',
              border:
                '1px solid #cbd5e1',
              borderRadius:
                '5px',
              background:
                '#ffffff',
              fontSize:
                '10px',
              cursor:
                'pointer',
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* ======================================================
          SAVED POLYGONS
          ====================================================== */}

      {savedPolygons.length >
        0 && (
        <div>
          <div
            style={{
              fontSize:
                '11px',
              fontWeight:
                '700',
              color:
                '#475569',
              marginBottom:
                '7px',
            }}
          >
            Saved Polygons
          </div>

          {savedPolygons.map(
            polygon => (
              <div
                key={
                  polygon.id
                }
                style={{
                  padding:
                    '9px 10px',
                  border:
                    '1px solid #e2e8f0',
                  borderRadius:
                    '6px',
                  marginBottom:
                    '6px',
                  background:
                    '#f8fafc',
                }}
              >
                <div
                  style={{
                    fontSize:
                      '12px',
                    fontWeight:
                      '700',
                    color:
                      '#0f172a',
                  }}
                >
                  {polygon.name}
                </div>

                <div
                  style={{
                    fontSize:
                      '10px',
                    color:
                      '#64748b',
                    marginTop:
                      '3px',
                  }}
                >
                  {polygon.points.length}
                  {' '}
                  points
                </div>

                <div
                  style={{
                    display:
                      'flex',
                    gap:
                      '6px',
                    marginTop:
                      '7px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      onLoadPolygon(
                        polygon
                      )
                    }
                    style={{
                      flex:
                        1,
                      padding:
                        '6px',
                      border:
                        '1px solid #bfdbfe',
                      borderRadius:
                        '5px',
                      background:
                        '#eff6ff',
                      color:
                        '#1d4ed8',
                      fontSize:
                        '10px',
                      cursor:
                        'pointer',
                    }}
                  >
                    Open
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const next =
                        savedPolygons.filter(
                          item =>
                            item.id !==
                            polygon.id
                        );

                      setSavedPolygons(
                        next
                      );

                      writeStorage(
                        SAVED_POLYGONS_KEY,
                        next
                      );
                    }}
                    style={{
                      padding:
                        '6px 9px',
                      border:
                        '1px solid #fecaca',
                      borderRadius:
                        '5px',
                      background:
                        '#fef2f2',
                      color:
                        '#b91c1c',
                      cursor:
                        'pointer',
                    }}
                  >
                    <Trash2
                      size={12}
                    />
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   MAIN EXPLORE MAP
   ============================================================ */

export default function ExploreMap({
  initialSelection = null,
  onSelectionChange = null,
  showAdministrativeSelector = true,
  officerMode = true,
  isMobile = false,
}) {
  const mapContainer =
    useRef(null);

  const map =
    useRef(null);

  const marker =
    useRef(null);

  const geocodeController =
    useRef(null);

  const geocodeTimer =
    useRef(null);

  const mapClickHandler =
    useRef(null);

  const [
    mapStatus,
    setMapStatus,
  ] = useState('loading');

  const [
    mapError,
    setMapError,
  ] = useState('');

  const [
    activeLayers,
    setActiveLayers,
  ] = useState({});

  const [
  layerData,
  setLayerData,
] = useState({});

const [
  layerLoading,
  setLayerLoading,
] = useState({});

const [
  layerErrors,
  setLayerErrors,
] = useState({});

  const [
    selectedFeature,
    setSelectedFeature,
  ] = useState(null);

  const [
    selectedAdministrativeArea,
    setSelectedAdministrativeArea,
  ] = useState(initialSelection);

  const [
    polygonDrawingMode,
    setPolygonDrawingMode,
  ] = useState(false);

  const [
    polygonPoints,
    setPolygonPoints,
  ] = useState([]);

  const [
    openCategories,
    setOpenCategories,
  ] = useState({
    '🗺️ LAND & RECORDS':
      true,

    '🎯 ANALYSIS & AOI':
      true,

    '🛰️ IMAGERY & ELEVATION':
      true,

    '🏢 BUILT ENVIRONMENT':
      true,

    '🚧 INFRASTRUCTURE':
      true,

    '📍 SURVEY & VERIFICATION':
      false,
  });

  /* ==========================================================
     MAP INITIALIZATION
     ========================================================== */

  useEffect(() => {
    if (
      !mapContainer.current ||
      map.current
    ) {
      return;
    }

    let mapLoaded = false;

    const mapInstance =
      new maplibregl.Map({
        container:
          mapContainer.current,

        style: {
          version: 8,

          sources: {
            'osm-tiles': {
              type:
                'raster',

              tiles: [
                'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              ],

              tileSize:
                256,

              attribution:
                '© OpenStreetMap contributors',
            },

            'satellite-tiles': {
              type:
                'raster',

              tiles: [
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
              ],

              tileSize:
                256,
            },
          },

          layers: [
            {
              id:
                'base-osm',

              type:
                'raster',

              source:
                'osm-tiles',

              minzoom:
                0,

              maxzoom:
                19,

              layout: {
                visibility:
                  'visible',
              },
            },

            {
              id:
                'base-satellite',

              type:
                'raster',

              source:
                'satellite-tiles',

              minzoom:
                0,

              maxzoom:
                19,

              layout: {
                visibility:
                  'none',
              },
            },
          ],
        },

        center: [
          75.7875,
          26.9120,
        ],

        zoom:
          13,

        attributionControl:
          true,
      });

    map.current =
      mapInstance;

    mapInstance.addControl(
      new maplibregl.NavigationControl(),
      'top-right'
    );

    mapInstance.on(
      'load',
      () => {
        mapLoaded =
          true;

        setMapStatus(
          'ready'
        );

        setMapError('');

        setTimeout(() => {
          if (
            map.current
          ) {
            map.current.resize();
          }
        }, 150);
      }
    );

    mapInstance.on(
      'error',
      event => {
        console.error(
          'MapLibre error:',
          event?.error ||
            event
        );
      }
    );

    const resizeObserver =
      typeof ResizeObserver !==
      'undefined'
        ? new ResizeObserver(
            () => {
              if (
                map.current
              ) {
                map.current.resize();
              }
            }
          )
        : null;

    if (
      resizeObserver &&
      mapContainer.current
    ) {
      resizeObserver.observe(
        mapContainer.current
      );
    }

    const loadingTimer =
      setTimeout(
        () => {
          if (
            !mapLoaded
          ) {
            setMapStatus(
              'error'
            );

            setMapError(
              'The map did not finish loading. Check your internet connection and browser console for a MapLibre/tile error.'
            );
          }
        },
        15000
      );

    return () => {
      clearTimeout(
        loadingTimer
      );

      if (
        geocodeTimer.current
      ) {
        clearTimeout(
          geocodeTimer.current
        );
      }

      if (
        geocodeController.current
      ) {
        geocodeController.current.abort();
      }

      if (
        resizeObserver
      ) {
        resizeObserver.disconnect();
      }

      if (
        marker.current
      ) {
        marker.current.remove();

        marker.current =
          null;
      }

      if (
        map.current
      ) {
        map.current.remove();

        map.current =
          null;
      }
    };
  }, []);

  /* ==========================================================
     INITIAL SELECTION FROM PARENT
     ========================================================== */

  useEffect(() => {
    if (
      !initialSelection
    ) {
      return;
    }

    setSelectedAdministrativeArea(
      initialSelection
    );

    if (
      !showAdministrativeSelector &&
      !initialSelection.coordinates
    ) {
      navigateToAdministrativeSelection(
        initialSelection
      );
    }
  }, [
    initialSelection,
    showAdministrativeSelector,
  ]);

  /* ==========================================================
     COORDINATE NAVIGATION
     ========================================================== */

  useEffect(() => {
    if (
      !map.current ||
      !selectedAdministrativeArea
    ) {
      return;
    }

    const coordinates =
      selectedAdministrativeArea.coordinates;

    if (
      !coordinates
    ) {
      return;
    }

    const latitude =
      Number(
        coordinates.latitude
      );

    const longitude =
      Number(
        coordinates.longitude
      );

    if (
      !Number.isFinite(
        latitude
      ) ||
      !Number.isFinite(
        longitude
      )
    ) {
      return;
    }

    const goToCoordinates =
      () => {
        if (
          !map.current
        ) {
          return;
        }

        map.current.flyTo(
          {
            center: [
              longitude,
              latitude,
            ],

            zoom:
              15,

            speed:
              1.2,

            essential:
              true,
          }
        );

        if (
          marker.current
        ) {
          marker.current.remove();
        }

        marker.current =
          new maplibregl.Marker(
            {
              color:
                '#2563eb',
            }
          )
            .setLngLat([
              longitude,
              latitude,
            ])
            .addTo(
              map.current
            );
      };

    if (
      map.current.loaded()
    ) {
      goToCoordinates();
    } else {
      map.current.once(
        'load',
        goToCoordinates
      );
    }
  }, [
    selectedAdministrativeArea,
  ]);

  /* ==========================================================
     DRAWING MODE
     ========================================================== */

  useEffect(() => {
    if (
      !map.current
    ) {
      return;
    }

    const handleMapClick =
      event => {
        if (
          !polygonDrawingMode
        ) {
          return;
        }

        const point = [
          event.lngLat.lng,
          event.lngLat.lat,
        ];

        setPolygonPoints(
          previous => [
            ...previous,
            point,
          ]
        );
      };

    mapClickHandler.current =
      handleMapClick;

    map.current.on(
      'click',
      handleMapClick
    );

    const canvas =
      map.current.getCanvas();

    if (
      canvas
    ) {
      canvas.style.cursor =
        polygonDrawingMode
          ? 'crosshair'
          : '';
    }

    return () => {
      if (
        map.current &&
        mapClickHandler.current
      ) {
        map.current.off(
          'click',
          mapClickHandler.current
        );
      }

      if (
        canvas
      ) {
        canvas.style.cursor =
          '';
      }
    };
  }, [
    polygonDrawingMode,
  ]);

  /* ==========================================================
     AOI PREVIEW
     ========================================================== */

  // Highlight selected feature
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    if (map.current.getLayer('highlight-fill')) {
      map.current.removeLayer('highlight-fill');
    }
    if (map.current.getLayer('highlight-line')) {
      map.current.removeLayer('highlight-line');
    }
    if (map.current.getSource('highlight-source')) {
      map.current.removeSource('highlight-source');
    }

    if (selectedFeature && selectedFeature.geometry) {
      map.current.addSource('highlight-source', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: selectedFeature.geometry,
          properties: {}
        }
      });
      
      map.current.addLayer({
        id: 'highlight-fill',
        type: 'fill',
        source: 'highlight-source',
        paint: {
          'fill-color': '#fbbf24', // bright yellow/amber highlight
          'fill-opacity': 0.7
        }
      });
      
      map.current.addLayer({
        id: 'highlight-line',
        type: 'line',
        source: 'highlight-source',
        paint: {
          'line-color': '#f59e0b',
          'line-width': 4
        }
      });
    }
  }, [selectedFeature]);

  useEffect(() => {
    if (
      !map.current
    ) {
      return;
    }

    const updateAOI =
      () => {
        if (
          !map.current
        ) {
          return;
        }

        const mapStyleLoaded =
          map.current.isStyleLoaded();

        if (
          !mapStyleLoaded
        ) {
          return;
        }

        if (
          map.current.getLayer(
            AOI_FILL_LAYER_ID
          )
        ) {
          map.current.removeLayer(
            AOI_FILL_LAYER_ID
          );
        }

        if (
          map.current.getLayer(
            AOI_LINE_LAYER_ID
          )
        ) {
          map.current.removeLayer(
            AOI_LINE_LAYER_ID
          );
        }

        if (
          map.current.getLayer(
            AOI_POINTS_LAYER_ID
          )
        ) {
          map.current.removeLayer(
            AOI_POINTS_LAYER_ID
          );
        }

        if (
          map.current.getSource(
            AOI_SOURCE_ID
          )
        ) {
          map.current.removeSource(
            AOI_SOURCE_ID
          );
        }

        if (
          polygonPoints.length ===
          0
        ) {
          return;
        }

        const features = [];

        polygonPoints.forEach(
          point => {
            features.push({
              type:
                'Feature',

              geometry: {
                type:
                  'Point',

                coordinates:
                  point,
              },

              properties: {},
            });
          }
        );

        if (
          polygonPoints.length >=
          2
        ) {
          const lineCoordinates =
            [
              ...polygonPoints,
            ];

          if (
            polygonPoints.length >=
            3
          ) {
            lineCoordinates.push(
              polygonPoints[0]
            );
          }

          features.push({
            type:
              'Feature',

            geometry: {
              type:
                'LineString',

              coordinates:
                lineCoordinates,
            },

            properties: {},
          });
        }

        if (
          polygonPoints.length >=
          3
        ) {
          features.push({
            type:
              'Feature',

            geometry: {
              type:
                'Polygon',

              coordinates: [
                [
                  ...polygonPoints,
                  polygonPoints[0],
                ],
              ],
            },

            properties: {},
          });
        }

        map.current.addSource(
          AOI_SOURCE_ID,
          {
            type:
              'geojson',

            data: {
              type:
                'FeatureCollection',

              features,
            },
          }
        );

        map.current.addLayer(
          {
            id:
              AOI_POINTS_LAYER_ID,

            type:
              'circle',

            source:
              AOI_SOURCE_ID,

            filter: [
              '==',
              '$type',
              'Point',
            ],

            paint: {
              'circle-radius':
                5,

              'circle-color':
                '#2563eb',

              'circle-stroke-color':
                '#ffffff',

              'circle-stroke-width':
                2,
            },
          }
        );

        if (
          polygonPoints.length >=
          2
        ) {
          map.current.addLayer(
            {
              id:
                AOI_LINE_LAYER_ID,

              type:
                'line',

              source:
                AOI_SOURCE_ID,

              filter: [
                '==',
                '$type',
                'LineString',
              ],

              paint: {
                'line-color':
                  '#2563eb',

                'line-width':
                  3,

                'line-dasharray':
                  [
                    2,
                    1,
                  ],
              },
            }
          );
        }

        if (
          polygonPoints.length >=
          3
        ) {
          map.current.addLayer(
            {
              id:
                AOI_FILL_LAYER_ID,

              type:
                'fill',

              source:
                AOI_SOURCE_ID,

              filter: [
                '==',
                '$type',
                'Polygon',
              ],

              paint: {
                'fill-color':
                  '#2563eb',

                'fill-opacity':
                  0.15,
              },
            }
          );
        }
      };

    if (
      map.current.loaded()
    ) {
      updateAOI();
    } else {
      map.current.once(
        'load',
        updateAOI
      );
    }
  }, [
    polygonPoints,
  ]);

  /* ==========================================================
     ADMINISTRATIVE GEOCODING
     ========================================================== */

  async function navigateToAdministrativeSelection(
    selection
  ) {
    if (
      !map.current ||
      !selection ||
      selection.coordinates
    ) {
      return;
    }

    const parts = [];

    if (
      selection.ward?.name
    ) {
      parts.push(
        selection.ward.name
      );
    }

    if (
      selection.ulb?.name
    ) {
      parts.push(
        selection.ulb.name
      );
    }

    if (
      selection.geography?.name
    ) {
      parts.push(
        selection.geography.name
      );
    }

    if (
      selection.district?.name
    ) {
      parts.push(
        selection.district.name
      );
    }

    if (
      selection.state?.name
    ) {
      parts.push(
        selection.state.name
      );
    }

    parts.push(
      DEFAULT_COUNTRY
    );

    const query =
      parts
        .filter(Boolean)
        .join(', ');

    if (!query) {
      return;
    }

    if (
      geocodeTimer.current
    ) {
      clearTimeout(
        geocodeTimer.current
      );
    }

    geocodeTimer.current =
      setTimeout(
        async () => {
          if (
            geocodeController.current
          ) {
            geocodeController.current.abort();
          }

          const controller =
            new AbortController();

          geocodeController.current =
            controller;

          try {
            const url =
              `https://nominatim.openstreetmap.org/search` +
              `?format=jsonv2` +
              `&limit=1` +
              `&q=${encodeURIComponent(
                query
              )}`;

            const response =
              await fetch(
                url,
                {
                  method:
                    'GET',

                  headers: {
                    Accept:
                      'application/json',
                  },

                  signal:
                    controller.signal,
                }
              );

            if (
              !response.ok
            ) {
              throw new Error(
                `Geocoding request failed with status ${response.status}`
              );
            }

            const results =
              await response.json();

            if (
              !Array.isArray(
                results
              ) ||
              results.length ===
                0
            ) {
              console.warn(
                'No map location found for:',
                query
              );

              return;
            }

            const result =
              results[0];

            const longitude =
              Number(
                result.lon
              );

            const latitude =
              Number(
                result.lat
              );

            if (
              !Number.isFinite(
                latitude
              ) ||
              !Number.isFinite(
                longitude
              )
            ) {
              return;
            }

            /*
             * Save the resolved coordinates in
             * the selection itself.
             */
            const enrichedSelection =
              {
                ...selection,

                coordinates: {
                  latitude,
                  longitude,
                },

                source:
                  'Administrative selection + map geocoding',
              };

            setSelectedAdministrativeArea(
              enrichedSelection
            );

            if (
              typeof onSelectionChange ===
              'function'
            ) {
              onSelectionChange(
                enrichedSelection
              );
            }

            if (
              !map.current
            ) {
              return;
            }

            const boundingBox =
              Array.isArray(
                result.boundingbox
              ) &&
              result.boundingbox.length ===
                4
                ? result.boundingbox
                : null;

            if (
              boundingBox
            ) {
              const south =
                Number(
                  boundingBox[0]
                );

              const north =
                Number(
                  boundingBox[1]
                );

              const west =
                Number(
                  boundingBox[2]
                );

              const east =
                Number(
                  boundingBox[3]
                );

              if (
                Number.isFinite(
                  south
                ) &&
                Number.isFinite(
                  north
                ) &&
                Number.isFinite(
                  west
                ) &&
                Number.isFinite(
                  east
                )
              ) {
                map.current.fitBounds(
                  [
                    [
                      west,
                      south,
                    ],
                    [
                      east,
                      north,
                    ],
                  ],
                  {
                    padding:
                      60,

                    duration:
                      1200,

                    maxZoom:
                      15,
                  }
                );
              } else {
                map.current.flyTo(
                  {
                    center: [
                      longitude,
                      latitude,
                    ],

                    zoom:
                      13,

                    speed:
                      1.2,

                    essential:
                      true,
                  }
                );
              }
            } else {
              map.current.flyTo(
                {
                  center: [
                    longitude,
                    latitude,
                  ],

                  zoom:
                    13,

                  speed:
                    1.2,

                  essential:
                    true,
                }
              );
            }

            if (
              marker.current
            ) {
              marker.current.remove();
            }

            marker.current =
              new maplibregl.Marker(
                {
                  color:
                    '#2563eb',
                }
              )
                .setLngLat([
                  longitude,
                  latitude,
                ])
                .addTo(
                  map.current
                );
          } catch (error) {
            if (
              error?.name ===
              'AbortError'
            ) {
              return;
            }

            console.error(
              'Administrative geocoding error:',
              error
            );
          }
        },
        1200
      );
  }

  /* ==========================================================
     ADMINISTRATIVE SELECTION HANDLER
     ========================================================== */

  function handleAdministrativeSelection(
    selection
  ) {
    setSelectedAdministrativeArea(
      selection
    );

    if (
      typeof onSelectionChange ===
      'function'
    ) {
      onSelectionChange(
        selection
      );
    }

    if (
      selection &&
      !selection.coordinates
    ) {
      navigateToAdministrativeSelection(
        selection
      );
    }
  }

  /* ==========================================================
     YOUR WORK: LOCATIONS
     ========================================================== */

  function handleLoadSavedLocation(
    location
  ) {
    const selection =
      {
        mode:
          'coordinates',

        geographyType:
          'coordinates',

        state:
          location.context?.state ||
          null,

        district:
          location.context?.district ||
          null,

        geography:
          location.context?.geography ||
          null,

        ulb:
          location.context?.ulb ||
          null,

        ward:
          location.context?.ward ||
          null,

        coordinates: {
          latitude:
            location.latitude,

          longitude:
            location.longitude,
        },

        source:
          'Saved user location',
      };

    handleAdministrativeSelection(
      selection
    );
  }

  /* ==========================================================
     YOUR WORK: POLYGON
     ========================================================== */

  function handleStartPolygon() {
    setPolygonPoints(
      []
    );

    setPolygonDrawingMode(
      true
    );

    if (
      map.current
    ) {
      map.current.flyTo(
        {
          zoom:
            Math.max(
              map.current.getZoom(),
              13
            ),
        }
      );
    }
  }

  function handleClearPolygon() {
    setPolygonPoints(
      []
    );

    setPolygonDrawingMode(
      false
    );
  }

  function handleLoadPolygon(
    polygon
  ) {
    if (
      !polygon ||
      !Array.isArray(
        polygon.points
      )
    ) {
      return;
    }

    setPolygonPoints(
      polygon.points
    );

    setPolygonDrawingMode(
      false
    );

    if (
      map.current &&
      polygon.points.length > 0
    ) {
      const bounds =
        new maplibregl.LngLatBounds();

      polygon.points.forEach(
        point => {
          bounds.extend(
            point
          );
        }
      );

      map.current.fitBounds(
        bounds,
        {
          padding:
            60,

          duration:
            1000,

          maxZoom:
            16,
        }
      );
    }
  }

  async function handleAddPlacePoint(
    place
  ) {
    const query =
      `${place}, ${DEFAULT_COUNTRY}`;

    const response =
      await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(
          query
        )}`,
        {
          headers: {
            Accept:
              'application/json',
          },
        }
      );

    if (
      !response.ok
    ) {
      throw new Error(
        `Place lookup failed: ${response.status}`
      );
    }

    const results =
      await response.json();

    if (
      !Array.isArray(
        results
      ) ||
      results.length ===
        0
    ) {
      throw new Error(
        'No place found.'
      );
    }

    const longitude =
      Number(
        results[0].lon
      );

    const latitude =
      Number(
        results[0].lat
      );

    if (
      !Number.isFinite(
        longitude
      ) ||
      !Number.isFinite(
        latitude
      )
    ) {
      throw new Error(
        'Invalid coordinates returned.'
      );
    }

    setPolygonPoints(
      previous => [
        ...previous,
        [
          longitude,
          latitude,
        ],
      ]
    );

    if (
      map.current
    ) {
      map.current.flyTo(
        {
          center: [
            longitude,
            latitude,
          ],

          zoom:
            14,

          speed:
            1.1,

          essential:
            true,
        }
      );
    }
  }

  /* ==========================================================
     LAYER CATEGORIES
     ========================================================== */

  function toggleCategory(
    title
  ) {
    setOpenCategories(
      previous => ({
        ...previous,

        [title]:
          !previous[title],
      })
    );
  }

  /* /* ==========================================================
   MAP LAYERS
   ========================================================== */

function setMapLayerVisibility(
  layerId,
  visible
) {
  if (!map.current) {
    return;
  }

  const visibility =
    visible
      ? 'visible'
      : 'none';

  const renderLayerIds = [
    `${layerId}-fill`,
    `${layerId}-line`,
    `${layerId}-point`,
  ];

  renderLayerIds.forEach(
    renderLayerId => {
      if (
        map.current.getLayer(
          renderLayerId
        )
      ) {
        map.current.setLayoutProperty(
          renderLayerId,
          'visibility',
          visibility
        );
      }
    }
  );
}


/* ==========================================================
   LAYER STYLES
   ========================================================== */

function getLayerStyle(
  layerId
) {
  switch (layerId) {
    case 'parcels':
      return {
        fillColor: '#ef4444',
        fillOpacity: 0.65,
        lineColor: '#b91c1c',
        lineWidth: 3,
        pointColor: '#1d4ed8',
      };

    case 'buildings':
      return {
        fillColor: '#ef4444',
        fillOpacity: 0.55,
        lineColor: '#991b1b',
        lineWidth: 1.5,
        pointColor: '#dc2626',
      };

    case 'building_changes':
      return {
        fillColor: '#f97316',
        fillOpacity: 0.45,
        lineColor: '#c2410c',
        lineWidth: 2,
        pointColor: '#ea580c',
      };

    case 'roads':
      return {
        fillColor: '#f59e0b',
        fillOpacity: 0.20,
        lineColor: '#f59e0b',
        lineWidth: 4,
        pointColor: '#d97706',
      };

    case 'utilities':
      return {
        fillColor: '#06b6d4',
        fillOpacity: 0.20,
        lineColor: '#06b6d4',
        lineWidth: 3,
        pointColor: '#0891b2',
      };

    case 'gnss_points':
      return {
        fillColor: '#2563eb',
        fillOpacity: 0.40,
        lineColor: '#1d4ed8',
        lineWidth: 2,
        pointColor: '#2563eb',
      };

    case 'ground_truth':
      return {
        fillColor: '#16a34a',
        fillOpacity: 0.40,
        lineColor: '#166534',
        lineWidth: 2,
        pointColor: '#16a34a',
      };

    case 'ai_features':
      return {
        fillColor: '#8b5cf6',
        fillOpacity: 0.35,
        lineColor: '#6d28d9',
        lineWidth: 2,
        pointColor: '#7c3aed',
      };

    case 'municipal_records':
      return {
        fillColor: '#0ea5e9',
        fillOpacity: 0.25,
        lineColor: '#0284c7',
        lineWidth: 2,
        pointColor: '#0284c7',
      };

    case 'imagery_metadata':
      return {
        fillColor: '#64748b',
        fillOpacity: 0.08,
        lineColor: '#475569',
        lineWidth: 2,
        pointColor: '#475569',
      };

    default:
      return {
        fillColor: '#64748b',
        fillOpacity: 0.20,
        lineColor: '#475569',
        lineWidth: 2,
        pointColor: '#475569',
      };
  }
}


/* ==========================================================
   FEATURE CLICK HANDLER
   ========================================================== */

function bindLayerEvents(
  layerId,
  renderLayerIds
) {
  if (!map.current) {
    return;
  }

  renderLayerIds.forEach(
    renderLayerId => {
      if (
        !map.current.getLayer(
          renderLayerId
        )
      ) {
        return;
      }

      map.current.on(
        'click',
        renderLayerId,
        event => {
          if (
            event.features &&
            event.features.length > 0
          ) {
            setSelectedFeature({
              layer:
                layerId,

              properties:
                event
                  .features[0]
                  .properties,

              lngLat:
                event.lngLat,

              geometry:
                event
                  .features[0]
                  .geometry,
            });
          }
        }
      );

      map.current.on(
        'mouseenter',
        renderLayerId,
        () => {
          if (
            map.current
          ) {
            map.current
              .getCanvas()
              .style.cursor =
              polygonDrawingMode
                ? 'crosshair'
                : 'pointer';
          }
        }
      );

      map.current.on(
        'mouseleave',
        renderLayerId,
        () => {
          if (
            map.current
          ) {
            map.current
              .getCanvas()
              .style.cursor =
              polygonDrawingMode
                ? 'crosshair'
                : '';
          }
        }
      );
    }
  );
}


/* ==========================================================
   RENDER GEOJSON LAYER
   ========================================================== */

function renderGeoJsonLayer(
  layerId,
  geojson
) {
  if (
    !map.current ||
    !geojson
  ) {
    return;
  }

  if (
    map.current.getSource(
      layerId
    )
  ) {
    setMapLayerVisibility(
      layerId,
      true
    );

    return;
  }

  const style =
    getLayerStyle(
      layerId
    );

  map.current.addSource(
    layerId,
    {
      type: 'geojson',
      data: geojson,
    }
  );

  /*
   * Polygon / MultiPolygon
   */
  map.current.addLayer({
    id:
      `${layerId}-fill`,

    type:
      'fill',

    source:
      layerId,

    paint: {
      'fill-color':
        style.fillColor,

      'fill-opacity':
        style.fillOpacity,
    },
  });


  /*
   * LineString / MultiLineString
   */
  map.current.addLayer({
    id:
      `${layerId}-line`,

    type:
      'line',

    source:
      layerId,

    paint: {
      'line-color':
        style.lineColor,

      'line-width':
        style.lineWidth,
    },
  });


  /*
   * Point / MultiPoint
   */
  map.current.addLayer({
    id:
      `${layerId}-point`,

    type:
      'circle',

    source:
      layerId,

    paint: {
      'circle-radius':
        5,

      'circle-color':
        style.pointColor,

      'circle-stroke-color':
        '#ffffff',

      'circle-stroke-width':
        1.5,
    },
  });


  bindLayerEvents(
    layerId,
    [
      `${layerId}-fill`,
      `${layerId}-line`,
      `${layerId}-point`,
    ]
  );
}


/* ==========================================================
   LOAD SPATIAL LAYER
   ========================================================== */

async function loadSpatialLayer(
  layerId,
  config
) {
  setLayerLoading(
    previous => ({
      ...previous,
      [layerId]:
        true,
    })
  );

  setLayerErrors(
    previous => ({
      ...previous,
      [layerId]:
        '',
    })
  );

  try {
    if (
      !map.current
    ) {
      throw new Error(
        'Map is not initialized.'
      );
    }

    const endpoint =
      config.endpointType ===
      'imagery'
        ? '/imagery'
        : `/layers/data/${config.table}`;

    const response =
      await axios.get(
        `${API_BASE}${endpoint}`,
        {
          timeout:
            30000,
        }
      );

    const data =
      response.data;

    if (
      !data ||
      !Array.isArray(
        data.features
      )
    ) {
      throw new Error(
        'Backend returned an invalid GeoJSON response.'
      );
    }

    if (
      data.features.length ===
      0
    ) {
      throw new Error(
        'No features were returned for this layer.'
      );
    }

    setLayerData(
      previous => ({
        ...previous,
        [layerId]:
          data,
      })
    );

    renderGeoJsonLayer(
      layerId,
      data
    );

    setMapLayerVisibility(
      layerId,
      true
    );

  } catch (error) {
    console.error(
      `Error loading ${layerId}:`,
      error
    );

    const message =
      error?.response?.data
        ?.detail ||
      error?.message ||
      'Unknown layer error';

    setLayerErrors(
      previous => ({
        ...previous,
        [layerId]:
          message,
      })
    );

    setActiveLayers(
      previous => ({
        ...previous,
        [layerId]:
          false,
      })
    );

  } finally {
    setLayerLoading(
      previous => ({
        ...previous,
        [layerId]:
          false,
      })
    );
  }
}


/* ==========================================================
   LOAD RECORD-ONLY LAYER
   ========================================================== */

async function loadRecordLayer(
  layerId,
  config
) {
  setLayerLoading(
    previous => ({
      ...previous,
      [layerId]:
        true,
    })
  );

  setLayerErrors(
    previous => ({
      ...previous,
      [layerId]:
        '',
    })
  );

  try {
    const response =
      await axios.get(
        `${API_BASE}/records/${config.table}`,
        {
          timeout:
            30000,
        }
      );

    setLayerData(
      previous => ({
        ...previous,
        [layerId]:
          response.data,
      })
    );

  } catch (error) {
    console.error(
      `Error loading record layer ${layerId}:`,
      error
    );

    setLayerErrors(
      previous => ({
        ...previous,
        [layerId]:
          error?.response?.data
            ?.detail ||
          error?.message ||
          'Unable to load records.',
      })
    );

    setActiveLayers(
      previous => ({
        ...previous,
        [layerId]:
          false,
      })
    );

  } finally {
    setLayerLoading(
      previous => ({
        ...previous,
        [layerId]:
          false,
      })
    );
  }
}


/* ==========================================================
   TOGGLE LAYER
   ========================================================== */

async function toggleLayer(
  layerId
) {
  /*
   * AOI remains special.
   */
  if (
    layerId === 'aoi'
  ) {
    const nextState =
      !activeLayers[
        layerId
      ];

    setActiveLayers(
      previous => ({
        ...previous,
        [layerId]:
          nextState,
      })
    );

    if (
      nextState
    ) {
      handleStartPolygon();
    } else {
      handleClearPolygon();
    }

    return;
  }


  const config =
    MAP_LAYER_CONFIG[
      layerId
    ];

  if (!config) {
    console.warn(
      'No layer configuration found for:',
      layerId
    );

    return;
  }


  const nextState =
    !activeLayers[
      layerId
    ];

  setActiveLayers(
    previous => ({
      ...previous,
      [layerId]:
        nextState,
    })
  );


  /*
   * Turn layer off.
   */
  if (
    !nextState
  ) {
    if (
      config.map
    ) {
      setMapLayerVisibility(
        layerId,
        false
      );
    }

    return;
  }


  /*
   * Record-only layer.
   */
  if (
    config.endpointType ===
    'records'
  ) {
    await loadRecordLayer(
      layerId,
      config
    );

    return;
  }


  /*
   * Spatial/imagery layer.
   */
  if (
    config.map
  ) {
    await loadSpatialLayer(
      layerId,
      config
    );
  }
}

  /* ==========================================================
     PRELIMINARY REPORT
     ========================================================== */

  function generatePreliminaryReport() {
  const selectedLayers =
    LAYER_CATEGORIES
      .flatMap(
        category =>
          category.layers
      )
      .filter(
        layer =>
          activeLayers[
            layer.id
          ]
      );

  const lines = [
    'NAKSHA — JAIPUR DATA ANALYSIS REPORT',
    '',
    'Analysis Area:',
    selectedAdministrativeArea?.state?.name ||
      'Not selected',

    selectedAdministrativeArea?.district?.name
      ? `District: ${selectedAdministrativeArea.district.name}`
      : '',

    selectedAdministrativeArea?.geography?.name
      ? `Analysis Geography: ${selectedAdministrativeArea.geography.name}`
      : '',

    selectedAdministrativeArea?.ulb?.name
      ? `ULB: ${selectedAdministrativeArea.ulb.name}`
      : '',

    selectedAdministrativeArea?.ward?.number
      ? `Ward: ${selectedAdministrativeArea.ward.number}`
      : '',

    selectedAdministrativeArea?.coordinates
      ? `Coordinates: ${selectedAdministrativeArea.coordinates.latitude}, ${selectedAdministrativeArea.coordinates.longitude}`
      : '',

    '',
    'ACTIVE DATA LAYERS',
    '=================',
  ];


  if (
    selectedLayers.length ===
    0
  ) {
    lines.push(
      'No data layers selected.'
    );
  }


  selectedLayers.forEach(
    layer => {
      const data =
        layerData[
          layer.id
        ];

      lines.push(
        ''
      );

      lines.push(
        layer.name
      );

      lines.push(
        `Layer ID: ${layer.id}`
      );


      if (
        layer.endpointType ===
        'records'
      ) {
        const recordCount =
          data?.count ??
          data?.records?.length ??
          0;

        lines.push(
          `Records: ${recordCount}`
        );

        return;
      }


      const featureCount =
        data?.features?.length ??
        0;

      lines.push(
        `Features: ${featureCount}`
      );


      /*
       * Useful quick statistics.
       */
      if (
        data?.features
      ) {
        const properties =
          data.features
            .map(
              feature =>
                feature.properties ||
                {}
            );

        const confidenceValues =
          properties
            .map(
              item =>
                Number(
                  item.confidence_score
                )
            )
            .filter(
              value =>
                Number.isFinite(
                  value
                )
            );

        if (
          confidenceValues.length >
          0
        ) {
          const average =
            confidenceValues.reduce(
              (
                sum,
                value
              ) =>
                sum + value,
              0
            ) /
            confidenceValues.length;

          lines.push(
            `Average confidence: ${average.toFixed(3)}`
          );
        }
      }
    }
  );


  lines.push(
    ''
  );

  lines.push(
    'AOI / SURVEY'
  );

  lines.push(
    polygonPoints.length >=
    3
      ? `AOI points: ${polygonPoints.length}`
      : 'No AOI polygon currently defined'
  );


  if (
    selectedFeature
  ) {
    lines.push(
      ''
    );

    lines.push(
      'SELECTED FEATURE'
    );

    lines.push(
      `Layer: ${selectedFeature.layer}`
    );

    Object.entries(
      selectedFeature.properties ||
        {}
    ).forEach(
      ([key, value]) => {
        lines.push(
          `${key}: ${value ?? ''}`
        );
      }
    );
  }


  lines.push(
    ''
  );

  lines.push(
    'Note: This prototype report summarizes data currently retrieved from the NAKSHA Jaipur FastAPI/PostGIS backend. Legal land-record decisions require authoritative data and authorized review.'
  );


  const reportWindow =
    window.open(
      '',
      '_blank',
      'width=1000,height=750'
    );

  if (
    !reportWindow
  ) {
    alert(
      'Please allow pop-ups to generate the report.'
    );

    return;
  }


  const escaped =
    lines
      .filter(
        line =>
          line !==
          undefined
      )
      .map(
        line =>
          String(
            line
          )
            .replace(
              /&/g,
              '&amp;'
            )
            .replace(
              /</g,
              '&lt;'
            )
            .replace(
              />/g,
              '&gt;'
            )
      )
      .join(
        '<br />'
      );


  reportWindow.document.write(
    `
      <!DOCTYPE html>
      <html>
      <head>
        <title>NAKSHA Jaipur Data Analysis Report</title>
        <meta charset="utf-8" />

        <style>
          body {
            font-family:
              Arial, sans-serif;

            padding:
              40px;

            color:
              #0f172a;

            line-height:
              1.6;
          }

          h1 {
            margin-top:
              0;
          }

          .report {
            white-space:
              normal;
          }
        </style>
      </head>

      <body>
        <h1>
          NAKSHA Jaipur Data Analysis Report
        </h1>

        <div class="report">
          ${escaped}
        </div>
      </body>
      </html>
    `
  );

  reportWindow.document.close();

  reportWindow.focus();

  setTimeout(
    () =>
      reportWindow.print(),
    300
  );
}

  /* ==========================================================
     RENDER
     ========================================================== */

  const [showMobileRightSidebar, setShowMobileRightSidebar] = useState(false);

  return (
    <div
      style={{
        display:
          'flex',

        flexDirection: isMobile ? 'column' : 'row',

        height:
          '100%',

        minWidth:
          0,

        fontFamily:
          'Inter, sans-serif',
          
        position: 'relative'
      }}
    >
      {/* =====================================================
          MAP
          ===================================================== */}

      <div
        style={{
          position:
            'relative',

          flex:
            1,

          minWidth:
            0,

          height:
            '100%',

          background:
            '#e2e8f0',
        }}
      >
        <div
          ref={
            mapContainer
          }
          style={{
            position:
              'absolute',

            inset:
              0,
          }}
        />

        {isMobile && officerMode && (
          <button
            onClick={() => setShowMobileRightSidebar(!showMobileRightSidebar)}
            style={{
              position: 'absolute',
              top: '16px',
              right: '60px',
              zIndex: 40,
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              padding: '8px 12px',
              borderRadius: '6px',
              fontWeight: '600',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {showMobileRightSidebar ? 'Hide Layers' : 'Data Layers'}
          </button>
        )}

        {mapStatus ===
          'loading' && (
          <div
            style={{
              position:
                'absolute',

              top:
                isMobile ? 60 : 16,

              left:
                16,

              zIndex:
                20,

              background:
                'rgba(15,23,42,0.88)',

              color:
                '#ffffff',

              padding:
                '9px 12px',

              borderRadius:
                7,

              fontSize:
                12,

              boxShadow:
                '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            Loading Jaipur map...
          </div>
        )}

        {mapStatus ===
          'error' && (
          <div
            style={{
              position:
                'absolute',

              top:
                isMobile ? 60 : 16,

              left:
                16,

              right:
                16,

              zIndex:
                20,

              background:
                '#fff1f2',

              color:
                '#9f1239',

              padding:
                '12px 14px',

              borderRadius:
                8,

              fontSize:
                12,

              border:
                '1px solid #fecdd3',

              boxShadow:
                '0 4px 12px rgba(0,0,0,0.12)',
            }}
          >
            {mapError}
          </div>
        )}

        {polygonDrawingMode && (
          <div
            style={{
              position:
                'absolute',

              top:
                isMobile ? 60 : 16,

              left:
                '50%',

              transform:
                'translateX(-50%)',

              zIndex:
                20,

              background:
                'rgba(37,99,235,0.94)',

              color:
                '#ffffff',

              padding:
                '9px 14px',

              borderRadius:
                7,

              fontSize:
                12,

              fontWeight:
                600,

              boxShadow:
                '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            Polygon mode  click the map to add points
          </div>
        )}
      </div>

      {/* =====================================================
          OFFICER RIGHT PANEL
          Completely hidden on public Explore Map.
          ===================================================== */}

      {officerMode && (!isMobile || showMobileRightSidebar) && (
        <div
          style={{
            width:
              isMobile ? '100%' : '360px',

            height:
              isMobile ? '45%' : '100%',

            position:
              isMobile ? 'absolute' : 'relative',
            
            bottom:
              isMobile ? 0 : 'auto',

            background:
              '#ffffff',

            borderLeft:
              isMobile ? 'none' : '1px solid #e2e8f0',
              
            borderTop:
              isMobile ? '1px solid #e2e8f0' : 'none',

            zIndex:
              35,
              
            boxShadow:
              isMobile ? '0 -4px 12px rgba(0,0,0,0.1)' : 'none',

            display:
              'flex',

            flexDirection:
              'column',

            minWidth:
              0,
          }}
        >
          {/* =================================================
              SCROLLABLE UPPER PANEL
              ================================================= */}

          <div
            style={{
              flex:
                1,

              overflowY:
                'auto',

              padding:
                '24px',
            }}
          >
            {/* =================================================
                SPATIAL MAPPING
                ================================================= */}

            {showAdministrativeSelector && (
              <>
                <AdministrativeSelector
                  compact={
                    false
                  }

                  initialSelection={
                    selectedAdministrativeArea
                  }

                  onSelectionChange={
                    handleAdministrativeSelection
                  }
                />

                <div
                  style={{
                    height:
                      1,

                    background:
                      '#e2e8f0',

                    margin:
                      '22px 0 20px',
                  }}
                />
              </>
            )}



            {/* =================================================
                YOUR WORK
                OFFICER ONLY
                ================================================= */}

            <div
              style={{
                height:
                  1,

                background:
                  '#e2e8f0',

                margin:
                  '22px 0 20px',
              }}
            />

            <YourWorkPanel
              currentSelection={
                selectedAdministrativeArea
              }

              polygonPoints={
                polygonPoints
              }

              onLoadLocation={
                handleLoadSavedLocation
              }

              onStartPolygon={
                handleStartPolygon
              }

              onClearPolygon={
                handleClearPolygon
              }

              onAddCoordinatePoint={(
                point
              ) => {
                setPolygonPoints(
                  previous => [
                    ...previous,
                    point,
                  ]
                );
              }}

              onAddPlacePoint={
                handleAddPlacePoint
              }

              onLoadPolygon={
                handleLoadPolygon
              }
            />
            {/* =================================================
                INTEGRATION FRAMEWORK
                ================================================= */}

            <h2
              style={{
                margin:
                  '0 0 20px 0',

                color:
                  '#0f172a',

                fontSize:
                  '1.25rem',
              }}
            >
              Integration Framework
            </h2>

            {LAYER_CATEGORIES.map(
              category => (
                <div
                  key={
                    category.title
                  }
                  style={{
                    marginBottom:
                      '12px',
                  }}
                >
                  <div
                    onClick={() =>
                      toggleCategory(
                        category.title
                      )
                    }
                    style={{
                      display:
                        'flex',

                      alignItems:
                        'center',

                      justifyContent:
                        'space-between',

                      padding:
                        '10px 12px',

                      background:
                        '#f1f5f9',

                      borderRadius:
                        '6px',

                      cursor:
                        'pointer',

                      border:
                        '1px solid #e2e8f0',
                    }}
                  >
                    <span
                      style={{
                        fontSize:
                          '13px',

                        fontWeight:
                          '700',

                        color:
                          '#334155',
                      }}
                    >
                      {
                        category.title
                      }
                    </span>

                    {openCategories[
                      category.title
                    ] ? (
                      <ChevronDown
                        size={
                          16
                        }
                        color="#64748b"
                      />
                    ) : (
                      <ChevronRight
                        size={
                          16
                        }
                        color="#64748b"
                      />
                    )}
                  </div>

                  {openCategories[
                    category.title
                  ] && (
                    <div
                      style={{
                        padding:
                          '8px 4px 8px 12px',

                        display:
                          'flex',

                        flexDirection:
                          'column',

                        gap:
                          '8px',
                      }}
                    >
                      {category.layers.map(
                        layer => (
                          <label
                            key={
                              layer.id
                            }
                            style={{
                              display:
                                'flex',

                              alignItems:
                                'center',

                              gap:
                                '10px',

                              cursor:
                                'pointer',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={
                                !!activeLayers[
                                  layer.id
                                ]
                              }
                              onChange={() =>
                                toggleLayer(
                                  layer.id,
                                  
                                )
                              }
                              style={{
                                width:
                                  '16px',

                                height:
                                  '16px',

                                cursor:
                                  'pointer',

                                accentColor:
                                  '#2563eb',
                              }}
                            />

                            <span
  style={{
    fontSize:
      '13px',

    color:
      '#0f172a',

    fontWeight:
      '500',
  }}
>
  {layer.name}

  {layerLoading[layer.id] && (
    <span
      style={{
        marginLeft:
          '6px',

        fontSize:
          '10px',

        color:
          '#2563eb',
      }}
    >
      loading…
    </span>
  )}

  {layerErrors[layer.id] && (
    <span
      style={{
        marginLeft:
          '6px',

        fontSize:
          '10px',

        color:
          '#dc2626',
      }}
      title={
        layerErrors[
          layer.id
        ]
      }
    >
      error
    </span>
  )}
</span>
                          </label>
                        )
                      )}
                    </div>
                  )}
                </div>
              )
            )}          </div>

          {/* =================================================
              LOCATION INTELLIGENCE
              ================================================= */}

          <div
            style={{
              borderTop:
                '2px dashed #e2e8f0',

              padding:
                '24px',

              background:
                '#f8fafc',

              maxHeight:
                '42%',

              overflowY:
                'auto',
            }}
          >
            <h2
              style={{
                margin:
                  '0 0 16px 0',

                color:
                  '#0f172a',

                fontSize:
                  '1.1rem',

                fontWeight:
                  '700',
              }}
            >
              Location Intelligence
            </h2>

            {/* =================================================
                ANALYSIS AREA
                ================================================= */}

            {selectedAdministrativeArea && (
              <div
                style={{
                  background:
                    '#eff6ff',

                  padding:
                    '12px',

                  borderRadius:
                    8,

                  border:
                    '1px solid #bfdbfe',

                  marginBottom:
                    '12px',

                  fontSize:
                    11,

                  color:
                    '#1e40af',

                  lineHeight:
                    1.5,
                }}
              >
                <div
                  style={{
                    fontSize:
                      10,

                    fontWeight:
                      700,

                    textTransform:
                      'uppercase',

                    letterSpacing:
                      '0.4px',

                    marginBottom:
                      3,
                  }}
                >
                  Analysis Area
                </div>

                <div
                  style={{
                    fontWeight:
                      600,
                  }}
                >
                  {
                    selectedAdministrativeArea
                      .state?.name
                  }

                  {
                    selectedAdministrativeArea
                      .district?.name
                      ? ` → ${selectedAdministrativeArea.district.name}`
                      : ''
                  }

                  {
                    selectedAdministrativeArea
                      .geography?.name
                      ? ` → ${selectedAdministrativeArea.geography.name}`
                      : ''
                  }

                  {
                    selectedAdministrativeArea
                      .ulb?.name
                      ? ` → ${selectedAdministrativeArea.ulb.name}`
                      : ''
                  }

                  {
                    selectedAdministrativeArea
                      .ward?.number
                      ? ` → Ward ${selectedAdministrativeArea.ward.number}`
                      : ''
                  }

                  {
                    selectedAdministrativeArea
                      .coordinates
                      ? ` → ${selectedAdministrativeArea.coordinates.latitude}, ${selectedAdministrativeArea.coordinates.longitude}`
                      : ''
                  }
                </div>
              </div>
            )}

            {/* =================================================
                SELECTED LAYERS SUMMARY
                ================================================= */}

            <div
              style={{
                background:
                  '#ffffff',

                border:
                  '1px solid #e2e8f0',

                borderRadius:
                  8,

                padding:
                  '12px',

                marginBottom:
                  '12px',
              }}
            >
              <div
                style={{
                  fontSize:
                    11,

                  fontWeight:
                    700,

                  color:
                    '#475569',

                  marginBottom:
                    8,
                }}
              >
                Active Analysis Layers
              </div>

              {LAYER_CATEGORIES
                .flatMap(
                  category =>
                    category.layers
                )
                .filter(
                  layer =>
                    activeLayers[
                      layer.id
                    ]
                )
                .length >
              0 ? (
                LAYER_CATEGORIES
                  .flatMap(
                    category =>
                      category.layers
                  )
                  .filter(
                    layer =>
                      activeLayers[
                        layer.id
                      ]
                  )
                  .map(
                    layer => (
                      <div
                        key={
                          layer.id
                        }
                        style={{
                          fontSize:
                            11,

                          padding:
                            '4px 0',

                          color:
                            '#334155',
                        }}
                      >
                        ✓ {layer.name}
                      </div>
                    )
                  )
              ) : (
                <div
                  style={{
                    fontSize:
                      11,

                    color:
                      '#94a3b8',
                  }}
                >
                  No analysis layer selected.
                </div>
              )}
            </div>

            {/* =================================================
                AOI SUMMARY
                ================================================= */}

            <div
              style={{
                background:
                  '#ffffff',

                border:
                  '1px solid #e2e8f0',

                borderRadius:
                  8,

                padding:
                  '12px',

                marginBottom:
                  '12px',
              }}
            >
              <div
                style={{
                  fontSize:
                    11,

                  fontWeight:
                    700,

                  color:
                    '#475569',

                  marginBottom:
                    6,
                }}
              >
                Survey / AOI
              </div>

              <div
                style={{
                  fontSize:
                    11,

                  color:
                    polygonPoints.length >=
                    3
                      ? '#166534'
                      : '#64748b',
                }}
              >
                {polygonPoints.length >=
                3
                  ? `${polygonPoints.length} points selected`
                  : 'No AOI polygon selected'}
              </div>
            </div>

            {/* =================================================
                SELECTED MAP FEATURE
                ================================================= */}

            {selectedFeature ? (
              <div
                style={{
                  background:
                    '#ffffff',

                  padding:
                    '16px',

                  borderRadius:
                    '8px',

                  border:
                    '1px solid #e2e8f0',

                  boxShadow:
                    '0 1px 2px rgba(0,0,0,0.05)',

                  marginBottom:
                    '12px',
                }}
              >
                <div
                  style={{
                    fontSize:
                      '11px',

                    color:
                      '#64748b',

                    marginBottom:
                      '4px',

                    textTransform:
                      'uppercase',

                    letterSpacing:
                      '0.5px',
                  }}
                >
                  Selected Layer:{' '}
                  {
                    selectedFeature.layer
                  }
                </div>

                <div
                  style={{
                    fontSize:
                      '1rem',

                    fontWeight:
                      '700',

                    color:
                      '#0f172a',

                    marginBottom:
                      '16px',

                    display:
                      'flex',

                    alignItems:
                      'center',

                    gap:
                      '6px',
                  }}
                >
                  ID:{' '}
                  {
                    selectedFeature
                      .properties
                      .parcel_id ||
                    selectedFeature
                      .properties
                      .building_id ||
                    selectedFeature
                      .properties
                      .road_id ||
                    selectedFeature
                      .properties
                      .utility_id ||
                    'Unknown'
                  }
                </div>

                {selectedFeature.lngLat && (
                  <div
                    style={{
                      display:
                        'flex',

                      justifyContent:
                        'space-between',

                      padding:
                        '6px 0',

                      borderBottom:
                        '1px solid #f1f5f9',

                      fontSize:
                        '12px',
                    }}
                  >
                    <span
                      style={{
                        color:
                          '#475569',

                        display:
                          'flex',

                        alignItems:
                          'center',

                        gap:
                          '4px',
                      }}
                    >
                      <Crosshair
                        size={
                          12
                        }
                      />
                      Target Coordinates
                    </span>

                    <span
                      style={{
                        fontWeight:
                          '600',

                        color:
                          '#2563eb',
                      }}
                    >
                      {
                        selectedFeature
                          .lngLat
                          .lat
                          .toFixed(
                            5
                          )
                      }
                      ° N,{' '}
                      {
                        selectedFeature
                          .lngLat
                          .lng
                          .toFixed(
                            5
                          )
                      }
                      ° E
                    </span>
                  </div>
                )}

                {selectedFeature
                  .properties
                  .area_sqm && (
                  <div
                    style={{
                      display:
                        'flex',

                      justifyContent:
                        'space-between',

                      padding:
                        '6px 0',

                      borderBottom:
                        '1px solid #f1f5f9',

                      fontSize:
                        '12px',
                    }}
                  >
                    <span
                      style={{
                        color:
                          '#475569',
                      }}
                    >
                      Calculated Area
                    </span>

                    <span
                      style={{
                        fontWeight:
                          '600',
                      }}
                    >
                      {
                        selectedFeature
                          .properties
                          .area_sqm
                      }{' '}
                      sqm
                    </span>
                  </div>
                )}

                {selectedFeature
                  .properties
                  .confidence_score && (
                  <div
                    style={{
                      display:
                        'flex',

                      justifyContent:
                        'space-between',

                      padding:
                        '8px',

                      fontSize:
                        '12px',

                      marginTop:
                        '12px',

                      background:
                        '#ecfdf5',

                      borderRadius:
                        '4px',

                      border:
                        '1px solid #d1fae5',
                    }}
                  >
                    <span
                      style={{
                        color:
                          '#047857',

                        fontWeight:
                          '700',
                      }}
                    >
                      Extraction Confidence
                    </span>

                    <span
                      style={{
                        fontWeight:
                          '800',

                        color:
                          '#059669',
                      }}
                    >
                      {
                        selectedFeature
                          .properties
                          .confidence_score
                      }
                      %
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  padding:
                    '16px',

                  textAlign:
                    'center',

                  color:
                    '#94a3b8',

                  border:
                    '1px dashed #cbd5e1',

                  borderRadius:
                    '8px',

                  fontSize:
                    '12px',

                  background:
                    '#ffffff',

                  marginBottom:
                    '12px',
                }}
              >
                Select an active integration feature
                on the map to view intelligent
                attribute data.
              </div>
            )}

            {/* =================================================
                REPORT
                ================================================= */}

            <button
              type="button"
              onClick={
                generatePreliminaryReport
              }
              style={{
                width:
                  '100%',

                display:
                  'flex',

                alignItems:
                  'center',

                justifyContent:
                  'center',

                gap:
                  '7px',

                padding:
                  '10px',

                border:
                  'none',

                borderRadius:
                  '6px',

                background:
                  '#0f172a',

                color:
                  '#ffffff',

                fontSize:
                  '12px',

                fontWeight:
                  '600',

                cursor:
                  'pointer',
              }}
            >
              <FileText
                size={14}
              />

              Generate Preliminary Report
            </button>

            <div
              style={{
                marginTop:
                  '8px',

                fontSize:
                  '9px',

                lineHeight:
                  1.4,

                color:
                  '#94a3b8',

                textAlign:
                  'center',
              }}
            >
              Full PostGIS-based AOI reporting will
              be connected when the analysis backend
              is implemented.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}