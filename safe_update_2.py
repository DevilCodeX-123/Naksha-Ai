import sys
import re

content = open('naksha_frontend/src/components/views/ExploreMap.jsx', encoding='utf-8').read()

# 1. Fix the MapLibre geojson type filters
content = content.replace("filter: ['==', '$type', 'Polygon'],", "filter: ['==', ['geometry-type'], 'Polygon'],")
content = content.replace("filter: ['==', '$type', 'LineString'],", "filter: ['==', ['geometry-type'], 'LineString'],")
content = content.replace("filter: ['==', '$type', 'Point'],", "filter: ['==', ['geometry-type'], 'Point'],")
content = content.replace("filter: ['==', '$type', 'Point']", "filter: ['==', ['geometry-type'], 'Point']")
content = content.replace("filter: ['==', '$type', 'Polygon']", "filter: ['==', ['geometry-type'], 'Polygon']")
content = content.replace("filter: ['==', '$type', 'LineString']", "filter: ['==', ['geometry-type'], 'LineString']")

# 2. Add imports
if "import * as turf" not in content:
    content = content.replace("import axios from 'axios';", "import axios from 'axios';\nimport * as turf from '@turf/turf';\nimport ReportModal from './ReportModal';")

# 3. Add states
state_injection = "  const [reportData, setReportData] = useState(null);\n  const [isReportLoading, setIsReportLoading] = useState(false);\n"
if "setReportData" not in content:
    content = content.replace("  const mapClickHandler =\n    useRef(null);", state_injection + "\n  const mapClickHandler =\n    useRef(null);")

# 4. Add generatePreliminaryReport
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


# 5. Replace Button
# We'll search for the exact text string of the button
target_btn = """            <button
              style={{
                width:
                  '100%',

                display:
                  'flex',

                alignItems:
                  'center',

                justifyContent:
                  'center',

                gap: '8px',

                padding:
                  '12px 16px',

                backgroundColor:
                  '#0f172a',

                color:
                  'white',

                border:
                  'none',

                borderRadius:
                  '8px',

                fontSize:
                  '0.875rem',

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
            </button>"""

replacement_btn = """            <button
              onClick={generatePreliminaryReport}
              disabled={isReportLoading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 16px',
                backgroundColor: isReportLoading ? '#475569' : '#0f172a',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: isReportLoading ? 'not-allowed' : 'pointer',
              }}
            >
              <FileText size={14} />
              {isReportLoading ? "Generating..." : "Generate Preliminary Report"}
            </button>"""

if target_btn in content:
    content = content.replace(target_btn, replacement_btn)
else:
    print("WARNING: Button not found!")

# 6. Add Modal
if "<ReportModal" not in content:
    content = content.replace("{/* MAIN MAP AREA */}", "<ReportModal isOpen={!!reportData} onClose={() => setReportData(null)} reportData={reportData} polygonPoints={polygonPoints} />\n      {/* MAIN MAP AREA */}")

# 7. Add Inverted Polygon Mask Layer! 
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

# 8. Mask cleanup
if "map.current.removeLayer('polygon-mask-layer')" not in content:
    old_cleanup = "if (map.current.getSource(AOI_SOURCE_ID)) {"
    new_cleanup = "if (map.current.getLayer('polygon-mask-layer')) map.current.removeLayer('polygon-mask-layer');\n      if (map.current.getSource('polygon-mask')) map.current.removeSource('polygon-mask');\n      if (map.current.getSource(AOI_SOURCE_ID)) {"
    content = content.replace(old_cleanup, new_cleanup)

open('naksha_frontend/src/components/views/ExploreMap.jsx', 'w', encoding='utf-8').write(content)
print("Safely updated ExploreMap.jsx!")
