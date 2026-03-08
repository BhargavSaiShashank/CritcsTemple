// Global Native Error Catcher
if (typeof window !== 'undefined') {
  const levels = ['log', 'debug', 'info', 'warn', 'error'];
  levels.forEach(level => {
    const original = console[level];
    console[level] = function (...args) {
      const processed = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          try {
            const type = arg.constructor ? arg.constructor.name : 'Object';
            if (arg instanceof Error) {
              return `[ERROR_OBJ] ${arg.message} \nStack: ${arg.stack}`;
            }

            // Performance Guard: Truncate large arrays or complex objects to prevent jank
            if (Array.isArray(arg) && arg.length > 20) {
              return `[SNIFFED_Array(${arg.length})] [${arg.slice(0, 3).map(i => typeof i).join(', ')} ... +${arg.length - 3} more]`;
            }

            // Custom replacer for JSON.stringify to handle BigInt and circular references
            const customStringify = (obj) => {
              const cache = new Set();
              const str = JSON.stringify(obj, (key, value) => {
                if (typeof value === 'object' && value !== null) {
                  if (cache.has(value)) return '[Circular]';
                  cache.add(value);
                }
                if (typeof value === 'bigint') return value.toString() + 'n';
                return value;
              });

              // Prevent logging massive strings that freeze the bridge
              return str.length > 1000 ? str.substring(0, 1000) + '... [TRUNCATED]' : str;
            };

            return `[SNIFFED_${type}] ${customStringify(arg)}`;
          }
          catch (e) {
            // Fallback for objects that still cannot be serialized (e.g., objects with non-enumerable properties that cause issues, or very complex structures)
            return `[UNSERIALIZABLE ${typeof arg}] (Error: ${e.message || 'Unknown'})`;
          }
        }
        return arg;
      });
      original.apply(console, processed);
    };
  });
  console.log("[SNIFFER] Activated at entry");

  window.onerror = function (msg, url, line, col, error) {
    console.error(`[RUNTIME ERROR] ${msg} at ${url}:${line}:${col}`, error ? JSON.stringify(error) : 'no error object');
    return false;
  };
  window.addEventListener('unhandledrejection', function (event) {
    console.error(`[PROMISE REJECTION]`, event.reason ? JSON.stringify(event.reason) : 'no reason');
  });
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log("[RENDER] Triggering createRoot");

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
