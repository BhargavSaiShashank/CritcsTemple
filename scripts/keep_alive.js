/**
 * Backend Keep-Alive Script
 * 
 * This script pings the backend health endpoint every 60 seconds to prevent
 * the service from sleeping (specifically for Render Free Tier).
 * 
 * Usage: node keep_alive.js [interval_in_ms]
 */

const BACKEND_URL = 'https://temple-backend-zgu3.onrender.com/health';
const DEFAULT_INTERVAL = 60 * 1000; // 60 seconds
const argInterval = process.argv[2] ? parseInt(process.argv[2], 10) : null;
const interval = argInterval && !isNaN(argInterval) ? argInterval : DEFAULT_INTERVAL;

console.log(`[Keep-Alive] Starting pinger for: ${BACKEND_URL}`);
console.log(`[Keep-Alive] Interval: ${interval / 1000} seconds`);

async function ping() {
    const timestamp = new Date().toISOString();
    try {
        const response = await fetch(BACKEND_URL);
        if (response.ok) {
            console.log(`[${timestamp}] Ping successful: ${response.status}`);
        } else {
            console.warn(`[${timestamp}] Ping failed with status: ${response.status}`);
        }
    } catch (error) {
        console.error(`[${timestamp}] Ping error:`, error.message);
    }
}

// Initial ping
ping();

// Schedule periodic pings
setInterval(ping, interval);
