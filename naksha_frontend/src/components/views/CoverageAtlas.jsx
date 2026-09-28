import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, AlertTriangle, ArrowRight } from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
}

export default function CoverageAtlas() {
  const [statesData, setStatesData] = useState([]);
  const [selectedState, setSelectedState] = useState(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/states`)
      .then(res => res.json())
      .then(data => {
        setStatesData(data);
        if (data.length > 0) setSelectedState(data[0]);
      })
      .catch(err => console.error("Failed to fetch states:", err));
  }, []);

  if (!statesData.length || !selectedState) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading states...</div>;
  }

  return (
    <div style={{ background: 'transparent', minHeight: 'calc(100vh - 64px)', padding: isMobile ? '24px 16px' : '40px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>India, at a glance</h2>
          <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>Explore land survey completeness and layer availability across states.</p>
        </div>

        {/* State Selection Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
          {statesData.map((state) => (
            <div 
              key={state.id}
              onClick={() => {
                setSelectedState(state);
                navigate('/explore', { state: { spatialSelection: { state: state } } });
              }}
              style={{
                background: '#fff', borderRadius: '12px', overflow: 'hidden', border: selectedState.id === state.id ? '2px solid #38bdf8' : '1px solid #e2e8f0',
                cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: '0.2s'
              }}
            >
              <div style={{ height: '120px', backgroundImage: `url(${state.image})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(15,23,42,0.8)', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '700' }}>
                  {state.coverage}% Mapped
                </div>
              </div>
              <div style={{ padding: '16px' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#0f172a' }}>{state.name}</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{state.districts} Districts</span>
              </div>
            </div>
          ))}
        </div>

        {/* Selected State Inspector Panel */}
        <div style={{ background: '#fff', padding: isMobile ? '20px' : '32px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '32px' }}>
          <div>
            <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '700', textTransform: 'uppercase' }}>Selected State Details</span>
            <h3 style={{ fontSize: '2.25rem', fontWeight: '800', color: '#0f172a', margin: '8px 0 16px 0' }}>{selectedState.name}</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Mapped Area</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>{selectedState.mappedArea} km²</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Pending Area</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#ef4444' }}>{selectedState.pendingArea} km²</div>
              </div>
            </div>

            <button 
              onClick={() => navigate('/explore', { state: { spatialSelection: { state: selectedState } } })}
              style={{ padding: '12px 20px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              Launch GIS Viewer for {selectedState.name} <ArrowRight size={16} />
            </button>
          </div>

          <div>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#0f172a' }}>Layer Availability Matrix</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <DatasetStatus label="Orthorectified Imagery (ORI)" status={selectedState.datasets.ORI} />
              <DatasetStatus label="Cadastral Parcel Boundaries" status={selectedState.datasets.parcels} />
              <DatasetStatus label="GNSS Control Network" status={selectedState.datasets.gnss} />
              <DatasetStatus label="Ground Truthing Validation" status={selectedState.datasets.groundTruth} />
              <DatasetStatus label="Building Footprint Vectorization" status={selectedState.datasets.buildings} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DatasetStatus({ label, status }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: '6px', fontSize: '14px' }}>
      <span style={{ color: '#334155', fontWeight: '500' }}>{label}</span>
      {status ? (
        <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', fontSize: '13px' }}><Check size={16} /> Available</span>
      ) : (
        <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', fontSize: '13px' }}><X size={16} /> Missing</span>
      )}
    </div>
  );
}