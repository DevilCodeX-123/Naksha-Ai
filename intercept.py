import sys
content = open('naksha_frontend/src/components/views/ExploreMap.jsx', encoding='utf-8').read()

old_fetch = """    const endpoint =
      config.endpointType ===
      'imagery'
        ? '/imagery'
        : `/layers/data/${config.table}`;

    const response =
      await axios.get(
        `${API_BASE}${endpoint}`,
        {
          timeout:
            30000,
        }
      );

    const data =
      response.data;"""

new_fetch = """    // OVERPASS API INTERCEPTION FOR LIVE DATA
    let data = { type: 'FeatureCollection', features: [] };
    
    if (layerId === 'building_footprints' || layerId === 'road_network') {
      const bounds = map.current.getBounds();
      const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
      
      let overpassQuery = '';
      if (layerId === 'building_footprints') {
        overpassQuery = `[out:json];(way["building"](${bbox});relation["building"](${bbox}););out geom;`;
      } else if (layerId === 'road_network') {
        overpassQuery = `[out:json];(way["highway"](${bbox}););out geom;`;
      }
      
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: overpassQuery
      });
      
      const overpassData = await response.json();
      
      overpassData.elements.forEach(el => {
        if (el.geometry) {
          const coords = el.geometry.map(g => [g.lon, g.lat]);
          if (coords.length > 0) {
            data.features.push({
              type: 'Feature',
              properties: { id: el.id, ...el.tags },
              geometry: {
                type: (coords[0][0] === coords[coords.length-1][0] && coords[0][1] === coords[coords.length-1][1]) ? 'Polygon' : 'LineString',
                coordinates: (coords[0][0] === coords[coords.length-1][0] && coords[0][1] === coords[coords.length-1][1]) ? [coords] : coords
              }
            });
          }
        }
      });
    } else {
      const endpoint = config.endpointType === 'imagery' ? '/imagery' : `/layers/data/${config.table}`;
      const response = await axios.get(`${API_BASE}${endpoint}`, { timeout: 30000 });
      data = response.data;
    }"""

if old_fetch in content:
    content = content.replace(old_fetch, new_fetch)
    open('naksha_frontend/src/components/views/ExploreMap.jsx', 'w', encoding='utf-8').write(content)
    print('Intercepted fetchLayerData for live OSM data')
else:
    print('Block not found')
