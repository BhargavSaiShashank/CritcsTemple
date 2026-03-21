import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Palette, Image as ImageIcon, HardDrive, Info, Smartphone, Eye, Layout, ChevronRight, Moon, Trash2 } from 'lucide-react';
import { useSettings, AVAILABLE_THEMES } from '../context/SettingsContext';
import { App as CapacitorApp } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export default function Settings() {
    const {
        theme, setTheme,
        posterQuality, setPosterQuality,
        dataSaver, setDataSaver,
        amoledBlack, setAmoledBlack,
        defaultTab, setDefaultTab,
        clearAppCache
    } = useSettings();

    const [appInfo, setAppInfo] = useState({ version: '1.0.0', build: '1' });

    useEffect(() => {
        const fetchInfo = async () => {
            if (Capacitor.isNativePlatform()) {
                try {
                    const info = await CapacitorApp.getInfo();
                    setAppInfo({ version: info.version, build: info.build });
                } catch(e) {}
            }
        };
        fetchInfo();
    }, []);

    const triggerHaptic = () => {
        if(Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light }).catch(()=>{});
    };

    const handleClearCache = async () => {
        triggerHaptic();
        const success = await clearAppCache();
        if(success) alert("Cache cleared successfully! Freed up space.");
    };

    const Section = ({ title, icon: Icon, children }) => (
        <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--theme-primary)' }}>
                <Icon size={18} />
                <h2 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>{title}</h2>
            </div>
            <div style={{ background: 'var(--surface)', borderRadius: '16px', padding: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                {children}
            </div>
        </div>
    );

    const Toggle = ({ label, description, checked, onChange }) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--border2)' }}>
            <div style={{ paddingRight: '16px' }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>{label}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '4px', lineHeight: 1.4 }}>{description}</div>
            </div>
            <div onClick={() => { triggerHaptic(); onChange(!checked); }} style={{
                flexShrink: 0, width: '44px', height: '24px', background: checked ? 'var(--theme-primary)' : 'var(--surface2)',
                borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s'
            }}>
                <motion.div animate={{ x: checked ? 22 : 2 }} style={{
                    width: '20px', height: '20px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
            </div>
        </div>
    );

    const Select = ({ label, description, value, options, onChange }) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--border2)' }}>
            <div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>{label}</div>
                {description && <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '4px' }}>{description}</div>}
            </div>
            <select
                value={value}
                onChange={(e) => { triggerHaptic(); onChange(e.target.value); }}
                style={{
                    background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)',
                    padding: '8px 12px', borderRadius: '8px', outline: 'none', cursor: 'pointer', fontSize: '14px'
                }}
            >
                {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>
    );

    const ThemeGrid = () => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px', marginTop: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border2)' }}>
            {AVAILABLE_THEMES.map(t => (
                <div
                    key={t.id}
                    onClick={() => { triggerHaptic(); setTheme(t.id); }}
                    style={{
                        padding: '16px 12px', background: theme === t.id ? 'var(--theme-glow)' : 'var(--surface2)',
                        border: `1px solid ${theme === t.id ? 'var(--theme-primary)' : 'var(--border)'}`,
                        borderRadius: '12px', textAlign: 'center', cursor: 'pointer',
                        color: theme === t.id ? 'var(--theme-primary)' : 'var(--text)',
                        transition: 'all 0.2s ease', 
                        boxShadow: theme === t.id ? '0 4px 12px var(--theme-glow)' : 'none'
                    }}
                >
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>{t.name}</div>
                </div>
            ))}
        </div>
    );

    return (
        <main style={{ paddingTop: 'calc(var(--safe-top) + 100px)', paddingBottom: '80px', minHeight: '100vh', background: 'var(--bg)' }}>
            <div className="max-w-container">
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        style={{ fontSize: 'clamp(2rem, 5vw, 2.5rem)', fontWeight: 900, marginBottom: '32px', color: 'var(--text)', letterSpacing: '-0.02em' }}
                    >
                        Sanctorum Settings
                    </motion.h1>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                        <Section title="Appearance" icon={Palette}>
                            <div style={{ marginBottom: '8px' }}>
                                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>Active Theme</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '4px' }}>Native CSS optimization ensures zero-lag rendering.</div>
                                <ThemeGrid />
                            </div>
                            <Toggle 
                                label="AMOLED Pure Black" 
                                description="Forces backgrounds to absolute black (#000000) for maximum battery saving on OLED Android screens."
                                checked={amoledBlack} onChange={setAmoledBlack} 
                            />
                        </Section>

                        <Section title="Data & Storage" icon={HardDrive}>
                            <Toggle 
                                label="Data Saver Mode" 
                                description="Aggressively minimizes background fetching and forces posters to lowest resolution to save cellular data."
                                checked={dataSaver} onChange={setDataSaver} 
                            />
                            <Select 
                                label="Poster Quality" 
                                description="Resolution of movie and actor thumbnails fetching."
                                value={posterQuality} onChange={setPosterQuality}
                                options={[{label:'High (Original)',value:'High'}, {label:'Medium (w500)',value:'Medium'}, {label:'Low (w300)',value:'Low'}]}
                            />
                            <div 
                                onClick={handleClearCache}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 0', cursor: 'pointer', color: '#ff4d4d', fontWeight: 600, transition: 'opacity 0.2s' }}
                            >
                                <Trash2 size={18} />
                                <span>Clear Local Cache</span>
                            </div>
                        </Section>

                        <Section title="General" icon={Layout}>
                            <Select 
                                label="Default Launch Tab" 
                                description="Which page should open instantly when the Android app starts."
                                value={defaultTab} onChange={setDefaultTab}
                                options={[{label:'Home Archive',value:'/'}, {label:'Rankings',value:'/hall-of-fame'}, {label:'Compare',value:'/compare'}, {label:'Oscars',value:'/oscars'}]}
                            />
                        </Section>

                        <Section title="About System" icon={Info}>
                            <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border2)' }}>
                                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>Critic's Temple</span>
                                    <span style={{ fontSize: '10px', background: 'var(--theme-glow)', color: 'var(--theme-primary)', padding: '2px 8px', borderRadius: '12px' }}>PRO</span>
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '6px' }}>App Version: {appInfo.version} (Build {appInfo.build})</div>
                            </div>
                            <div style={{ padding: '12px 0', fontSize: '13px', color: 'var(--text-3)' }}>
                                Developed strictly for highly curated cinema review tracking. All rights reserved.
                            </div>
                        </Section>
                    </motion.div>
                </div>
            </div>
        </main>
    );
}
