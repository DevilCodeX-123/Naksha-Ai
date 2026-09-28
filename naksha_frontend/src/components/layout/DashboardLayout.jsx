import React, { useState, useEffect } from 'react';
import { User, Home, Map as MapIcon, LogOut } from 'lucide-react';
import ExploreMap from '../views/ExploreMap';


export default function DashboardLayout({ onLogout }) {
  const [activeTab, setActiveTab] = useState('home');
const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

const [
  spatialSelection,
  setSpatialSelection
] = useState(null);

  // Automatically collapse the sidebar ONLY when the Map is opened
  useEffect(() => {
    if (activeTab === 'map') {
      setIsSidebarCollapsed(true);
    } else {
      setIsSidebarCollapsed(false);
    }
  }, [activeTab]);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#f1f5f9', fontFamily: 'Inter, sans-serif' }}>
      
      {/* LEFT PANEL: Dynamic Navigation */}
      <div style={{ 
        width: isSidebarCollapsed ? '80px' : '260px', 
        backgroundColor: '#0f172a', 
        color: 'white', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'width 0.3s ease' // Smooth sliding animation
      }}>
        
        {/* User Profile / Expand Button */}
        <div 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          title="Toggle Navigation"
          style={{ padding: '24px 16px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', cursor: 'pointer' }}>
          <div style={{ padding: '10px', backgroundColor: '#3b82f6', borderRadius: '50%', flexShrink: 0 }}>
            <User size={24} color="white" />
          </div>
          {!isSidebarCollapsed && (
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Officer Sharma</h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Jaipur Nodal Officer</p>
            </div>
          )}
        </div>

        {/* Navigation Options */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            onClick={() => setActiveTab('home')}
            title="Dashboard Home"
            style={{ display: 'flex', alignItems: 'center', justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', gap: '12px', padding: '12px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'home' ? '#2563eb' : 'transparent', color: 'white', fontSize: '15px', transition: 'all 0.2s' }}>
            <Home size={20} style={{ flexShrink: 0 }} /> 
            {!isSidebarCollapsed && <span>Dashboard Home</span>}
          </button>
          <button 
            onClick={() => setActiveTab('map')}
            title="Spatial Planning Map"
            style={{ display: 'flex', alignItems: 'center', justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', gap: '12px', padding: '12px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'map' ? '#2563eb' : 'transparent', color: 'white', fontSize: '15px', transition: 'all 0.2s' }}>
            <MapIcon size={20} style={{ flexShrink: 0 }} /> 
            {!isSidebarCollapsed && <span>Spatial Planning Map</span>}
          </button>
        </nav>

        {/* Logout Button */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid #1e293b' }}>
          <button 
            onClick={onLogout}
            title="Secure Logout"
            style={{ display: 'flex', alignItems: 'center', justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', gap: '12px', width: '100%', padding: '12px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: '#ef4444', color: 'white', fontSize: '15px' }}>
            <LogOut size={20} style={{ flexShrink: 0 }} /> 
            {!isSidebarCollapsed && <span>Secure Logout</span>}
          </button>
        </div>
      </div>

      {/* RIGHT SIDE: Main Screen Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeTab === 'home' ? (
          <div style={{ padding: '40px', overflowY: 'auto' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>Nodal Officer Dashboard</h1>
            <p style={{ color: '#64748b', fontSize: '16px', marginBottom: '32px' }}>Welcome back. Review current survey progress and platform alerts.</p>
            
            {/* Quick Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ color: '#64748b', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Total Survey Completed</div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0284c7' }}>42.8%</div>
                <div style={{ color: '#10b981', fontSize: '13px', marginTop: '4px' }}>↑ +2.4% this month</div>
              </div>
              <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ color: '#64748b', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Active Districts</div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a' }}>336</div>
                <div style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>Across 28 states</div>
              </div>
              <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ color: '#64748b', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Pending Validation</div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#ef4444' }}>1,450</div>
                <div style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>Parcels awaiting approval</div>
              </div>
            </div>

            {/* Main Content Area */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
              
              {/* Notifications */}
              <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#0f172a', fontWeight: '700' }}>Recent Notifications</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                    <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>Jaipur Zone 4: Survey Completed</div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Drone survey successfully processed. 450 new parcels mapped.</div>
                  </div>
                  <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                    <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>Alert: Spatial Conflicts Detected</div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>12 overlaps found in recent uploads. Review required in Spatial Planning Map.</div>
                  </div>
                  <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                    <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>Platform Update</div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>New official layers for administrative boundaries are now live.</div>
                  </div>
                </div>
              </div>

              {/* User Help Manual */}
              <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', background: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                </div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#0f172a', fontWeight: '700' }}>User Help Manual</h3>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px', maxWidth: '250px' }}>New to the platform? Download the official guide to understand the mapping workflows and tools.</p>
                <a 
                  href="/dummy-manual.pdf" 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ background: '#0f172a', color: 'white', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none', fontWeight: '600', fontSize: '14px', transition: 'background 0.2s' }}
                >
                  Download Manual PDF
                </a>
              </div>

            </div>
          </div>
        ) : (
          <div style={{ height: '100%', width: '100%' }}>
            <ExploreMap
  initialSelection={spatialSelection}
  onSelectionChange={setSpatialSelection}
/>
          </div>
        )}
      </div>
    </div>
  );
}