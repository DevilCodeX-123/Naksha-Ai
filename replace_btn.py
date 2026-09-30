import re

content = open('naksha_frontend/src/components/views/ExploreMap.jsx', encoding='utf-8').read()

pattern = r'<button[^>]*>[\s\S]*?Generate Preliminary Report\s*</button>'
replacement = '''<button onClick={generatePreliminaryReport} disabled={isReportLoading} style={{width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px 16px", backgroundColor: isReportLoading ? "#475569" : "#0f172a", color: "white", border: "none", borderRadius: "8px", fontSize: "0.875rem", fontWeight: "600", cursor: isReportLoading ? "not-allowed" : "pointer"}}><FileText size={14} />{isReportLoading ? "Generating..." : "Generate Preliminary Report"}</button>'''

content = re.sub(pattern, replacement, content)

open('naksha_frontend/src/components/views/ExploreMap.jsx', 'w', encoding='utf-8').write(content)
print('Regex replaced button')
