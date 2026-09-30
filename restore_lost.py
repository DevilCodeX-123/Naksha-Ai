import sys
import re

content = open('naksha_frontend/src/components/views/ExploreMap.jsx', encoding='utf-8').read()

# 1. Update satellite base layer to Google Maps
old_satellite = """            {
              id:
                'base-satellite',
              type:
                'raster',
              source:
                'satellite-tiles',
              layout:
                {
                  visibility:
                    'none',
                },
            },"""
new_satellite = """            {
              id: 'base-satellite',
              type: 'raster',
              source: 'google-satellite',
              layout: {
                visibility: 'visible',
              },
            },"""
content = content.replace(old_satellite, new_satellite)

# Also need to hide base-osm by default
old_osm = """            {
              id:
                'base-osm',
              type:
                'raster',
              source:
                'osm-tiles',
              layout:
                {
                  visibility:
                    'visible',
                },
            },"""
new_osm = """            {
              id: 'base-osm',
              type: 'raster',
              source: 'osm-tiles',
              layout: {
                visibility: 'none',
              },
            },"""
content = content.replace(old_osm, new_osm)

# And add the source
old_sources = """          sources: {
            'osm-tiles':
              {
                type:
                  'raster',
                tiles:
                  [
                    'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
                  ],
                tileSize: 256,
                attribution:
                  'OpenStreetMap contributors',
              },
            'satellite-tiles':
              {
                type:
                  'raster',
                tiles:
                  [
                    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                  ],
                tileSize: 256,
                attribution:
                  'Tiles Esri',
              },
          },"""
new_sources = """          sources: {
            'osm-tiles': {
              type: 'raster',
              tiles: [
                'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
              ],
              tileSize: 256,
              attribution: 'OpenStreetMap contributors',
            },
            'google-satellite': {
              type: 'raster',
              tiles: [
                `https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
              ],
              tileSize: 256,
              attribution: 'Google Maps Hybrid | MapLibre',
            },
          },"""
content = content.replace(old_sources, new_sources)

# 2. Update styling for red polygon points
old_point_paint = """          paint: {
            'circle-color':
              '#ffffff',
            'circle-radius': 5,
            'circle-stroke-width': 2,
            'circle-stroke-color':
              '#3b82f6',
          },"""
new_point_paint = """          paint: {
            'circle-color': '#ef4444',
            'circle-radius': 7,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          },"""
content = content.replace(old_point_paint, new_point_paint)

old_line_paint = """          paint: {
            'line-color':
              '#3b82f6',
            'line-width': 2,
            'line-dasharray': [
              2, 2,
            ],
          },"""
new_line_paint = """          paint: {
            'line-color': '#ef4444',
            'line-width': 3,
            'line-dasharray': [2, 2],
          },"""
content = content.replace(old_line_paint, new_line_paint)

old_fill_paint = """          paint: {
            'fill-color':
              '#3b82f6',
            'fill-opacity': 0.2,
          },"""
new_fill_paint = """          paint: {
            'fill-color': '#ef4444',
            'fill-opacity': 0.25,
          },"""
content = content.replace(old_fill_paint, new_fill_paint)

# 3. Intercept fetchLayerData for live OSM data inside polygon
old_fetchLayer = """      const response =
        await axios.get(
          `${API_BASE}/api/v1/layers/${layerId}/data`,
          {
            params: {
              bbox: Array.from(
                bounds
              ).join(','),
            },
          }
        );"""
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
content = content.replace(old_fetchLayer, new_fetchLayer)

open('naksha_frontend/src/components/views/ExploreMap.jsx', 'w', encoding='utf-8').write(content)
print('Restored API key, red styling, and layer interception!')
