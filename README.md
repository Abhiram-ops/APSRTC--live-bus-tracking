# 🚍 APSRTC Live Tracking System

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://apsrtc-vizag.onrender.com)

A modern, real-time bus tracking application for Visakhapatnam (Vizag) city. Built with Flask, Leaflet.js, and a focus on clean, responsive design.

## 🌟 Key Features

### 📍 For Commuters (Users)
- **Live Bus Tracking:** Watch buses move in real-time on an interactive map.
- **Route Search:** Find buses between any two stations (e.g., Gajuwaka to Beach Road).
- **Service Details:** View stops, timetables, and estimated arrival times (ETA).
- **Secure Portal:** User registration and login with "Remember Me" functionality.
- **Modern UI:** extensive glassmorphism design with a scenic Vizag background.

### 🚌 For Drivers
- **Mobile-First Dashboard:** Optimized interface for easy use on smartphones.
- **One-Click Tracking:** Start/Stop sharing location with a single tap.
- **Live Status:** Visual indicators for active/inactive status.
- **Secure Login:** Dedicated driver authentication portal.

---

## 🛠️ Technology Stack

- **Backend:** Python (Flask), SQLite3
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla ES6)
- **Maps:** Leaflet.js (OpenStreetMap)
- **Security:** 
    - `Werkzeug` (Password Hashing)
    - `Flask-Limiter` (Rate Limiting)
    - `Flask-Talisman` (Secure Headers)
    - `python-dotenv` (Secrets Management)

---

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/apsrtc-live-tracking.git
cd apsrtc-live-tracking
```

### 2. Create a Virtual Environment
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Create a `.env` file in the `Backend` folder:
```bash
# Backend/.env
SECRET_KEY=your_secure_random_key_here
FLASK_ENV=development
```

### 5. Run the Application
```bash
# Navigate to the backend directory if needed, or run from root:
python Backend/backend.py
```
Visit `http://localhost:5000` in your browser.

---

## 🌐 Deployment (Render.com)

This project is configured for deployment on Render.

1. **Create a Web Service** on Render.
2. **Connect your GitHub Repo.**
3. **Settings:**
    - **Build Command:** `pip install -r requirements.txt`
    - **Start Command:** `gunicorn Backend.backend:app`
4. **Environment Variables:** Add your `SECRET_KEY` in the Render dashboard.

---

## 📂 Project Structure

```
├── Backend/
│   ├── static/             # CSS, JS, Images
│   ├── templates/          # HTML files (index, login, driver)
│   ├── backend.py          # Main Flask Application
│   ├── init_db.py          # Database Initialization Script
│   └── .env                # Environment Variables (Not committed)
├── apsrtc.db               # SQLite Database (Auto-generated)
├── requirements.txt        # Python Dependencies
└── README.md               # Project Documentation
```

## 🛡️ Security

- **Rate Limiting:** Protects login endpoints from brute-force attacks.
- **Session Management:** Secure server-side sessions.
- **Input Validation:** Parameterized SQL queries prevent injection attacks.

---

## 📸 Screenshots

*(Add screenshots of your Dashboard, Map, and Mobile View here)*

---

Made with ❤️ for Vizag Commuters.
