import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Map as MapIcon } from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';

export default function SurveyCoverage() {
  const [activeState, setActiveState] = useState(null); // null = show flashcards, object = show map
  const [statesData, setStatesData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fallbackStates = [
      { id: 'ST01', name: 'Rajasthan', completeness: 85, activeLayers: 6, areaMapped: '1,20,400 sq km', totalParcels: '45,200', lGDCode: '08' },
      { id: 'ST02', name: 'Gujarat', completeness: 72, activeLayers: 5, areaMapped: '98,000 sq km', totalParcels: '32,100', lGDCode: '24' },
      { id: 'ST03', name: 'Maharashtra', completeness: 65, activeLayers: 4, areaMapped: '1,45,000 sq km', totalParcels: '56,800', lGDCode: '27' },
      { id: 'ST04', name: 'Karnataka', completeness: 40, activeLayers: 3, areaMapped: '60,000 sq km', totalParcels: '18,500', lGDCode: '29' }
    ];
    fetch(`${API_BASE}/api/v1/states`)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        if (data && data.length > 0) {
          setStatesData(data);
        } else {
          setStatesData(fallbackStates);
        }
      })
      .catch(err => {
        console.error("Failed to fetch states:", err);
        setStatesData(fallbackStates);
      });
  }, []);

  // 1. Grid of Flashcards View
  if (!activeState) {
    if (statesData.length === 0) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;

    return (
      <div style={{ background: 'transparent', minHeight: 'calc(100vh - 64px)', padding: '40px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>Area of Interest (AOI)</h2>
          <p style={{ color: '#64748b', fontSize: '1.1rem', margin: '0 0 40px 0' }}>Select a state to explore surveyed areas and identify missing spatial datasets.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {statesData.map((state) => (
              <div 
                key={state.id} 
                onClick={() => navigate('/explore', { state: { spatialSelection: { state: state } } })}
                style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 20px rgba(0,0,0,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)'; }}
              >
                <div style={{ height: '180px', backgroundImage: `url(${state.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                <div style={{ padding: '20px' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', color: '#0f172a' }}>{state.name}</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#64748b' }}>{state.districts} Districts</span>
                    <span style={{ background: '#f1f5f9', color: '#38bdf8', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>{state.coverage}% Covered</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 2. State Selected Map View
  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Left Panel: District Selection & Data Gaps */}
      <div style={{ width: '380px', background: '#fff', borderRight: '1px solid #e2e8f0', zIndex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Back Button & Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
          <button onClick={() => setActiveState(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', padding: 0, marginBottom: '16px' }}>
            <ArrowLeft size={16} /> Back to States
          </button>
          <h2 style={{ margin: 0, fontSize: '1.75rem', color: '#0f172a' }}>{activeState.name} AOI</h2>
        </div>

        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Select District</label>
          <select style={{ width: '100%', padding: '12px', marginTop: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', marginBottom: '24px' }}>
            <option>All Districts in {activeState.name}</option>
            <option>District 1</option>
            <option>District 2</option>
          </select>

          <h3 style={{ fontSize: '14px', color: '#334155', margin: '0 0 16px 0' }}>Uncovered Data / Gaps</h3>
          
          <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '16px', borderRadius: '8px', marginBottom: '12px' }}>
            <div style={{ fontWeight: '600', color: '#b45309', marginBottom: '4px' }}>Cadastral Overlays</div>
            <div style={{ fontSize: '13px', color: '#92400e' }}>Unavailable in 12 districts. Ground verification pending.</div>
          </div>
          
          <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', padding: '16px', borderRadius: '8px' }}>
            <div style={{ fontWeight: '600', color: '#b91c1c', marginBottom: '4px' }}>Digital Surface Models (DSM)</div>
            <div style={{ fontSize: '13px', color: '#991b1b' }}>Completely unavailable for urban planning workflows in this state.</div>
          </div>
        </div>
      </div>

      {/* Right Panel: State Map Placeholder */}
      <div style={{ flex: 1, background: '#e2e8f0', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <MapIcon size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Map view for {activeState.name}</h3>
          <p style={{ fontSize: '14px' }}>Web-GIS will render district polygons here.</p>
        </div>
      </div>
    </div>
  );
}