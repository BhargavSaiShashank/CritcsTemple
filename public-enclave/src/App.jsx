import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import ReviewDetail from './pages/ReviewDetail'
import HallOfFame from './pages/HallOfFame'
import CeremonyOracle from './components/CeremonyOracle'

const App = () => {
  return (
    <HelmetProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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

