import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import ReviewDetail from './pages/ReviewDetail'
import HallOfFame from './pages/HallOfFame'
import Duel from './pages/Duel'
import CeremonyOracle from './components/CeremonyOracle'
import SearchOverlay from './components/SearchOverlay'
import { CapacitorUpdater } from '@capgo/capacitor-updater'
import { API_URL } from './services/api'

const PrimalPulse = () => {
  useEffect(() => {
    // Ping the backend immediately to wake it up from Render sleep phase
    console.log('[Primal Pulse] Waking up the Oracle...');
    fetch(`${API_URL}/health`).catch(() => { });

    // Capgo OTA Update Check
    if (Capacitor.isNativePlatform()) {
      CapacitorUpdater.notifyAppReady();
    }
  }, []);
  return null;
};

const NativeListener = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only register the back button listener on native platforms (Android/iOS)
    if (!Capacitor.isNativePlatform()) return;

    const backListener = CapacitorApp.addListener('backButton', () => {
      if (location.pathname === '/') {
        CapacitorApp.exitApp();
      } else {
        navigate(-1);
      }
    });

    return () => {
      backListener.then(l => l.remove());
    };
  }, [location.pathname, navigate]);

  return null;
};

const App = () => {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      document.body.classList.add('is-native');
    }
  }, []);

  return (
    <HelmetProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <NativeListener />
        <PrimalPulse />
        <div className="min-h-screen bg-[#0c0c0c] text-white">
          <Navbar onSearchOpen={() => setIsSearchOpen(true)} />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/review/:slug" element={<ReviewDetail />} />
              <Route path="/hall-of-fame" element={<HallOfFame />} />
              <Route path="/duel" element={<Duel />} />
              <Route path="/duel/:slug1" element={<Duel />} />
              <Route path="/duel/:slug1/:slug2" element={<Duel />} />
            </Routes>
          </main>
          <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
          <CeremonyOracle />
        </div>
      </Router>
    </HelmetProvider>
  )
}

export default App

