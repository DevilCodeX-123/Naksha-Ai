import sys
content = open('naksha_frontend/src/components/views/ExploreMap.jsx', encoding='utf-8').read()

old_update = """    const updateAOI = () => {
      if (!map.current || !map.current.isStyleLoaded()) return;

      if (polygonPoints.length === 0) {
        if (map.current.getLayer(AOI_FILL_LAYER_ID)) map.current.removeLayer(AOI_FILL_LAYER_ID);
        if (map.current.getLayer(AOI_LINE_LAYER_ID)) map.current.removeLayer(AOI_LINE_LAYER_ID);
        if (map.current.getLayer(AOI_POINTS_LAYER_ID)) map.current.removeLayer(AOI_POINTS_LAYER_ID);
        if (map.current.getSource(AOI_SOURCE_ID)) map.current.removeSource(AOI_SOURCE_ID);
        return;
      }

      const features = [];
      polygonPoints.forEach(point => {
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: point },
          properties: {},
        });
      });

      if (polygonPoints.length >= 2) {
        const lineCoordinates = [...polygonPoints];
        if (polygonPoints.length >= 3) {
          lineCoordinates.push(polygonPoints[0]);
        }
        features.push({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: lineCoordinates },
          properties: {},
        });
      }

      if (polygonPoints.length >= 3) {
        features.push({
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [[...polygonPoints, polygonPoints[0]]] },
          properties: {},
        });
      }

      const data = { type: 'FeatureCollection', features };
      const source = map.current.getSource(AOI_SOURCE_ID);

      if (source) {
        source.setData(data);
      } else {
        map.current.addSource(AOI_SOURCE_ID, { type: 'geojson', data });
        map.current.addLayer({
          id: AOI_FILL_LAYER_ID,
          type: 'fill',
          source: AOI_SOURCE_ID,
          filter: ['==', '$type', 'Polygon'],
          paint: { 'fill-color': '#2563eb', 'fill-opacity': 0.15 },
        });
        map.current.addLayer({
          id: AOI_LINE_LAYER_ID,
          type: 'line',
          source: AOI_SOURCE_ID,
          filter: ['==', '$type', 'LineString'],
          paint: { 'line-color': '#2563eb', 'line-width': 2, 'line-dasharray': [2, 2] },
        });
        map.current.addLayer({
          id: AOI_POINTS_LAYER_ID,
          type: 'circle',
          source: AOI_SOURCE_ID,
          filter: ['==', '$type', 'Point'],
          paint: { 'circle-radius': 5, 'circle-color': '#ffffff', 'circle-stroke-width': 2, 'circle-stroke-color': '#2563eb' },
        });
      }
    };"""

new_update = """    const updateAOI = () => {
      if (!map.current || !map.current.isStyleLoaded()) return;

      if (polygonPoints.length === 0) {
        if (map.current.getLayer(AOI_FILL_LAYER_ID)) map.current.removeLayer(AOI_FILL_LAYER_ID);
        if (map.current.getLayer(AOI_LINE_LAYER_ID)) map.current.removeLayer(AOI_LINE_LAYER_ID);
        if (map.current.getLayer(AOI_POINTS_LAYER_ID)) map.current.removeLayer(AOI_POINTS_LAYER_ID);
        if (map.current.getSource(AOI_SOURCE_ID)) map.current.removeSource(AOI_SOURCE_ID);
        return;
      }

      const features = [];
      polygonPoints.forEach(point => {
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: point },
          properties: {},
        });
      });

      if (polygonPoints.length >= 2) {
        const lineCoordinates = [...polygonPoints];
        if (polygonPoints.length >= 3) {
          lineCoordinates.push(polygonPoints[0]);
        }
        features.push({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: lineCoordinates },
          properties: {},
        });
      }

      if (polygonPoints.length >= 3) {
        features.push({
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [[...polygonPoints, polygonPoints[0]]] },
          properties: {},
        });
      }

      const data = { type: 'FeatureCollection', features };
      const source = map.current.getSource(AOI_SOURCE_ID);

      if (source) {
        source.setData(data);
      } else {
        map.current.addSource(AOI_SOURCE_ID, { type: 'geojson', data });
        map.current.addLayer({
          id: AOI_FILL_LAYER_ID,
          type: 'fill',
          source: AOI_SOURCE_ID,
          filter: ['==', '$type', 'Polygon'],
          paint: { 'fill-color': '#ef4444', 'fill-opacity': 0.25 },
        });
        map.current.addLayer({
          id: AOI_LINE_LAYER_ID,
          type: 'line',
          source: AOI_SOURCE_ID,
          filter: ['==', '$type', 'LineString'],
          paint: { 'line-color': '#ef4444', 'line-width': 3, 'line-dasharray': [2, 2] },
        });
        map.current.addLayer({
          id: AOI_POINTS_LAYER_ID,
          type: 'circle',
          source: AOI_SOURCE_ID,
          filter: ['==', '$type', 'Point'],
          paint: { 'circle-radius': 7, 'circle-color': '#ef4444', 'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff' },
        });
      }
    };"""

if old_update in content:
    content = content.replace(old_update, new_update)
    open('naksha_frontend/src/components/views/ExploreMap.jsx', 'w', encoding='utf-8').write(content)
    print('Updated AOI styling to RED')
else:
    print('updateAOI not found')
