import React from 'react'
import ReactDOM from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'
import App from './App.jsx'
import './index.css'

const initNative = async () => {
    if (Capacitor.isNativePlatform()) {
        document.body.classList.add('is-native');
        if (Capacitor.getPlatform() === 'android') {
            try {
                // Force true deep baseline
                await StatusBar.setBackgroundColor({ color: '#020202' });
                await StatusBar.setStyle({ style: Style.Dark });
                // Make the webview overlay the system bars to avoid white gaps
                await StatusBar.setOverlaysWebView({ overlay: true });
            } catch (e) {
                console.warn("Status bar config failed", e);
            }
        }
        try {
            await SplashScreen.hide();
        } catch (e) {
            console.warn("Splash screen hide failed", e);
        }
    }
};

initNative();

// Advanced Console Sniffer for deep error inspection
const originalLog = console.log;
const originalError = console.error;

const deepStringify = (obj) => {
    try {
        return JSON.stringify(obj, (key, value) => {
            if (typeof value === 'object' && value !== null) {
                if (value instanceof Error) {
                    return {
                        message: value.message,
                        stack: value.stack,
                        ...value
                    };
                }
            }
            return value;
        }, 2);
    } catch (e) {
        return String(obj);
    }
};

console.log = (...args) => {
    originalLog(...args);
    const snif = args.map(arg => typeof arg === 'object' ? `[OBJ] ${deepStringify(arg)}` : arg).join(' ');
    // Prevent recursive sniffing
    if (snif.includes('[OBJ]')) originalLog('[SNIFFER]', snif);
};

console.error = (...args) => {
    originalError(...args);
    const snif = args.map(arg => typeof arg === 'object' ? `[ERR_OBJ] ${deepStringify(arg)}` : arg).join(' ');
    originalError('[SNIFFER_ERR]', snif);
};

console.log("[SNIFFER] Activated in Admin Dashboard");

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
