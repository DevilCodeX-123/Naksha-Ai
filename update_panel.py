import sys
content = open('naksha_frontend/src/components/views/ExploreMap.jsx', encoding='utf-8').read()

old_func_def = """function YourWorkPanel({
  savedLocations,
  savedPolygons,
  polygonDrawingMode,
  polygonPoints,
  polygonName,
  setPolygonName,
  onStartPolygon,
  onClearPolygon,
  onAddCoordinatePoint,
  onAddPlacePoint,
  onLoadPolygon,
}) {"""

new_func_def = """function YourWorkPanel({
  savedLocations,
  savedPolygons,
  polygonDrawingMode,
  polygonPoints,
  polygonName,
  setPolygonName,
  onStartPolygon,
  onClearPolygon,
  onAddCoordinatePoint,
  onAddPlacePoint,
  onLoadPolygon,
  onFindBuildings,
}) {"""

content = content.replace(old_func_def, new_func_def)

old_buttons = """        <button
          type="button"
          onClick={
            onClearPolygon
          }
          style={{
            width:
              '100%',
            padding:
              '9px',
            border:
              '1px solid #cbd5e1',
            borderRadius:
              '6px',
            background:
              '#ffffff',
            color:
              '#334155',
            fontSize:
              '12px',
            fontWeight:
              '600',
            cursor:
              'pointer',
          }}
        >
          Cancel Selection
        </button>
      </div>"""

new_buttons = """        <button
          type="button"
          onClick={onClearPolygon}
          style={{
            width: '100%',
            padding: '9px',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            background: '#ffffff',
            color: '#334155',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: '10px'
          }}
        >
          Cancel Selection
        </button>

        {polygonPoints.length >= 3 && (
          <button
            type="button"
            onClick={onFindBuildings}
            style={{
              width: '100%',
              padding: '9px',
              border: 'none',
              borderRadius: '6px',
              background: '#f59e0b',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            Highlight Buildings Inside
          </button>
        )}
      </div>"""

if old_buttons in content:
    content = content.replace(old_buttons, new_buttons)
    open('naksha_frontend/src/components/views/ExploreMap.jsx', 'w', encoding='utf-8').write(content)
    print('Updated YourWorkPanel buttons')
else:
    print('Buttons not found')
