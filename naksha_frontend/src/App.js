import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom';

import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

import Hero from './components/views/Hero';
import CoverageAtlas from './components/views/CoverageAtlas';
import ExploreMap from './components/views/ExploreMap';
import SurveyCoverage from './components/views/SurveyCoverage';

import DashboardLayout from './components/layout/DashboardLayout';

import AdministrativeSelector from './components/mapping/AdministrativeSelector';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
}

/*
 * ============================================================
 * PUBLIC EXPLORE MAP
 *
 * Public users get:
 * LEFT   -> Spatial Mapping selector
 * CENTER -> Map
 * RIGHT  -> Integration Framework + Location Intelligence
 * ============================================================
 */
function PublicExplorePage({ isMobile }) {
  const location = useLocation();
  const [
    spatialSelection,
    setSpatialSelection,
  ] = useState(location.state?.spatialSelection || null);

  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        width: '100%',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        backgroundColor: '#f8fafc',
        position: 'relative'
      }}
    >
      {/* =====================================================
          LEFT: PUBLIC SPATIAL MAPPING PANEL
          ===================================================== */}
      {isMobile && (
        <button
          onClick={() => setShowMobileSidebar(!showMobileSidebar)}
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            zIndex: 40,
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            padding: '8px 12px',
            borderRadius: '6px',
            fontWeight: '600',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          {showMobileSidebar ? 'Hide Search' : 'Search Area'}
        </button>
      )}

      {(!isMobile || showMobileSidebar) && (
        <aside
          style={{
            width: isMobile ? '100%' : '320px',
            flexShrink: 0,
            height: isMobile ? '40%' : '100%',
            position: isMobile ? 'absolute' : 'relative',
            bottom: isMobile ? 0 : 'auto',
            overflowY: 'auto',
            boxSizing: 'border-box',
            backgroundColor: '#ffffff',
            borderRight: isMobile ? 'none' : '1px solid #e2e8f0',
            borderTop: isMobile ? '1px solid #e2e8f0' : 'none',
            padding: '24px',
            zIndex: 35,
            boxShadow: isMobile ? '0 -4px 12px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          <div
            style={{
              marginBottom: '18px',
            }}
          >
            <h2
              style={{
                margin: '0 0 6px 0',
                color: '#0f172a',
                fontSize: '1.25rem',
                fontWeight: '700',
              }}
            >
              Spatial Mapping
            </h2>

            <p
              style={{
                margin: 0,
                color: '#64748b',
                fontSize: '12px',
                lineHeight: 1.5,
              }}
            >
              Select an administrative area or enter
              coordinates to explore the map.
            </p>
          </div>

          <AdministrativeSelector
            compact={isMobile}
            initialSelection={spatialSelection}
            onSelectionChange={setSpatialSelection}
          />
        </aside>
      )}

      {/* =====================================================
          CENTER + RIGHT:
          SAME EXPLORE MAP COMPONENT USED BY OFFICER VIEW
          ===================================================== */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <ExploreMap
          isMobile={isMobile}
          initialSelection={spatialSelection}
          onSelectionChange={setSpatialSelection}
          showAdministrativeSelector={false}
          officerMode={true}
        />
      </div>
    </div>
  );
}

/*
 * ============================================================
 * PUBLIC SITE SHELL
 *
 * IMPORTANT:
 *
 * /explore:
 *   fixed viewport because it is an interactive full-screen map
 *
 * all other pages:
 *   normal document height and browser scrolling
 * ============================================================
 */
function PublicSite({ onLoginSuccess, isMobile }) {
  const location = useLocation();

  const isExplorePage =
    location.pathname === '/explore';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        fontFamily: 'Inter, Arial, sans-serif',

        ...(isExplorePage
          ? {
              height: '100vh',
              minHeight: 0,
              overflow: 'hidden',
            }
          : {
              minHeight: '100vh',
              overflowX: 'hidden',
            }),

        backgroundImage:
          'linear-gradient(rgba(248, 250, 252, 0.8), rgba(248, 250, 252, 0.95)), url("/image_0d63c6.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <Header
        isMobile={isMobile}
        onLoginSuccess={() =>
          onLoginSuccess()
        }
      />

      <main
        style={{
          width: '100%',

          ...(isExplorePage
            ? {
                flex: '1 1 auto',
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }
            : {
                flex: '1 0 auto',
                width: '100%',
              }),
        }}
      >
        <Routes>
          <Route
            path="/"
            element={<Hero />}
          />

          <Route
            path="/atlas"
            element={<CoverageAtlas />}
          />

          <Route
            path="/explore"
            element={<PublicExplorePage isMobile={isMobile} />}
          />

          <Route
            path="/survey"
            element={<SurveyCoverage />}
          />
        </Routes>
      </main>

      {!isExplorePage && <Footer />}
    </div>
  );
}

/*
 * ============================================================
 * MAIN APP
 * ============================================================
 */
function App() {
  const isMobile = useIsMobile();
  const [
    isLoggedIn,
    setIsLoggedIn,
  ] = useState(false);

  /*
   * ==========================================================
   * LOGGED-IN OFFICER EXPERIENCE
   * ==========================================================
   */
  if (isLoggedIn) {
    return (
      <DashboardLayout
        isMobile={isMobile}
        onLogout={() =>
          setIsLoggedIn(false)
        }
      />
    );
  }

  /*
   * ==========================================================
   * PUBLIC EXPERIENCE
   * ==========================================================
   */
  return (
    <Router>
      <PublicSite
        isMobile={isMobile}
        onLoginSuccess={() =>
          setIsLoggedIn(true)
        }
      />
    </Router>
  );
}

export default App;