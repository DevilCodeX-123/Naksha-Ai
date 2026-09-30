import re

content = open('naksha_frontend/src/components/views/ExploreMap.jsx', encoding='utf-8').read()

# 1. Update satellite base layer source to google-satellite
content = re.sub(
    r"source:\s*'satellite-tiles',",
    r"source: 'google-satellite',",
    content
)

# 2. Add google-satellite source
google_source = """'google-satellite': {
              type: 'raster',
              tiles: [
                `https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
              ],
              tileSize: 256,
              attribution: 'Google Maps Hybrid | MapLibre',
            },"""
if "'google-satellite'" not in content:
    content = re.sub(
        r"('osm-tiles':\s*\{[\s\S]*?attribution:\s*'OpenStreetMap contributors',\s*\},)",
        r"\1\n            " + google_source,
        content
    )

# 3. Swap visibilities
# base-osm visibility: 'visible' -> 'none'
content = re.sub(
    r"id:\s*'base-osm',[\s\S]*?visibility:\s*'visible',",
    lambda m: m.group(0).replace("'visible'", "'none'"),
    content
)

# base-satellite visibility: 'none' -> 'visible'
content = re.sub(
    r"id:\s*'base-satellite',[\s\S]*?visibility:\s*'none',",
    lambda m: m.group(0).replace("'none'", "'visible'"),
    content
)

# 4. Red Polygon Points
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

# 5. Overpass interception
new_fetchLayer = """      let response;
      if (['road_network', 'building_footprints', 'utility_network'].includes(layerId)) {
        let locationFilter = '';
        if (polygonPoints && polygonPoints.length >= 3) {
          let polyString = '';
          polygonPoints.forEach(pt => { polyString += `${pt[1]} ${pt[0]} `; });
          locationFilter = `poly:"${polyString.trim()}"`;
        } else {
          locationFilter = `(${bounds[1]},${bounds[0]},${bounds[3]},${bounds[2]})`;
        }

        let query = '';
        if (layerId === 'road_network') query = `[out:json];(way["highway"]${locationFilter};);out geom;`;
        if (layerId === 'building_footprints') query = `[out:json];(way["building"]${locationFilter};relation["building"]${locationFilter};);out geom;`;
        if (layerId === 'utility_network') query = `[out:json];(way["power"]${locationFilter};way["waterway"]${locationFilter};);out geom;`;

        const osmRes = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: query });
        const data = await osmRes.json();

        const features = [];
        data.elements.forEach(el => {
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
        response = await axios.get(`${API_BASE}/api/v1/layers/${layerId}/data`, { params: { bbox: Array.from(bounds).join(',') } });
      }"""

if "'road_network', 'building_footprints'" not in content:
    content = re.sub(
        r"const response =\s*await axios\.get\([\s\S]*?\}\s*\);",
        new_fetchLayer,
        content
    )

open('naksha_frontend/src/components/views/ExploreMap.jsx', 'w', encoding='utf-8').write(content)
print('Restored successfully.')
