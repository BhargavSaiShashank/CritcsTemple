# 🏛️ The Critic's Temple

A premium, high-fidelity cinematic critique platform designed for deep analytical storytelling. Built with a modern tech stack featuring FastAPI, MongoDB Atlas, and React.

## 🌟 Ecosystem Overview

This repository houses the entire "Critic's Temple" ecosystem, consisting of three primary layers:

### 1. ⚡ Backend Engine (`/app`)
A high-performance **FastAPI** service that manages the core logic, database interactions, and AI integrations.
- **Database**: MongoDB Atlas with `motor` for asynchronous I/O.
- **AI Integration**: Custom Oracle implementation for cinematic analysis.
- **Auth**: Firebase Admin SDK for secure administrative access.

### 2. 🏛️ Public Enclave (`/public-enclave`)
The user-facing experience built with **React** and **Vite**.
- **Aesthetics**: Glassmorphism, dynamic animations (Framer Motion), and premium typography.
- **Mobile**: Powered by **Capacitor** for a native Android/iOS experience.
- **Features**: Infinite scroll (Sanctuary Scroll), AI Oracle chat, and Cinematic DNA visualizations.

### 3. 🛡️ Admin Dashboard (`/admin-dashboard`)
The command center for editors and critics.
- **Management**: Full CRUD for reviews and categories.
- **Analytics**: Engagement intelligence and "Cinematic DNA" profiling.
- **Tools**: TMDB integration for automated movie data fetching and the "Data Vault" export system.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB Atlas account
- Firebase Service Account key (for Admin access)

### 1. Backend Setup
```bash
# Setup virtual environment
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Configure .env (see .env.example)
python run.py
```

### 2. Frontend Setup (Public or Admin)
```bash
cd public-enclave # or cd admin-dashboard
npm install
npm run dev
```

## 📱 Mobile Verification (Public Enclave)
To sync the web experience to the Android emulator:
```bash
cd public-enclave
npm run build
npx cap sync android
```

---

## 🛠️ Core Services & APIs
- **TMDB**: Movie metadata and high-res imagery.
- **Groq/Llama**: Powering the Primal Pulse Oracle.
- **Firebase**: Secure authentication and identity management.

## 📜 License
Privately developed for The Sanctuary. All rights reserved.
