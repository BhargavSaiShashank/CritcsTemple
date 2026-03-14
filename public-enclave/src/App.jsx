import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import ReviewDetail from './pages/ReviewDetail'
import HallOfFame from './pages/HallOfFame'
import Compare from './pages/Compare'
import Predictions from './pages/Predictions'
import CeremonyOracle from './components/CeremonyOracle'
import SearchOverlay from './components/SearchOverlay'
import { CapacitorUpdater } from '@capgo/capacitor-updater'
import { API_URL } from './services/api'
import { FirebaseMessagingService } from './services/FirebaseMessaging.service'
import { AtmosphereProvider } from './context/AtmosphereContext'

const PrimalPulse = () => {
  const readySent = React.useRef(false);

  useEffect(() => {
    // Ping the backend immediately to wake it up from Render sleep phase
    console.log('[Primal Pulse] Waking up the Oracle...');
    fetch(`${API_URL}/health`).catch(() => { });

    // Capgo OTA Update Check - Guarded to prevent duplicate native calls
    if (Capacitor.isNativePlatform() && !readySent.current) {
      readySent.current = true;
      CapacitorUpdater.notifyAppReady();
    }
  }, []);
  return null;
};

const NativeListener = ({ onSearchOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleRoute = (url) => {
    if (!url) return;
    console.log('[NativeRoute] Processing URL:', url);
    
    let path = '';
    try {
      // Handle sanctuary:// scheme
      if (url.startsWith('sanctuary://')) {
        path = '/' + url.split('://')[1];
      } else {
        const urlObj = new URL(url);
        path = urlObj.pathname;
      }
    } catch (e) {
      console.warn('[NativeRoute] URL Parse Error:', e);
      path = url.split('.com')[1] || url.split('://')[1]?.split('/').slice(1).join('/') || '/';
    }

    console.log('[NativeRoute] Derived Path:', path);

    if (path === '/search') {
      onSearchOpen();
      // Stay on current page or home, but trigger overlay
      if (window.location.pathname === '/' || window.location.pathname === '/search') {
         navigate('/');
      }
    } else if (path && path !== '/') {
      const route = path.startsWith('/') ? path : `/${path}`;
      navigate(route);
    }
  };

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Handle initial launch URL (Cold start)
    // Adding a slight delay to ensure the Router and useLocation are fully ready
    const timer = setTimeout(() => {
      CapacitorApp.getLaunchUrl().then(data => {
        if (data && data.url) {
          console.log('[NativeRoute] Cold Start Launch URL:', data.url);
          handleRoute(data.url);
        } else {
          console.log('[NativeRoute] No cold start URL found');
        }
      });
    }, 500);

    // Back Button Handler
    const backListener = CapacitorApp.addListener('backButton', () => {
      if (location.pathname === '/') {
        CapacitorApp.exitApp();
      } else {
        navigate(-1);
      }
    });

    // Deep Linking Handler (Warm start)
    const urlListener = CapacitorApp.addListener('appUrlOpen', data => {
      console.log('[NativeRoute] Warm Start App URL:', data.url);
      handleRoute(data.url);
    });

    return () => {
      clearTimeout(timer);
      backListener.then(l => l.remove());
      urlListener.then(l => l.remove());
    };
  }, [navigate, onSearchOpen]);

  return null;
};

const App = () => {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      document.body.classList.add('is-native');
      // Initialize Firebase Messaging
      FirebaseMessagingService.init();
    }
  }, []);

  return (
    <HelmetProvider>
      <AtmosphereProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <NativeListener onSearchOpen={() => setIsSearchOpen(true)} />
          <PrimalPulse />
          <div className="min-h-screen bg-[#0c0c0c] text-white">
            <Navbar onSearchOpen={() => setIsSearchOpen(true)} />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/review/:slug" element={<ReviewDetail />} />
                <Route path="/hall-of-fame" element={<HallOfFame />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/predictions" element={<Predictions />} />
              </Routes>
            </main>
            <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
            <CeremonyOracle />
          </div>
        </Router>
      </AtmosphereProvider>
    </HelmetProvider>
  )
}

export default App

