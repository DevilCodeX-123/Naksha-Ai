import re

content = open('naksha_frontend/src/components/views/ExploreMap.jsx', encoding='utf-8').read()

# Replace the entire satellite-tiles source with google-satellite
content = re.sub(
    r"'satellite-tiles':\s*\{[\s\S]*?attribution:[\s\S]*?\},",
    "'google-satellite': {\n              type: 'raster',\n              tiles: [\n                `https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`\n              ],\n              tileSize: 256,\n              attribution: 'Google Maps Hybrid | MapLibre',\n            },",
    content
)

open('naksha_frontend/src/components/views/ExploreMap.jsx', 'w', encoding='utf-8').write(content)
print('Fixed satellite source!')
