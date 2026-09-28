import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Map, Bell, HelpCircle, User, Globe, Moon } from 'lucide-react';
import { SITE_CONFIG } from '../../data/mockData';
import LoginModal from '../modals/LoginModal';
import NotificationsModal from '../modals/NotificationsModal';
import HelpModal from '../modals/HelpModal';

// ADDED: { onLoginSuccess } as a prop
export default function Header({ onLoginSuccess, isMobile }) {
  const location = useLocation();
  const [showLogin, setShowLogin] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header style={{ 
      background: '#0f172a', 
      color: '#fff', 
      display: 'flex', 
      flexDirection: 'column',
      position: 'sticky', 
      top: 0, 
      zIndex: 1000 
    }}>
      <div style={{
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        justifyContent: 'space-between',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Map size={24} color="#38bdf8" />
          <div>
            <h1 style={{ margin: 0, fontSize: isMobile ? '16px' : '18px', fontWeight: '700', letterSpacing: '1px' }}>{SITE_CONFIG.title}</h1>
            {!isMobile && <span style={{ fontSize: '11px', color: '#94a3b8' }}>Geospatial Transparency Platform</span>}
          </div>
        </div>
        
        {isMobile ? (
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div onClick={() => setShowLogin(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <User size={18} />
            </div>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', padding: 0 }}
            >
              ☰
            </button>
          </div>
        ) : (
          <>
            <nav style={{ display: 'flex', gap: '32px' }}>
              <Link to="/" style={{ color: location.pathname === '/' ? '#38bdf8' : '#e2e8f0', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>Home</Link>
              <Link to="/atlas" style={{ color: location.pathname === '/atlas' ? '#38bdf8' : '#e2e8f0', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>Coverage Atlas</Link>
              <Link to="/explore" style={{ color: location.pathname === '/explore' ? '#38bdf8' : '#e2e8f0', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>Explore Map</Link>
              <Link to="/survey" style={{ color: location.pathname === '/survey' ? '#38bdf8' : '#e2e8f0', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>Survey & Data</Link>
            </nav>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <Globe size={18} style={{ cursor: 'pointer', color: '#94a3b8' }} title="Switch Language" />
              <Moon size={18} style={{ cursor: 'pointer', color: '#94a3b8' }} title="Toggle Theme" />
              <Bell size={18} onClick={() => { setShowNotifs(!showNotifs); setShowHelp(false); }} style={{ cursor: 'pointer', color: showNotifs ? '#38bdf8' : '#94a3b8' }} />
              <HelpCircle size={18} onClick={() => { setShowHelp(!showHelp); setShowNotifs(false); }} style={{ cursor: 'pointer', color: showHelp ? '#38bdf8' : '#94a3b8' }} />
              <div onClick={() => setShowLogin(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px', paddingLeft: '16px', borderLeft: '1px solid #334155', cursor: 'pointer' }}>
                <User size={18} />
                <span style={{ fontSize: '13px' }}>Login</span>
              </div>
            </div>
          </>
        )}
      </div>

      {isMobile && mobileMenuOpen && (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          background: '#1e293b', 
          padding: '16px 24px', 
          gap: '16px',
          borderTop: '1px solid #334155'
        }}>
          <Link to="/" style={{ color: location.pathname === '/' ? '#38bdf8' : '#e2e8f0', textDecoration: 'none', fontSize: '16px', fontWeight: '500' }}>Home</Link>
          <Link to="/atlas" style={{ color: location.pathname === '/atlas' ? '#38bdf8' : '#e2e8f0', textDecoration: 'none', fontSize: '16px', fontWeight: '500' }}>Coverage Atlas</Link>
          <Link to="/explore" style={{ color: location.pathname === '/explore' ? '#38bdf8' : '#e2e8f0', textDecoration: 'none', fontSize: '16px', fontWeight: '600' }}>Explore Map</Link>
          <Link to="/survey" style={{ color: location.pathname === '/survey' ? '#38bdf8' : '#e2e8f0', textDecoration: 'none', fontSize: '16px', fontWeight: '500' }}>Survey & Data</Link>
        </div>
      )}

      {/* ADDED: Passed onLoginSuccess down to the Modal */}
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} onLoginSuccess={onLoginSuccess} />
      <NotificationsModal isOpen={showNotifs} onClose={() => setShowNotifs(false)} />
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </header>
  );
}