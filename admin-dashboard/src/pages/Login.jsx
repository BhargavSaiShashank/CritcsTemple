import { useState } from 'react'
import { auth } from '../services/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { LogIn, Sparkles, ShieldCheck, Loader2, Clapperboard } from 'lucide-react'
import { motion } from 'framer-motion'

const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            await signInWithEmailAndPassword(auth, email, password)
            navigate('/dashboard')
        } catch (err) {
            console.error("Firebase Auth Error:", err.code, err.message)
            setError('Identity check failed. Sanctuary remains sealed.')
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
