import sys
content = open('naksha_frontend/src/components/views/ExploreMap.jsx', encoding='utf-8').read()

old = """    if (layerId === 'building_footprints' || layerId === 'road_network') {
      const bounds = map.current.getBounds();
      const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
      
      let overpassQuery = '';
      if (layerId === 'building_footprints') {
        overpassQuery = `[out:json];(way["building"](${bbox});relation["building"](${bbox}););out geom;`;
      } else if (layerId === 'road_network') {
        overpassQuery = `[out:json];(way["highway"](${bbox}););out geom;`;
      }"""

new = """    if (layerId === 'building_footprints' || layerId === 'road_network' || layerId === 'utility_network') {
      let locationFilter = '';
      if (polygonPoints && polygonPoints.length >= 3) {
        let polyString = '';
        polygonPoints.forEach(pt => { polyString += `${pt[1]} ${pt[0]} `; });
        locationFilter = `poly:"${polyString.trim()}"`;
      } else {
        const bounds = map.current.getBounds();
        locationFilter = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
      }
      
      let overpassQuery = '';
      if (layerId === 'building_footprints') {
        overpassQuery = `[out:json];(way["building"](${locationFilter});relation["building"](${locationFilter}););out geom;`;
      } else if (layerId === 'road_network') {
        overpassQuery = `[out:json];(way["highway"](${locationFilter}););out geom;`;
      } else if (layerId === 'utility_network') {
        overpassQuery = `[out:json];(way["power"](${locationFilter});node["power"](${locationFilter}););out geom;`;
      }"""

if old in content:
    content = content.replace(old, new)
    open('naksha_frontend/src/components/views/ExploreMap.jsx', 'w', encoding='utf-8').write(content)
    print('Updated overpass query to support polygon filter')
else:
    print('Old block not found')
