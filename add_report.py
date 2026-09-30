import sys
content = open('naksha_frontend/src/components/views/ExploreMap.jsx', encoding='utf-8').read()

imports_old = "import axios from 'axios';"
imports_new = "import axios from 'axios';\nimport * as turf from '@turf/turf';\nimport ReportModal from './ReportModal';"
if imports_old in content:
    content = content.replace(imports_old, imports_new)

state_old = "  const navigate = useNavigate();\n"
state_new = "  const navigate = useNavigate();\n  const [reportData, setReportData] = useState(null);\n  const [isReportLoading, setIsReportLoading] = useState(false);\n"
if state_old in content:
    content = content.replace(state_old, state_new)

func_anchor_old = "  /* ==========================================================\n   LIFECYCLE & INITIALIZATION\n   ========================================================== */"
func_new = """  async function generatePreliminaryReport() {
    if (!polygonPoints || polygonPoints.length < 3) {
      alert("Please draw a polygon first by selecting 'Start Polygon Selection'");
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
""" + func_anchor_old
if func_anchor_old in content:
    content = content.replace(func_anchor_old, func_new)

btn_old = """              <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">
                <FileText
                  size={
                    18
                  }
                />
                Generate Preliminary Report
              </button>"""

btn_new = """              <button onClick={generatePreliminaryReport} disabled={isReportLoading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50">
                <FileText size={18} />
                {isReportLoading ? "Generating..." : "Generate Preliminary Report"}
              </button>"""

if btn_old in content:
    content = content.replace(btn_old, btn_new)

# Now we need to render <ReportModal />
render_old = "      {/* MAIN MAP AREA */}"
render_new = "      <ReportModal isOpen={!!reportData} onClose={() => setReportData(null)} reportData={reportData} polygonPoints={polygonPoints} />\n      {/* MAIN MAP AREA */}"
if render_old in content:
    content = content.replace(render_old, render_new)

open('naksha_frontend/src/components/views/ExploreMap.jsx', 'w', encoding='utf-8').write(content)
print('Updated ExploreMap with Report feature')
