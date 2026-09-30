import sys

content = open('naksha_frontend/src/components/views/ExploreMap.jsx', encoding='utf-8').read()

old = "        <div\n          ref={\n            mapContainer\n          }"
new = "        <ReportModal isOpen={!!reportData} onClose={() => setReportData(null)} reportData={reportData} polygonPoints={polygonPoints} />\n        <div\n          ref={\n            mapContainer\n          }"

if "<ReportModal" not in content:
    content = content.replace(old, new)
    open('naksha_frontend/src/components/views/ExploreMap.jsx', 'w', encoding='utf-8').write(content)
    print("Added ReportModal!")
else:
    print("ReportModal already added!")
