import sys

content = open('naksha_frontend/src/components/views/ExploreMap.jsx', encoding='utf-8').read()

old_filter_poly = "filter: ['==', '$type', 'Polygon'],"
new_filter_poly = "filter: ['==', ['geometry-type'], 'Polygon'],"

old_filter_line = "filter: ['==', '$type', 'LineString'],"
new_filter_line = "filter: ['==', ['geometry-type'], 'LineString'],"

old_filter_point = "filter: ['==', '$type', 'Point'],"
new_filter_point = "filter: ['==', ['geometry-type'], 'Point'],"

if old_filter_poly in content:
    content = content.replace(old_filter_poly, new_filter_poly)
    content = content.replace(old_filter_line, new_filter_line)
    content = content.replace(old_filter_point, new_filter_point)
    open('naksha_frontend/src/components/views/ExploreMap.jsx', 'w', encoding='utf-8').write(content)
    print('Fixed filters')
else:
    print('Filters not found')
