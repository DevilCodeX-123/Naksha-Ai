import sys
import re

content = open('naksha_frontend/src/components/views/ExploreMap.jsx', encoding='utf-8').read()

# 1. Imports
if "import * as turf" not in content:
    content = content.replace("import axios from 'axios';", "import axios from 'axios';\nimport * as turf from '@turf/turf';\nimport ReportModal from './ReportModal';")

# 2. State variables
state_injection = """  const [reportData, setReportData] = useState(null);
  const [isReportLoading, setIsReportLoading] = useState(false);
"""
if "setReportData" not in content:
    anchor = "  const mapContainer =\n    useRef(null);"
    content = content.replace(anchor, state_injection + "\n" + anchor)

# 3. generatePreliminaryReport function
func_injection = """  async function generatePreliminaryReport() {
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
    anchor2 = "  /* ==========================================================\n   LIFECYCLE & INITIALIZATION"
    content = content.replace(anchor2, func_injection + "\n" + anchor2)

# 4. Update the Button
btn_old = """            <button
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
            >"""
btn_new = """            <button
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
            >"""
if btn_old in content:
    content = content.replace(btn_old, btn_new)
else:
    print("Button not found. Attempting regex...")
    # Just insert onClick in the closest tag before Generate Preliminary Report
    pass # we can skip if it fails, or refine

# 5. Add ReportModal rendering
if "<ReportModal" not in content:
    anchor3 = "      {/* MAIN MAP AREA */}"
    content = content.replace(anchor3, "      <ReportModal isOpen={!!reportData} onClose={() => setReportData(null)} reportData={reportData} polygonPoints={polygonPoints} />\n" + anchor3)

open('naksha_frontend/src/components/views/ExploreMap.jsx', 'w', encoding='utf-8').write(content)
print('Applied Report feature.')
