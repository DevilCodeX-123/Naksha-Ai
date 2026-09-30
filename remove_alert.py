import sys
content = open('naksha_frontend/src/components/views/ExploreMap.jsx', encoding='utf-8').read()
old = "      setMapStatus('ready');\n      alert(`Found and highlighted ${features.length} buildings in this polygon!`);"
new = "      setMapStatus('ready');\n      // alert(`Found and highlighted ${features.length} buildings in this polygon!`);"
if old in content:
    content = content.replace(old, new)
    open('naksha_frontend/src/components/views/ExploreMap.jsx', 'w', encoding='utf-8').write(content)
    print('Removed blocking alert')
else:
    print('Alert not found')
