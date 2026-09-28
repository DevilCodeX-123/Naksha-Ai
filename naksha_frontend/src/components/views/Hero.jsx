import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, ChevronRight, Activity } from 'lucide-react';
import { SITE_CONFIG, DEMO_STATS } from '../../data/mockData';

// Reusable Drone Graphic Component
const DroneSVG = ({ width = 340, opacity = 1 }) => (
  <svg width={width} viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.7))', opacity: opacity }}>
    {/* Spinning Rotor Blur Effects */}
    <ellipse cx="80" cy="90" rx="55" ry="8" fill="#38bdf8" opacity="0.6" />
    <ellipse cx="320" cy="90" rx="55" ry="8" fill="#38bdf8" opacity="0.6" />
    <ellipse cx="130" cy="65" rx="45" ry="6" fill="#0284c7" opacity="0.5" />
    <ellipse cx="270" cy="65" rx="45" ry="6" fill="#0284c7" opacity="0.5" />

    {/* Drone Quad-Arms */}
    <path d="M90 100 L170 140 M310 100 L230 140" stroke="#64748b" strokeWidth="8" strokeLinecap="round" />
    <path d="M140 75 L180 120 M260 75 L220 120" stroke="#475569" strokeWidth="6" strokeLinecap="round" />

    {/* Motor Housings */}
    <rect x="70" y="92" width="20" height="24" rx="4" fill="#1e293b" stroke="#0284c7" strokeWidth="2" />
    <rect x="310" y="92" width="20" height="24" rx="4" fill="#1e293b" stroke="#0284c7" strokeWidth="2" />
    <rect x="122" y="68" width="16" height="18" rx="3" fill="#1e293b" stroke="#0284c7" strokeWidth="2" />
    <rect x="262" y="68" width="16" height="18" rx="3" fill="#1e293b" stroke="#0284c7" strokeWidth="2" />

    {/* Main Body Chassis */}
    <rect x="155" y="115" width="90" height="55" rx="12" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />
    <rect x="175" y="125" width="50" height="16" rx="4" fill="#38bdf8" opacity="0.85" />
    
    {/* Optical Sensor Gimbal */}
    <circle cx="200" cy="182" r="14" fill="#1e293b" stroke="#38bdf8" strokeWidth="3" />
    <circle cx="200" cy="182" r="7" fill="#38bdf8" />

    {/* Landing Legs */}
    <path d="M165 170 L150 205 M235 170 L250 205" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
    <path d="M135 205 L165 205 M235 205 L265 205" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />

    {/* Active Laser Scanning Cone */}
    <polygon points="200,192 120,295 280,295" fill="url(#laserGrad)" opacity="0.55" />
    <line x1="200" y1="192" x2="120" y2="295" stroke="#38bdf8" strokeWidth="2" opacity="0.9" />
    <line x1="200" y1="192" x2="280" y2="295" stroke="#38bdf8" strokeWidth="2" opacity="0.9" />
    
    <defs>
      <linearGradient id="laserGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.05" />
      </linearGradient>
    </defs>
  </svg>
);

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
}

export default function Hero() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <div style={{ 
      background: 'transparent', 
      minHeight: 'calc(100vh - 64px)', 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center',
      paddingTop: isMobile ? '20px' : '40px'
    }}>
      
      {/* --- FULL-WIDTH IMAGE BAND --- */}
      <div style={{
        backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.78), rgba(15, 23, 42, 0.88)), url("/Gemini_Generated_Image_ta5u6nta5u6nta5u.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        width: '100%',
        padding: isMobile ? '40px 0' : '70px 0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '30px' }}>
          
          {/* Left Column: Title & Text */}
          <div style={{ maxWidth: '650px', zIndex: 10, textAlign: isMobile ? 'center' : 'left' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '20px', fontSize: '13px', color: '#38bdf8', marginBottom: '24px', fontWeight: '600' }}>
              <Activity size={14} /> {SITE_CONFIG.prototypeBadge}
            </div>

            <h1 style={{ fontSize: isMobile ? '2.5rem' : '4rem', fontWeight: '800', lineHeight: '1.1', margin: '0 0 24px 0', letterSpacing: '-1px', color: '#ffffff' }}>
              {SITE_CONFIG.title}
            </h1>
            <p style={{ fontSize: isMobile ? '1.1rem' : '1.25rem', color: '#e2e8f0', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>
              {SITE_CONFIG.subtitle}. Experience transparent, highly interactive mapping of surveyed territories, pending data gaps, and automated spatial analytics.
            </p>
          </div>

          {/* Right Column: The Drone Fleet in Zig-Zag Layout */}
          {!isMobile && (
            <div style={{ flex: '1', minWidth: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '350px' }}>
              <div style={{ position: 'relative', width: '450px', height: '100%' }}>
                <div style={{ position: 'absolute', right: '10px', top: '15px', animation: 'droneFloat 4.2s ease-in-out infinite 1s' }}>
                  <DroneSVG width={130} opacity={0.4} />
                </div>
                <div style={{ position: 'absolute', left: '110px', top: '45px', animation: 'droneFloat 3.7s ease-in-out infinite 0.4s' }}>
                  <DroneSVG width={200} opacity={0.7} />
                </div>
                <div style={{ position: 'absolute', left: '0px', top: '120px', animation: 'droneFloat 4s ease-in-out infinite' }}>
                  <DroneSVG width={340} opacity={1} />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* --- BUTTONS & TICKER --- */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '20px 16px' : '40px 24px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '16px', marginBottom: isMobile ? '30px' : '60px' }}>
          <button onClick={() => navigate('/atlas')} style={{ padding: '16px 32px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(15,23,42,0.2)', width: isMobile ? '100%' : 'auto' }}>
            Explore Atlas <ChevronRight size={18} />
          </button>
          <button onClick={() => navigate('/explore')} style={{ padding: '16px 32px', background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '600', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', width: isMobile ? '100%' : 'auto' }}>
            Launch Web-GIS <Compass size={18} />
          </button>
          <a href="/dummy-manual.pdf" target="_blank" rel="noreferrer" style={{ textDecoration: 'none', padding: '16px 32px', background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '600', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', width: isMobile ? '100%' : 'auto', boxSizing: 'border-box' }}>
            User Help Manual 
          </a>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '24px', background: 'rgba(255, 255, 255, 0.85)', padding: isMobile ? '20px' : '32px', borderRadius: '16px', border: '1px solid #e2e8f0', backdropFilter: 'blur(10px)', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <div>
            <div style={{ color: '#64748b', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>Total Coverage</div>
            <div style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: '800', color: '#0284c7' }}>{DEMO_STATS.nationalCoverage}%</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>Active Districts</div>
            <div style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: '800', color: '#0f172a' }}>{DEMO_STATS.mappedDistricts}</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>Mapped Area</div>
            <div style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: '800', color: '#0f172a' }}>{DEMO_STATS.mappedAreaSqKm}</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>Drone Surveys</div>
            <div style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: '800', color: '#10b981' }}>{DEMO_STATS.activeSurveys}</div>
          </div>
        </div>

        {/* Notifications Section */}
        <div style={{ marginTop: '24px', background: 'rgba(255, 255, 255, 0.85)', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', backdropFilter: 'blur(10px)', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
             Recent Notifications & Alerts
          </h3>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <li><strong>Jaipur Zone 4:</strong> Drone survey completed. 450 new parcels mapped with 94% confidence.</li>
            <li><strong style={{ color: '#ef4444' }}>Alert:</strong> 12 spatial conflicts detected in residential buffer zones. Review required in GIS Map.</li>
            <li><strong>Platform Update:</strong> New official Naksha layers for Rajasthan administrative boundaries are now live.</li>
          </ul>
        </div>
      </div>
      
      {/* Vertical Hover Animation */}
      <style>{`
        @keyframes droneFloat {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-16px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
}