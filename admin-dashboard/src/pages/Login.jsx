import { useState, useEffect } from 'react'
import { auth, googleProvider } from '../services/firebase'
import { signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, GoogleAuthProvider, signInWithCredential } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { FirebaseAuthentication } from '@capacitor-firebase/authentication'
import { LogIn, Sparkles, ShieldCheck, Loader2, Clapperboard } from 'lucide-react'
import { motion } from 'framer-motion'

const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        console.log("[Login] Initializing Auth Effect...");
        
        // 1. Handle the redirect result when coming back from Google
        getRedirectResult(auth).then((result) => {
            console.log("[Login] getRedirectResult check:", result ? "USER_FOUND" : "NO_RESULT_YET");
            if (result) {
                console.log("[Login] Logged in via redirect:", result.user.email);
                window.location.href = '/dashboard'; // Forceful reload-based redirect
            }
        }).catch((err) => {
            console.error("[Login] Redirect Result Error:", err);
            setError('Google verification failed. Access denied.');
        });

        // 2. Also listen for auth state changes generally
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            console.log("[Login] onAuthStateChanged trigger:", user ? user.email : "NULL");
            if (user) {
                console.log("[Login] Auth detected, redirecting...");
                window.location.href = '/dashboard';
            }
        });

        return () => {
            console.log("[Login] Cleaning up Auth Effect...");
            unsubscribe();
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            await signInWithEmailAndPassword(auth, email, password)
            navigate('/dashboard')
        } catch (err) {
            console.error("Firebase Auth Error:", err.code, err.message)
            // Show specifically what's failing for email/pass
            if (err.code === 'auth/user-not-found') setError('No master found with this identifier.')
            else if (err.code === 'auth/wrong-password') setError('Invalid cipher key.')
            else setError(`Access Denied: ${err.message}`)
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
        setLoading(true)
        setError('')
        try {
            if (Capacitor.isNativePlatform()) {
                try {
                    const nativeResult = await FirebaseAuthentication.signInWithGoogle();
                    if (nativeResult?.credential?.idToken) {
                        const credential = GoogleAuthProvider.credential(nativeResult.credential.idToken)
                        await signInWithCredential(auth, credential)
                        navigate('/dashboard')
                        return
                    }
                } catch (nativeErr) {
                    console.error("NATIVE AUTH ERROR:", nativeErr)
                    throw nativeErr
                }
            }
            
            await signInWithPopup(auth, googleProvider)
            navigate('/dashboard')
        } catch (err) {
            console.error("Google Auth Error:", err.code, err.message)
            if (err.code === 'auth/operation-not-allowed') {
                setError('Google Sign-In is not enabled in Firebase Console.')
            } else if (err.code === 'auth/unauthorized-domain') {
                setError('Domain unauthorized. Add localhost:3000 to Firebase.')
            } else {
                setError(`Neural Link Failed: ${err.code}`)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#020202] text-[#f0f0f0] font-premium relative overflow-hidden">
            {/* Ambient Atmosphere */}
            <div className="fixed inset-0 spotlight opacity-40 pointer-events-none" />
            <div className="fixed top-[-20%] left-[-10%] w-[70%] h-[70%] bg-amber-500/[0.03] blur-[150px] rounded-full" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, rotateY: 30 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                className="w-full max-w-lg relative z-10 p-4"
            >
                <div className="glass-obsidian p-16 rounded-[60px] space-y-12 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />

                    <header className="text-center space-y-6">
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="w-24 h-24 bg-gradient-to-br from-amber-500 to-amber-700 rounded-3xl mx-auto flex items-center justify-center shadow-[0_20px_50px_rgba(245,158,11,0.3)] animate-gold-pulse"
                        >
                            <Clapperboard className="text-black" size={40} />
                        </motion.div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-center gap-3 text-amber-500/80 tracking-[0.6em] text-[10px] font-black uppercase">
                                <Sparkles size={12} className="animate-spin-slow" />
                                Master Sanctorum
                            </div>
                            <h1 className="text-5xl font-black tracking-tighter text-white italic">THE TEMPLE</h1>
                        </div>
                    </header>

                    <form onSubmit={handleLogin} className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 px-2">Identifier</label>
                            <div className="relative group/input">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-8 py-6 bg-white/[0.01] border border-white/5 rounded-3xl focus:border-amber-500/30 focus:ring-0 transition-all outline-none placeholder:text-white/5 font-medium text-lg"
                                    placeholder="Enter Sanctuary Email"
                                    required
                                />
                                <div className="absolute inset-0 rounded-3xl border border-amber-500/0 group-focus-within/input:border-amber-500/20 pointer-events-none transition-all duration-700" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 px-2">Cipher Key</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-8 py-6 bg-white/[0.01] border border-white/5 rounded-3xl focus:border-amber-500/30 focus:ring-0 transition-all outline-none placeholder:text-white/5 font-medium text-lg tracking-[0.3em]"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-amber-500 text-[10px] font-black uppercase tracking-[0.4em] text-center bg-amber-500/5 py-4 rounded-2xl border border-amber-500/10"
                            >
                                {error}
                            </motion.p>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98, y: 0 }}
                            type="submit"
                            disabled={loading}
                            className="w-full py-8 bg-gradient-to-r from-amber-500 to-amber-700 text-black font-black text-xs uppercase tracking-[0.5em] rounded-3xl shadow-[0_20px_50px_rgba(245,158,11,0.2)] hover:shadow-[0_20px_80px_rgba(245,158,11,0.4)] transition-all flex items-center justify-center gap-4 group"
                        >
                            {loading ? <Loader2 className="animate-spin" size={24} /> : (
                                <>
                                    <ShieldCheck size={20} className="group-hover:scale-125 transition-transform" />
                                    BEGIN TRANSFORMATION
                                </>
                            )}
                        </motion.button>

                        <div className="relative flex items-center justify-center">
                            <div className="absolute w-full h-[1px] bg-white/5" />
                            <span className="relative px-4 bg-[#0c0c0c] text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">or use neural link</span>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98, y: 0 }}
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full py-6 bg-white/[0.02] border border-white/5 text-white/60 font-black text-[10px] uppercase tracking-[0.4em] rounded-3xl hover:bg-white/[0.05] hover:border-white/10 transition-all flex items-center justify-center gap-4 group"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                                />
                            </svg>
                            SIGN IN WITH GOOGLE
                        </motion.button>
                    </form>

                    <footer className="text-center pt-8">
                        <p className="text-[9px] font-black text-white/5 uppercase tracking-[0.4em]">Authorized Access Protocols Engaged &bull; Void Encryption</p>
                    </footer>
                </div>
            </motion.div>
        </div>
    )
}

export default Login
