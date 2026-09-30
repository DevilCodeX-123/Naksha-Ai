import re
content = open('naksha_frontend/src/components/views/ExploreMap.jsx', encoding='utf-8').read()

# We know ReportModal is imported, let's inject it into ExploreMap rendering
if "<ReportModal" not in content:
    # Let's find the main return of ExploreMap.
    # It probably looks like:
    #   return (
    #     <div ...>
    #       <div ref={mapContainer} ...>
    # So let's look for mapContainer
    anchor = "ref={mapContainer}"
    replacement = "<ReportModal isOpen={!!reportData} onClose={() => setReportData(null)} reportData={reportData} polygonPoints={polygonPoints} />\n          <div ref={mapContainer}"
    content = re.sub(r'<div[^>]*?ref=\{mapContainer\}', replacement, content)
    
    # Actually re.sub might be dangerous if we don't match the exact tag. 
    # Let's just replace the exact string "ref={mapContainer}" with "ref={mapContainer}" and insert the modal before it.
    
content = content.replace("ref={mapContainer}", "ref={mapContainer}") # Just a dummy to check

# Wait, `ref={mapContainer}` is used when rendering the map div.
content = content.replace("        <div\n          ref={mapContainer}", "        <ReportModal isOpen={!!reportData} onClose={() => setReportData(null)} reportData={reportData} polygonPoints={polygonPoints} />\n        <div\n          ref={mapContainer}")

open('naksha_frontend/src/components/views/ExploreMap.jsx', 'w', encoding='utf-8').write(content)
print("Injected ReportModal")
