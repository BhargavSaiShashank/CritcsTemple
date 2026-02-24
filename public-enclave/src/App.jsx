import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import PublicHeader from './components/PublicHeader'
import Home from './pages/Home'
import ReviewDetail from './pages/ReviewDetail'
import HallOfFame from './pages/HallOfFame'

const App = () => {
  return (
    <HelmetProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen bg-[#0c0c0c] text-white">
          <PublicHeader />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/review/:slug" element={<ReviewDetail />} />
              <Route path="/hall-of-fame" element={<HallOfFame />} />
            </Routes>
          </main>
        </div>
      </Router>
    </HelmetProvider>
  )
}

export default App
