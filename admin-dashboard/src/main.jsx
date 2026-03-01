import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

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
