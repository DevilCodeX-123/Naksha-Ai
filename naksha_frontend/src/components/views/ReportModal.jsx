import React from 'react';
import { X, Map, Building, Road, FileText, MapPin } from 'lucide-react';

export default function ReportModal({ isOpen, onClose, reportData, polygonPoints }) {
  if (!isOpen || !reportData) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'
    }}>
      <div style={{
        background: 'white', borderRadius: '12px', width: '100%', maxWidth: '800px',
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, background: 'white', zIndex: 10
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a' }}>
              Preliminary Analysis Report
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
              Generated for selected Area of Interest (AOI)
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '8px',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'none'}>
            <X size={24} color="#64748b" />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Map size={16} /> AREA SIZE
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#0f172a' }}>
                {reportData.areaSqKm.toFixed(3)} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#64748b' }}>sq km</span>
              </div>
            </div>
            
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building size={16} /> TOTAL BUILDINGS
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#0f172a' }}>
                {reportData.totalBuildings}
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Road size={16} /> ROAD NETWORK
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#0f172a' }}>
                {(reportData.roadLengthKm).toFixed(2)} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#64748b' }}>km</span>
              </div>
            </div>
          </div>

          {/* Coordinate List */}
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
            Polygon Coordinates
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '32px' }}>
            {polygonPoints.map((pt, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: '#f1f5f9', borderRadius: '6px', fontSize: '0.875rem', fontFamily: 'monospace' }}>
                <MapPin size={14} color="#64748b" />
                <span>[{pt[1].toFixed(5)}, {pt[0].toFixed(5)}]</span>
              </div>
            ))}
          </div>

          {/* Building Breakdown */}
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
            Building Types Breakdown
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            {Object.entries(reportData.buildingTypes).sort((a,b) => b[1] - a[1]).map(([type, count]) => (
              <div key={type} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                <span style={{ textTransform: 'capitalize', fontWeight: '500', color: '#334155' }}>
                  {type}
                </span>
                <span style={{ fontWeight: 'bold', color: '#0f172a', background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px', fontSize: '0.875rem' }}>
                  {count}
                </span>
              </div>
            ))}
            {Object.keys(reportData.buildingTypes).length === 0 && (
              <div style={{ color: '#64748b', fontStyle: 'italic' }}>No buildings detected in this area.</div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '40px' }}>
            <button onClick={onClose} style={{
              padding: '10px 20px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white',
              color: '#334155', fontWeight: '600', cursor: 'pointer'
            }}>
              Close
            </button>
            <button style={{
              padding: '10px 20px', borderRadius: '6px', border: 'none', background: '#2563eb',
              color: 'white', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <FileText size={18} /> Download PDF
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
