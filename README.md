---
title: Critics Temple API
emoji: 🏛️
colorFrom: gray
colorTo: yellow
sdk: docker
app_port: 7860
pinned: false
license: mit
---

# 🏛️ Critic's Temple

[![Status](https://img.shields.io/badge/Status-Legendary-f5a623?style=for-the-badge&logoScale=1.2)]()
[![Platform](https://img.shields.io/badge/Platform-Web_&_Android-f2f2f2?style=for-the-badge)]()
[![Intelligence](https://img.shields.io/badge/Intelligence-Llama_3.3-60a5fa?style=for-the-badge)]()

> **"Welcome, Seeker. Step into the Temple where cinema isn't just watched—it's unmasked."**

Critic's Temple is a premium, high-fidelity cinematic archive designed for those who view film as more than just entertainment. It is a digital sanctuary for deep analytical storytelling, atmospheric critique, and cinematic enlightenment.

---

## 🌟 The Experience

### 🔮 The Temple Oracle
Harness the power of **Groq-accelerated Llama 3.3** intelligence. The Oracle doesn't just answer questions; it perceives "What if" scenarios, unearths thematic patterns, and guides you through the archive with mystical precision.

### 🎟️ The Sanctuary Ticket
Every review is a destination. Generate and share handcrafted **Cinematic Tickets** and **Square Cards**, complete with detailed breakdowns of the film's DNA—from Story and Acting to its Visual soul.

### 📜 The Hall of Fame
Curated categories of absolute excellence. Only the **Legendary** and **Masterpiece** imprints find a permanent place in the Temple's inner sanctum.

---

## 🏗️ Technical Architecture

The Temple is built on three pillars of performance:

### 1. ⚡ The Backend Engine (`/app`)
*   **Core**: Python 3.10+ / FastAPI
*   **Database**: MongoDB Atlas (Async Motor Driver)
*   **Intelligence**: Groq Cloud Integration (Llama-3.3-70b-versatile)
*   **Identity**: Firebase Admin SDK for secure critic enlightenment.

### 2. 🛡️ The Admin Dashboard (`/admin-dashboard`)
*   **Framework**: React 18 + Vite
*   **Intelligence**: TMDB API integration for automated metadata harvesting.
*   **Tools**: The Data Vault export system and engagement intelligence.

### 3. 🏛️ The Public Enclave (`/public-enclave`)
*   **Aesthetics**: Vanilla CSS with Glassmorphism, Framer Motion animations.
*   **Native**: **Capacitor 8.0** bridging the gap between Web and the Seeker's Mobile device.
*   **Mobile Features**: Native Share Sheet integration, Filesystem caching, and pull-to-refresh archives.

---

## 🚀 Ritual of Initiation (Setup)

### 🏺 Prerequisites
*   Python 3.10+ & Node.js 18+
*   Groq API Key (for the Oracle)
*   TMDB API Key (for Metadata)
*   Firebase Service Account (for the Admin Sanctum)

### 1. Awaken the Backend
```bash
# Enter the forge
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate

# Install the scrolls
pip install -r requirements.txt

# Ignite the service
python run.py
```

### 2. Summon the Interfaces
```bash
# Public Enclave
cd public-enclave && npm install && npm run dev

# Admin Sanctum
cd admin-dashboard && npm install && npm run dev
```

---

## 📱 Mobile Enlightenment
To manifest the Temple on Android:
```bash
cd public-enclave
npm run build
npx cap sync android
```
*Note: Ensure your Android Studio environment is ready for the sync.*

---

## 📜 Commandments
1. **Aesthetics are Absolute.** Every pixel must flow with cinematic intent.
2. **The Oracle is Honest.** Its wisdom is fueled by the archive imprints.
3. **The Archive is Sacred.** Only verify imprints are published to the Enclave.

---

<p align="center">
  <i>Developed with passion for the art of cinema. All rights reserved by the Architect.</i>
</p>
