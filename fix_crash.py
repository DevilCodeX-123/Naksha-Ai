content = open('naksha_frontend/src/components/views/ExploreMap.jsx', encoding='utf-8').read()

# 1. Remove the key from Google Maps tiles
content = content.replace(
    "`https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`",
    "'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'"
)

# 2. Fix the beforeId crash in polygon-mask-layer
content = content.replace('}, AOI_FILL_LAYER_ID);', '});')

open('naksha_frontend/src/components/views/ExploreMap.jsx', 'w', encoding='utf-8').write(content)
print('Fixed map crashes!')
