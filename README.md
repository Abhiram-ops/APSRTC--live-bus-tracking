# 🚌 APSRTC Live Track (Vizag City)

A modern, real-time bus tracking application for Visakhapatnam (Vizag) city buses. This project features a full-stack implementation with a Flask backend and a responsive, app-like frontend.

## 🚀 Features

-   **Ticket Search**: Find buses between stations with **Ticket Fare** display.
-   **Live Tracking**: Real-time updates of speed and location for specific services (e.g., 28A).
-   **Route Listing**: View all available city routes.
-   **Autocomplete**: Smart search suggestions for partial station names.
-   **Modern UI**: Mobile-first design with a clean Red & White aesthetic.

## 🛠️ Tech Stack

-   **Backend**: Python (Flask), SQLite3
-   **Frontend**: HTML5, CSS3 (Modern Variables), JavaScript (ES6)
-   **Data**: Mock data simulated via local database.

## 📦 How to Run

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/apsrtc-live-track.git
cd apsrtc-live-track
```

### 2. Install Dependencies
Make sure you have Python installed.
```bash
pip install -r requirements.txt
```

### 3. Initialize Database
Initialize the SQLite database with seed data:
```bash
cd Backend
python init_db.py
```

### 4. Run the Backend
Start the Flask server:
```bash
python backend.py
```
*The server will run at `http://127.0.0.1:5000`*

### 5. Open Frontend
Open `Backend/Test_Frontend/index.html` in your browser.

## 📸 Screenshots
*(Add screenshots of your Dashboard and Live Tracking screens here)*

## 📄 License
MIT License
