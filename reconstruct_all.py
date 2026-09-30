import re
import sys
import os

filepath = 'naksha_frontend/src/components/views/ExploreMap.jsx'
content = open(filepath, encoding='utf-8').read()

# 1. safe_update_2.py
content = content.replace("filter: ['==', '$type', 'Polygon'],", "filter: ['==', ['geometry-type'], 'Polygon'],")
content = content.replace("filter: ['==', '$type', 'LineString'],", "filter: ['==', ['geometry-type'], 'LineString'],")
content = content.replace("filter: ['==', '$type', 'Point'],", "filter: ['==', ['geometry-type'], 'Point'],")
content = content.replace("filter: ['==', '$type', 'Point']", "filter: ['==', ['geometry-type'], 'Point']")
content = content.replace("filter: ['==', '$type', 'Polygon']", "filter: ['==', ['geometry-type'], 'Polygon']")
content = content.replace("filter: ['==', '$type', 'LineString']", "filter: ['==', ['geometry-type'], 'LineString']")

if "import * as turf" not in content:
    content = content.replace("import axios from 'axios';", "import axios from 'axios';\nimport * as turf from '@turf/turf';\nimport ReportModal from './ReportModal';")

state_injection = "  const [reportData, setReportData] = useState(null);\n  const [isReportLoading, setIsReportLoading] = useState(false);\n"
if "setReportData" not in content:
    content = content.replace("  const mapClickHandler =\n    useRef(null);", state_injection + "\n  const mapClickHandler =\n    useRef(null);")

func_injection = """
  async function generatePreliminaryReport() {
    if (!polygonPoints || polygonPoints.length < 3) {
      alert("Please draw a complete polygon (at least 3 points) first.");
      return;
    }
    
    setIsReportLoading(true);
    try {
      let polyString = '';
      polygonPoints.forEach(pt => { polyString += `${pt[1]} ${pt[0]} `; });
      const locationFilter = `poly:"${polyString.trim()}"`;
      
      const overpassQuery = `[out:json];
        (
          way["building"](${locationFilter});
          relation["building"](${locationFilter});
          way["highway"](${locationFilter});
        );
        out geom;`;

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: overpassQuery
      });
      const data = await response.json();
      
      let totalBuildings = 0;
      let buildingTypes = {};
      let roadLengthKm = 0;
      
      data.elements.forEach(el => {
        if (el.tags && el.tags.building) {
          totalBuildings++;
          let bType = el.tags.building;
          if (bType === 'yes') bType = 'Undefined / Residential';
          buildingTypes[bType] = (buildingTypes[bType] || 0) + 1;
        }
        if (el.tags && el.tags.highway && el.geometry) {
          const coords = el.geometry.map(g => [g.lon, g.lat]);
          const line = turf.lineString(coords);
          roadLengthKm += turf.length(line, { units: 'kilometers' });
        }
      });
      
      let polygonCoords = [...polygonPoints, polygonPoints[0]];
      let poly = turf.polygon([polygonCoords]);
      let areaSqMeters = turf.area(poly);
      let areaSqKm = areaSqMeters / 1000000;
      
      setReportData({
        areaSqKm,
        totalBuildings,
        buildingTypes,
        roadLengthKm
      });
      
    } catch (err) {
      console.error(err);
      alert("Failed to generate report. Please try again.");
    } finally {
      setIsReportLoading(false);
    }
  }
"""
if "generatePreliminaryReport" not in content:
    content = content.replace("  /* ==========================================================\n   LIFECYCLE & INITIALIZATION\n   ========================================================== */", func_injection + "\n  /* ==========================================================\n   LIFECYCLE & INITIALIZATION\n   ========================================================== */")

mask_layer = """
        // Add Inverted Polygon Mask to darken the outside
        if (map.current.getSource('polygon-mask')) {
          map.current.getSource('polygon-mask').setData({
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
          });
        } else {
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
              'fill-opacity': 0.7
            }
          }, AOI_FILL_LAYER_ID);
        }
"""
if "polygon-mask-layer" not in content:
    content = content.replace("        map.current.addLayer({\n          id: AOI_FILL_LAYER_ID,", mask_layer + "\n        map.current.addLayer({\n          id: AOI_FILL_LAYER_ID,")

if "map.current.removeLayer('polygon-mask-layer')" not in content:
    old_cleanup = "if (map.current.getSource(AOI_SOURCE_ID)) {"
    new_cleanup = "if (map.current.getLayer('polygon-mask-layer')) map.current.removeLayer('polygon-mask-layer');\n      if (map.current.getSource('polygon-mask')) map.current.removeSource('polygon-mask');\n      if (map.current.getSource(AOI_SOURCE_ID)) {"
    content = content.replace(old_cleanup, new_cleanup)

# 2. fix_btn.py
pattern = r'<button\s*style=\{\{[\s\S]*?\}\}\s*>\s*<FileText[\s\S]*?/>\s*Generate Preliminary Report\s*</button>'
replacement = '''<button onClick={generatePreliminaryReport} disabled={isReportLoading} style={{width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", padding: "10px", backgroundColor: isReportLoading ? "#475569" : "#0f172a", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: isReportLoading ? "not-allowed" : "pointer"}}><FileText size={14} />{isReportLoading ? "Generating..." : "Generate Preliminary Report"}</button>'''
content = re.sub(pattern, replacement, content)

# 3. fix_modal_2.py
old_modal = "        <div\n          ref={\n            mapContainer\n          }"
new_modal = "        <ReportModal isOpen={!!reportData} onClose={() => setReportData(null)} reportData={reportData} polygonPoints={polygonPoints} />\n        <div\n          ref={\n            mapContainer\n          }"
if "<ReportModal isOpen=" not in content:
    content = content.replace(old_modal, new_modal)

# 4. fix_source.py (Google satellite & Red colors)
content = re.sub(
    r"'satellite-tiles':\s*\{[\s\S]*?attribution:[\s\S]*?\},",
    "'google-satellite': {\n              type: 'raster',\n              tiles: [\n                `https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`\n              ],\n              tileSize: 256,\n              attribution: 'Google Maps Hybrid | MapLibre',\n            },",
    content
)
content = re.sub(
    r"id:\s*'base-osm',[\s\S]*?visibility:\s*'visible',",
    lambda m: m.group(0).replace("'visible'", "'none'"),
    content
)
content = re.sub(
    r"id:\s*'base-satellite',[\s\S]*?visibility:\s*'none',",
    lambda m: m.group(0).replace("'none'", "'visible'"),
    content
)
content = re.sub(
    r"source:\s*'satellite-tiles',",
    r"source: 'google-satellite',",
    content
)

# Red points/lines/fills
content = re.sub(
    r"'circle-color':\s*'#ffffff',[\s\S]*?'circle-stroke-color':\s*'#3b82f6'",
    "'circle-color': '#ef4444',\n            'circle-radius': 7,\n            'circle-stroke-width': 2,\n            'circle-stroke-color': '#ffffff'",
    content
)
content = re.sub(
    r"'line-color':\s*'#3b82f6'",
    "'line-color': '#ef4444'",
    content
)
content = re.sub(
    r"'fill-color':\s*'#3b82f6'",
    "'fill-color': '#ef4444'",
    content
)

# 5. Overpass interception WITHOUT broken bounds
overpass_logic = """
    let response;
    if (['road_network', 'building_footprints', 'utility_network'].includes(layerId)) {
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
      if (layerId === 'road_network') query = `[out:json];(way["highway"]${locationFilter};);out geom;`;
      if (layerId === 'building_footprints') query = `[out:json];(way["building"]${locationFilter};relation["building"]${locationFilter};);out geom;`;
      if (layerId === 'utility_network') query = `[out:json];(way["power"]${locationFilter};way["waterway"]${locationFilter};);out geom;`;

      const osmRes = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: query });
      const osmd = await osmRes.json();

      const features = [];
      osmd.elements.forEach(el => {
        if (el.geometry) {
          const coords = el.geometry.map(g => [g.lon, g.lat]);
          if (coords.length > 0) {
            features.push({
              type: 'Feature',
              properties: { id: el.id, ...el.tags },
              geometry: {
                type: coords[0][0] === coords[coords.length-1][0] && coords[0][1] === coords[coords.length-1][1] ? 'Polygon' : 'LineString',
                coordinates: coords[0][0] === coords[coords.length-1][0] && coords[0][1] === coords[coords.length-1][1] ? [coords] : coords
              }
            });
          }
        }
      });
      response = { data: { type: 'FeatureCollection', features } };
    } else {
      response = await axios.get(`${API_BASE}${endpoint}`, { timeout: 30000 });
    }
"""

old_fetch = """    const response =
      await axios.get(
        `${API_BASE}${endpoint}`,
        {
          timeout:
            30000,
        }
      );"""

if "['road_network', 'building_footprints', 'utility_network'].includes(layerId)" not in content:
    content = content.replace(old_fetch, overpass_logic)


open(filepath, 'w', encoding='utf-8').write(content)
print("Reconstructed perfectly!")
