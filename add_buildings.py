import sys

content = open('naksha_frontend/src/components/views/ExploreMap.jsx', encoding='utf-8').read()

insert_point = content.find('  /* ==========================================================')

new_func = """  async function findBuildingsInPolygon() {
    if (polygonPoints.length < 3) {
      alert('Please draw a complete polygon (at least 3 points) first.');
      return;
    }

    try {
      setMapStatus('loading');
      
      let polyString = '';
      polygonPoints.forEach(pt => {
        polyString += `${pt[1]} ${pt[0]} `;
      });
      polyString = polyString.trim();

      const query = `[out:json];
        (
          way["building"](poly:"${polyString}");
          relation["building"](poly:"${polyString}");
        );
        out geom;`;

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query
      });

      const data = await response.json();

      const features = [];
      data.elements.forEach(el => {
        if (el.geometry) {
          const coords = el.geometry.map(g => [g.lon, g.lat]);
          if (coords.length > 0) {
            features.push({
              type: 'Feature',
              properties: {
                id: el.id,
                ...el.tags
              },
              geometry: {
                type: coords[0][0] === coords[coords.length-1][0] && coords[0][1] === coords[coords.length-1][1] ? 'Polygon' : 'LineString',
                coordinates: coords[0][0] === coords[coords.length-1][0] && coords[0][1] === coords[coords.length-1][1] ? [coords] : coords
              }
            });
          }
        }
      });

      const geojsonData = {
        type: 'FeatureCollection',
        features
      };

      if (map.current.getSource('highlighted-buildings')) {
        map.current.getSource('highlighted-buildings').setData(geojsonData);
      } else {
        map.current.addSource('highlighted-buildings', {
          type: 'geojson',
          data: geojsonData
        });

        map.current.addLayer({
          id: 'highlighted-buildings-fill',
          type: 'fill',
          source: 'highlighted-buildings',
          paint: {
            'fill-color': '#f59e0b',
            'fill-opacity': 0.6
          }
        });
        
        map.current.addLayer({
          id: 'highlighted-buildings-line',
          type: 'line',
          source: 'highlighted-buildings',
          paint: {
            'line-color': '#b45309',
            'line-width': 2
          }
        });
      }
      
      setMapStatus('ready');
      alert(`Found and highlighted ${features.length} buildings in this polygon!`);

    } catch (err) {
      console.error(err);
      setMapStatus('ready');
      alert('Error fetching buildings from OSM. Please try again.');
    }
  }

"""

if insert_point != -1:
    content = content[:insert_point] + new_func + content[insert_point:]
    open('naksha_frontend/src/components/views/ExploreMap.jsx', 'w', encoding='utf-8').write(content)
    print('Added function')
else:
    print('Not found')
