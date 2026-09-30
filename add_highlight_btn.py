import sys
content = open('naksha_frontend/src/components/views/ExploreMap.jsx', encoding='utf-8').read()

old_clear = """          <button
            type="button"
            onClick={
              onClearPolygon
            }
            style={{
              padding:
                '8px 10px',
              border:
                '1px solid #cbd5e1',
              borderRadius:
                '5px',
              background:
                '#ffffff',
              fontSize:
                '10px',
              cursor:
                'pointer',
            }}
          >
            Clear
          </button>
        </div>
      </div>"""

new_clear = """          <button
            type="button"
            onClick={onClearPolygon}
            style={{
              padding: '8px 10px',
              border: '1px solid #cbd5e1',
              borderRadius: '5px',
              background: '#ffffff',
              fontSize: '10px',
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        </div>
        
        {polygonPoints.length >= 3 && (
          <button
            type="button"
            onClick={onFindBuildings}
            style={{
              width: '100%',
              padding: '9px',
              marginTop: '10px',
              border: 'none',
              borderRadius: '6px',
              background: '#f59e0b',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            Highlight Buildings Inside Polygon
          </button>
        )}
      </div>"""

if old_clear in content:
    content = content.replace(old_clear, new_clear)
    open('naksha_frontend/src/components/views/ExploreMap.jsx', 'w', encoding='utf-8').write(content)
    print('Added Highlight button')
else:
    print('Clear button block not found')
