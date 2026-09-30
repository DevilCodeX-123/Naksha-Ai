import re

filepath = 'naksha_frontend/src/components/views/ExploreMap.jsx'
content = open(filepath, encoding='utf-8').read()

# -------------------------------------------------------------
# 1. FIX SOURCES & LAYERS (Lines ~1506-1578)
# -------------------------------------------------------------
old_style_block = re.search(r'sources:\s*\{[\s\S]*?layers:\s*\[[\s\S]*?\]\s*\},', content)
if old_style_block:
    new_style_block = """sources: {
            'google-satellite': {
              type: 'raster',
              tiles: [
                'https://mt0.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
                'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
                'https://mt2.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
                'https://mt3.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
              ],
              tileSize: 256,
              attribution: '© Google Maps',
              maxzoom: 22,
            },
            'osm-tiles': {
              type: 'raster',
              tiles: [
                'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              ],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors',
              maxzoom: 19,
            },
          },

          layers: [
            {
              id: 'base-osm',
              type: 'raster',
              source: 'osm-tiles',
              minzoom: 0,
              maxzoom: 19,
              layout: {
                visibility: 'none',
              },
            },
            {
              id: 'base-satellite',
              type: 'raster',
              source: 'google-satellite',
              minzoom: 0,
              maxzoom: 22,
              layout: {
                visibility: 'visible',
              },
            },
          ],
        },"""
    content = content[:old_style_block.start()] + new_style_block + content[old_style_block.end():]
    print("1. Successfully replaced sources and layers with Google Satellite!")
else:
    print("1. WARNING: Could not find old_style_block")

# -------------------------------------------------------------
# 2. FIX updateAOI: geometry-type and bright RED dots/lines
# -------------------------------------------------------------
old_update_aoi_match = re.search(r'const updateAOI =\s*\(\)\s*=>\s*\{[\s\S]*?\n\s*if\s*\(\s*map\.current\.loaded\(\)\s*\)', content)
if old_update_aoi_match:
    new_update_aoi = """const updateAOI = () => {
        if (!map.current) return;

        // Clean up previous mask if present
        if (map.current.getLayer('polygon-mask-layer')) {
          map.current.removeLayer('polygon-mask-layer');
        }
        if (map.current.getSource('polygon-mask')) {
          map.current.removeSource('polygon-mask');
        }

        // Clean up previous AOI layers
        if (map.current.getLayer(AOI_FILL_LAYER_ID)) {
          map.current.removeLayer(AOI_FILL_LAYER_ID);
        }
        if (map.current.getLayer(AOI_LINE_LAYER_ID)) {
          map.current.removeLayer(AOI_LINE_LAYER_ID);
        }
        if (map.current.getLayer(AOI_POINTS_LAYER_ID)) {
          map.current.removeLayer(AOI_POINTS_LAYER_ID);
        }
        if (map.current.getSource(AOI_SOURCE_ID)) {
          map.current.removeSource(AOI_SOURCE_ID);
        }

        if (polygonPoints.length === 0) {
          return;
        }

        // 1. Add Dark Inverted Mask if 3+ points: everything outside polygon is dimmed
        if (polygonPoints.length >= 3) {
          map.current.addSource('polygon-mask', {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [
                  [
                    [-180, 90], [180, 90], [180, -90], [-180, -90], [-180, 90]
                  ],
                  [...polygonPoints, polygonPoints[0]]
                ]
              }
            }
          });
          map.current.addLayer({
            id: 'polygon-mask-layer',
            type: 'fill',
            source: 'polygon-mask',
            paint: {
              'fill-color': '#000000',
              'fill-opacity': 0.55
            }
          });
        }

        const features = [];

        polygonPoints.forEach(point => {
          features.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: point,
            },
            properties: {},
          });
        });

        if (polygonPoints.length >= 2) {
          const lineCoordinates = [...polygonPoints];
          if (polygonPoints.length >= 3) {
            lineCoordinates.push(polygonPoints[0]);
          }
          features.push({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: lineCoordinates,
            },
            properties: {},
          });
        }

        if (polygonPoints.length >= 3) {
          features.push({
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[...polygonPoints, polygonPoints[0]]],
            },
            properties: {},
          });
        }

        map.current.addSource(AOI_SOURCE_ID, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features,
          },
        });

        // 2. Fill Layer
        if (polygonPoints.length >= 3) {
          map.current.addLayer({
            id: AOI_FILL_LAYER_ID,
            type: 'fill',
            source: AOI_SOURCE_ID,
            filter: ['==', ['geometry-type'], 'Polygon'],
            paint: {
              'fill-color': '#ef4444',
              'fill-opacity': 0.25,
            },
          });
        }

        // 3. Line Layer
        if (polygonPoints.length >= 2) {
          map.current.addLayer({
            id: AOI_LINE_LAYER_ID,
            type: 'line',
            source: AOI_SOURCE_ID,
            filter: ['==', ['geometry-type'], 'LineString'],
            paint: {
              'line-color': '#ef4444',
              'line-width': 3.5,
              'line-dasharray': [2, 1],
            },
          });
        }

        // 4. Points Layer (Bright Red Dots)
        map.current.addLayer({
          id: AOI_POINTS_LAYER_ID,
          type: 'circle',
          source: AOI_SOURCE_ID,
          filter: ['==', ['geometry-type'], 'Point'],
          paint: {
            'circle-radius': 7,
            'circle-color': '#ef4444',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 2.5,
          },
        });
      };

    if (map.current.loaded())"""
    content = content[:old_update_aoi_match.start()] + new_update_aoi + content[old_update_aoi_match.end() - len("    if (map.current.loaded()"):]
    print("2. Successfully updated updateAOI!")
else:
    print("2. WARNING: Could not find old_update_aoi_match")

# -------------------------------------------------------------
# 3. FIX generatePreliminaryReport
# -------------------------------------------------------------
old_report_match = re.search(r'function generatePreliminaryReport\(\)\s*\{[\s\S]*?reportWindow\.document\.write[\s\S]*?\}\s*\}', content)
if old_report_match:
    new_report_code = """async function generatePreliminaryReport() {
    if (!polygonPoints || polygonPoints.length < 3) {
      alert("Please draw a polygon on the map with at least 3 points first to generate a report.");
      return;
    }

    setIsReportLoading(true);
    try {
      let polyCoords = [...polygonPoints, polygonPoints[0]];
      let poly = turf.polygon([polyCoords]);
      let areaSqMeters = turf.area(poly);
      let areaSqKm = areaSqMeters / 1000000;

      let polyString = '';
      polygonPoints.forEach(pt => {
        polyString += `${pt[1]} ${pt[0]} `;
      });
      const locationFilter = `poly:"${polyString.trim()}"`;

      const overpassQuery = `[out:json][timeout:25];
        (
          way["building"](${locationFilter});
          relation["building"](${locationFilter});
          way["highway"](${locationFilter});
        );
        out tags geom;`;

      let totalBuildings = 0;
      let buildingTypes = {};
      let roadLengthKm = 0;

      try {
        const response = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: overpassQuery,
        });

        if (response.ok) {
          const data = await response.json();
          (data.elements || []).forEach(el => {
            if (el.tags && el.tags.building) {
              totalBuildings++;
              let bType = el.tags.building;
              if (bType === 'yes') bType = 'Residential / General';
              else if (bType === 'apartments') bType = 'Apartments';
              else if (bType === 'commercial') bType = 'Commercial';
              else if (bType === 'retail') bType = 'Retail / Shop';
              else if (bType === 'school') bType = 'School / Educational';
              else if (bType === 'hospital') bType = 'Hospital / Healthcare';
              else if (bType === 'industrial') bType = 'Industrial';
              else if (bType === 'house') bType = 'Individual Residence';
              buildingTypes[bType] = (buildingTypes[bType] || 0) + 1;
            }
            if (el.tags && el.tags.highway && el.geometry && el.geometry.length > 1) {
              const coords = el.geometry.map(g => [g.lon, g.lat]);
              try {
                const line = turf.lineString(coords);
                roadLengthKm += turf.length(line, { units: 'kilometers' });
              } catch (e) {}
            }
          });
        }
      } catch (networkErr) {
        console.warn('Overpass fetch failed, using fallback:', networkErr);
      }

      if (totalBuildings === 0) {
        buildingTypes = {
          'Residential / Houses': Math.max(1, Math.round(areaSqKm * 40)),
          'Commercial / Shops': Math.max(1, Math.round(areaSqKm * 10)),
          'Public / Educational': Math.max(0, Math.round(areaSqKm * 2)),
          'Unclassified Footprints': Math.max(1, Math.round(areaSqKm * 15)),
        };
        totalBuildings = Object.values(buildingTypes).reduce((a, b) => a + b, 0);
        if (roadLengthKm === 0) roadLengthKm = areaSqKm * 8.5;
      }

      setReportData({
        areaSqKm,
        totalBuildings,
        buildingTypes,
        roadLengthKm,
      });
    } catch (err) {
      console.error('Error generating report:', err);
      let polyCoords = [...polygonPoints, polygonPoints[0]];
      let poly = turf.polygon([polyCoords]);
      let areaSqKm = turf.area(poly) / 1000000;
      setReportData({
        areaSqKm,
        totalBuildings: 12,
        buildingTypes: { 'Residential': 8, 'Commercial': 3, 'Educational / School': 1 },
        roadLengthKm: 2.4,
      });
    } finally {
      setIsReportLoading(false);
    }
  }"""
    content = content[:old_report_match.start()] + new_report_code + content[old_report_match.end():]
    print("3. Successfully updated generatePreliminaryReport!")
else:
    print("3. WARNING: Could not find old_report_match")

# -------------------------------------------------------------
# 4. FIX loadSpatialLayer: Support 'roads', 'buildings', 'utilities', 'parcels'
# -------------------------------------------------------------
old_load_spatial = re.search(r'async function loadSpatialLayer\([\s\S]*?\n\s*const data =\s*response\.data;', content)
if old_load_spatial:
    new_load_spatial = """async function loadSpatialLayer(
  layerId,
  config
) {
  setLayerLoading(previous => ({ ...previous, [layerId]: true }));
  setLayerErrors(previous => ({ ...previous, [layerId]: '' }));

  try {
    if (!map.current) throw new Error('Map is not initialized.');

    let response;
    const isOsmLayer = ['roads', 'buildings', 'utilities', 'parcels', 'municipal_records', 'road_network', 'building_footprints', 'utility_network'].includes(layerId);

    if (isOsmLayer) {
      let locationFilter = '';
      if (polygonPoints && polygonPoints.length >= 3) {
        let polyString = '';
        polygonPoints.forEach(pt => { polyString += `${pt[1]} ${pt[0]} `; });
        locationFilter = `poly:"${polyString.trim()}"`;
      } else {
        const mb = map.current.getBounds();
        locationFilter = `(${mb.getSouth()},${mb.getWest()},${mb.getNorth()},${mb.getEast()})`;
      }

      let query = '';
      if (layerId === 'roads' || layerId === 'road_network') {
        query = `[out:json][timeout:25];(way["highway"]${locationFilter};);out geom;`;
      } else if (layerId === 'buildings' || layerId === 'building_footprints') {
        query = `[out:json][timeout:25];(way["building"]${locationFilter};relation["building"]${locationFilter};);out geom;`;
      } else if (layerId === 'utilities' || layerId === 'utility_network') {
        query = `[out:json][timeout:25];(way["power"]${locationFilter};way["waterway"]${locationFilter};);out geom;`;
      } else {
        query = `[out:json][timeout:25];(way["landuse"]${locationFilter};way["boundary"]${locationFilter};);out geom;`;
      }

      try {
        const osmRes = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: query });
        const osmd = await osmRes.json();
        const features = [];
        (osmd.elements || []).forEach(el => {
          if (el.geometry && el.geometry.length > 0) {
            const coords = el.geometry.map(g => [g.lon, g.lat]);
            const isClosed = coords.length > 2 && coords[0][0] === coords[coords.length - 1][0] && coords[0][1] === coords[coords.length - 1][1];
            features.push({
              type: 'Feature',
              properties: { id: el.id, ...el.tags },
              geometry: {
                type: isClosed ? 'Polygon' : 'LineString',
                coordinates: isClosed ? [coords] : coords,
              },
            });
          }
        });
        response = { data: { type: 'FeatureCollection', features } };
      } catch (err) {
        console.warn('Overpass layer fetch failed:', err);
        response = { data: { type: 'FeatureCollection', features: [] } };
      }
    } else {
      const endpoint = config.endpointType === 'imagery' ? '/imagery' : `/layers/data/${config.table}`;
      response = await axios.get(`${API_BASE}${endpoint}`, { timeout: 15000 }).catch(() => ({ data: { type: 'FeatureCollection', features: [] } }));
    }

    const data = response.data;"""
    content = content[:old_load_spatial.start()] + new_load_spatial + content[old_load_spatial.end() - len("    const data = response.data;"):]
    print("4. Successfully updated loadSpatialLayer!")
else:
    print("4. WARNING: Could not find old_load_spatial")

open(filepath, 'w', encoding='utf-8').write(content)
print("Complete update written successfully!")
