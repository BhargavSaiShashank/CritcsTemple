import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Intelligence from './pages/Intelligence'
import EditReview from './pages/EditReview'
import HallOfFame from './pages/HallOfFame'
import UpcomingMovies from './pages/UpcomingMovies'
import TheSanctorum from './pages/TheSanctorum'
import OscarRankings from './pages/OscarRankings'
import Analytics from './pages/Analytics'
import PrivateRoute from './components/PrivateRoute'
import { auth } from './services/firebase'
import { API_BASE_URL } from './services/api'

const PrimalPulse = () => {
    useEffect(() => {
        // Ping the backend immediately to wake it up from Render sleep phase
        console.log('[Primal Pulse] Waking up the Oracle from the Admin Sanctum...');
        const wakeupUrl = API_BASE_URL.replace('/api/v1', '/health');
        fetch(wakeupUrl).catch(() => { });
    }, []);
    return null;
};

const App = () => {
    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            document.body.classList.add('is-native')
        }
    }, [])

    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <PrimalPulse />
            <div className="min-h-screen bg-[#0c0c0c] text-white">
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route
                        path="/dashboard"
                        element={
                            <PrivateRoute>
                                <Dashboard />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/intelligence"
                        element={
                            <PrivateRoute>
                                <Intelligence />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/edit/:id"
                        element={
                            <PrivateRoute>
                                <EditReview />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/hall-of-fame"
                        element={
                            <PrivateRoute>
                                <HallOfFame />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/upcoming-movies"
                        element={
                            <PrivateRoute>
                                <UpcomingMovies />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/sanctorum"
                        element={
                            <PrivateRoute>
                                <TheSanctorum />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/oscar-rankings"
                        element={
                            <PrivateRoute>
                                <OscarRankings />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/analytics"
                        element={
                            <PrivateRoute>
                                <Analytics />
                            </PrivateRoute>
                        }
                    />
                    <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
            </div>
        </Router>
    )
}

export default App

