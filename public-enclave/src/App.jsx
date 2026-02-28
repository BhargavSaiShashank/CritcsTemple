import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import ReviewDetail from './pages/ReviewDetail'
import HallOfFame from './pages/HallOfFame'
import CeremonyOracle from './components/CeremonyOracle'

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
  return (
    <HelmetProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <NativeListener />
        <div className="min-h-screen bg-[#0c0c0c] text-white">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/review/:slug" element={<ReviewDetail />} />
              <Route path="/hall-of-fame" element={<HallOfFame />} />
            </Routes>
          </main>
          <CeremonyOracle />
        </div>
      </Router>
    </HelmetProvider>
  )
}

export default App

