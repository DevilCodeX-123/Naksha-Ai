import React from 'react';
import { Link } from 'react-router-dom';
import { Map, ShieldAlert } from 'lucide-react';
import { SITE_CONFIG } from '../../data/mockData';

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
}

export default function Footer() {
  const isMobile = useIsMobile();

  return (
    <footer style={{ background: '#090d16', color: '#94a3b8', padding: isMobile ? '32px 16px 24px' : '48px 32px 24px', borderTop: '1px solid #1e293b' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr 1fr', gap: '32px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', marginBottom: '12px' }}>
            <Map size={22} color="#38bdf8" />
            <span style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '0.5px' }}>{SITE_CONFIG.title}</span>
          </div>
          <p style={{ fontSize: '14px', lineHeight: '1.6', maxWidth: '320px' }}>{SITE_CONFIG.subtitle}</p>
        </div>

        <div>
          <h4 style={{ color: '#f8fafc', fontSize: '14px', marginBottom: '16px' }}>Platform Navigation</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
            <Link to="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>Home & Story</Link>
            <Link to="/atlas" style={{ color: '#94a3b8', textDecoration: 'none' }}>Coverage Atlas</Link>
            <Link to="/explore" style={{ color: '#38bdf8', textDecoration: 'none' }}>Explore Web-GIS</Link>
            <Link to="/survey" style={{ color: '#94a3b8', textDecoration: 'none' }}>Survey & Data Gaps</Link>
          </div>
        </div>

        <div>
          <h4 style={{ color: '#f8fafc', fontSize: '14px', marginBottom: '16px' }}>Methodology</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
            <span>Spatial Intelligence</span>
            <span>PostGIS Analysis</span>
            <span>Drone Survey Standards</span>
            <span>Zoning Compliance</span>
          </div>
        </div>

        <div>
          <h4 style={{ color: '#f8fafc', fontSize: '14px', marginBottom: '16px' }}>Notice</h4>
          <div style={{ background: '#0f172a', padding: '12px', borderRadius: '6px', border: '1px solid #1e293b', fontSize: '12px', lineHeight: '1.5' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', marginBottom: '4px', fontWeight: '600' }}>
              <ShieldAlert size={14} /> Prototype Platform
            </div>
            {SITE_CONFIG.prototypeMessage}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '32px auto 0', paddingTop: '24px', borderTop: '1px solid #1e293b', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '12px' : '0', justifyContent: 'space-between', fontSize: '12px' }}>
        <span> {new Date().getFullYear()} {SITE_CONFIG.title}. All rights reserved.</span>
        <span>Geospatial Data Transparency Prototype</span>
      </div>
    </footer>
  );
}