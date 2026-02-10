import os
from flask import Flask, jsonify, request, render_template, session, redirect, url_for
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import time
import threading
from dotenv import load_dotenv
from flask_talisman import Talisman
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Security Headers (Force HTTPS in production, tweak for dev)
Talisman(app, content_security_policy=None, force_https=False)  # Set force_https=True in prod
# Rate Limiting
limiter = Limiter(get_remote_address, app=app, default_limits=["200 per day", "50 per hour"])

app.secret_key = os.getenv("SECRET_KEY", "fallback_dev_key")
CORS(app)

# Absolute path for Database
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(BASE_DIR, "apsrtc.db")

# Auto-Initialize Database if missing
if not os.path.exists(DB):
    print(f"⚠️ Database not found at {DB}. Creating it...")
    import init_db
    init_db.initialize_db()

def get_db():
    return sqlite3.connect(DB)

# -----------------------------
# HOME
# -----------------------------
@app.route("/")
def home():
    return render_template("index.html")


# -----------------------------
# 🔍 SEARCH BUSES (FROM - TO)
# -----------------------------
@app.route("/api/search")
def search_buses():
    from_station = request.args.get("from")
    to_station = request.args.get("to")
    service_type = request.args.get("service")   # ✅ FIXED

    db = get_db()
    cur = db.cursor()

    query = """
    SELECT s.service_no, r.route_name, s.service_type, s.ticket_price, v.vehicle_no
    FROM services s
    JOIN routes r ON s.route_id = r.route_id
    JOIN vehicles v ON v.service_id = s.service_id
    WHERE (r.from_station LIKE ? AND r.to_station LIKE ?) 
       OR (r.from_station LIKE ? AND r.to_station LIKE ?)
    """
    # Check both directions: A->B OR B->A
    params = [f"%{from_station}%", f"%{to_station}%", f"%{to_station}%", f"%{from_station}%"]

    if service_type:
        query += " AND s.service_type=?"
        params.append(service_type)

    cur.execute(query, params)
    rows = cur.fetchall()
    db.close()

    result = []
    for row in rows:
        result.append({
            "service_no": row[0],
            "route_name": row[1],
            "service_type": row[2],
            "ticket_price": row[3],
            "vehicle_no": row[4]
        })

    return jsonify(result)


# -----------------------------
# 🚌 SERVICE SEARCH
# -----------------------------
@app.route("/api/service/<service_no>")
def get_service(service_no):
    db = get_db()
    cur = db.cursor()

    cur.execute("""
    SELECT s.service_no, r.route_name
    FROM services s
    JOIN routes r ON s.route_id = r.route_id
    WHERE s.service_no=?
    """, (service_no,))

    row = cur.fetchone()
    db.close()

    if not row:
        return jsonify({"error": "Service not found"}), 404

    return jsonify({"service_no": row[0], "route": row[1]})


# -----------------------------
# 🚐 VEHICLE SEARCH
# -----------------------------
@app.route("/api/vehicle/<vehicle_no>")
def get_vehicle(vehicle_no):
    db = get_db()
    cur = db.cursor()

    cur.execute("""
    SELECT v.vehicle_no, s.service_no, r.route_name, v.status
    FROM vehicles v
    JOIN services s ON v.service_id = s.service_id
    JOIN routes r ON s.route_id = r.route_id
    WHERE v.vehicle_no=?
    """, (vehicle_no,))

    row = cur.fetchone()
    db.close()

    if not row:
        return jsonify({"error": "Vehicle not found"}), 404

    return jsonify({
        "vehicle_no": row[0],
        "service_no": row[1],
        "route": row[2],
        "status": row[3]
    })


# -----------------------------
# 🕒 TIMETABLE (FROM - TO)
# -----------------------------
@app.route("/api/timetable")
def timetable():
    from_station = request.args.get("from")
    to_station = request.args.get("to")

    db = get_db()
    cur = db.cursor()

    cur.execute("""
    SELECT s.service_no, t.arrival_time
    FROM timetable t
    JOIN stops st ON t.stop_id = st.stop_id
    JOIN services s ON t.service_id = s.service_id
    JOIN routes r ON s.route_id = r.route_id
    WHERE (r.from_station LIKE ? AND r.to_station LIKE ?) 
       OR (r.from_station LIKE ? AND r.to_station LIKE ?)
    """, (f"%{from_station}%", f"%{to_station}%", f"%{to_station}%", f"%{from_station}%"))

    rows = cur.fetchall()
    db.close()

    result = []
    for row in rows:
        result.append({"service_no": row[0], "arrival_time": row[1]})

    return jsonify(result)


# -----------------------------
# 📍 LIVE TRACKING
# -----------------------------
@app.route("/api/live/<service_no>")
def live_tracking(service_no):
    db = get_db()
    cur = db.cursor()

    cur.execute("""
    SELECT l.lat, l.lng, l.speed, l.updated_at
    FROM live_location l
    JOIN vehicles v ON l.bus_id = v.vehicle_id
    JOIN services s ON v.service_id = s.service_id
    WHERE s.service_no=?
    """, (service_no,))

    row = cur.fetchone()
    db.close()

    if not row:
        return jsonify({"error": "Live data not found"}), 404

    return jsonify({
        "lat": row[0],
        "lng": row[1],
        "speed": row[2],
        "updated_at": row[3]
    })


# -----------------------------
# 🗺️ ROUTE DETAILS (For Map Polyline)
# -----------------------------
@app.route("/api/route_details/<service_no>")
def route_details(service_no):
    db = get_db()
    cur = db.cursor()

    # Get Route ID and Stops
    cur.execute("""
    SELECT s.stop_name, s.lat, s.lng
    FROM stops s
    JOIN services sv ON sv.route_id = s.route_id
    WHERE sv.service_no = ?
    ORDER BY s.stop_order ASC
    """, (service_no,))

    rows = cur.fetchall()
    db.close()

    if not rows:
        return jsonify({"error": "Route details not found"}), 404

    stops = [{"name": row[0], "lat": row[1], "lng": row[2]} for row in rows]
    return jsonify(stops)


# -----------------------------
# ⏱️ ETA CALCULATION
# -----------------------------
@app.route("/api/eta/<service_no>")
def calculate_eta(service_no):
    db = get_db()
    cur = db.cursor()

    cur.execute("""
    SELECT speed FROM live_location l
    JOIN vehicles v ON l.bus_id = v.vehicle_id
    JOIN services s ON v.service_id = s.service_id
    WHERE s.service_no=?
    """, (service_no,))

    row = cur.fetchone()
    db.close()

    if not row:
        return jsonify({"error": "ETA data not found"}), 404

    speed = row[0]  # km/h
    distance = 5   # demo

    eta_minutes = int((distance / speed) * 60)

    return jsonify({
        "service_no": service_no,
        "remaining_distance_km": distance,
        "speed_kmph": speed,
        "eta_minutes": eta_minutes
    })


# -----------------------------
# 🔐 ADMIN — ADD ROUTE
# -----------------------------
@app.route("/api/admin/add_route", methods=["POST"])
def add_route():
    data = request.json
    db = get_db()
    cur = db.cursor()

    cur.execute("INSERT INTO routes(route_name, from_station, to_station) VALUES (?,?,?)",
                (data["route_name"], data["from"], data["to"]))

    db.commit()
    db.close()

    return jsonify({"message": "Route added successfully"})


# -----------------------------
# 🔐 ADMIN — ADD SERVICE
# -----------------------------
@app.route("/api/admin/add_service", methods=["POST"])
def add_service():
    data = request.json
    db = get_db()
    cur = db.cursor()

    cur.execute("INSERT INTO services(service_no, route_id, service_type) VALUES (?,?,?)",
                (data["service_no"], data["route_id"], data["service_type"]))

    db.commit()
    db.close()

    return jsonify({"message": "Service added successfully"})


# -----------------------------
# 🔐 ADMIN — ADD VEHICLE
# -----------------------------
@app.route("/api/admin/add_vehicle", methods=["POST"])
def add_vehicle():
    data = request.json
    db = get_db()
    cur = db.cursor()

    cur.execute("INSERT INTO vehicles(vehicle_no, service_id, status) VALUES (?,?,?)",
                (data["vehicle_no"], data["service_id"], data["status"]))

    db.commit()
    db.close()

    return jsonify({"message": "Vehicle added successfully"})


# -----------------------------
# 🚦 DRIVER DASHBOARD
# -----------------------------
# -----------------------------
# 🔐 DRIVER AUTHENTICATION
# -----------------------------

@app.route("/driver/login")
def driver_login_page():
    if "driver_id" in session:
        return redirect("/driver")
    return render_template("driver_login.html")

@app.route("/api/driver/register", methods=["POST"])
@limiter.limit("3 per hour")
def driver_register():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Missing username or password"}), 400

    hashed_pw = generate_password_hash(password)

    try:
        db = get_db()
        cur = db.cursor()
        cur.execute("INSERT INTO drivers (username, password) VALUES (?, ?)", (username, hashed_pw))
        db.commit()
        db.close()
        return jsonify({"message": "Registration successful! Please login."})
    except sqlite3.IntegrityError:
        return jsonify({"error": "Username already exists"}), 409
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/driver/login", methods=["POST"])
@limiter.limit("5 per minute")
def driver_login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    db = get_db()
    cur = db.cursor()
    cur.execute("SELECT id, password FROM drivers WHERE username = ?", (username,))
    user = cur.fetchone()
    db.close()

    if user and check_password_hash(user[1], password):
        session["driver_id"] = user[0]
        session["username"] = username
        return jsonify({"message": "Login successful", "redirect": "/driver"})
    
    return jsonify({"error": "Invalid credentials"}), 401

@app.route("/api/driver/logout", methods=["POST"])
def driver_logout():
    session.clear()
    return jsonify({"message": "Logged out", "redirect": "/driver/login"})

@app.route("/driver")
def driver_dashboard():
    if "driver_id" not in session:
        return redirect("/driver/login")
    return render_template("driver.html", username=session.get("username"))


# -----------------------------
# 📡 UPDATE LIVE LOCATION (From Driver)
# -----------------------------
# Global Debug Log
DEBUG_LOGS = []

@app.route("/api/debug")
def get_debug_logs():
    return jsonify(DEBUG_LOGS[-20:]) # Last 20 logs

@app.route("/api/update_location", methods=["POST"])
def update_location():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No JSON data received"}), 400
            
        service_no = data.get("service_no")
        lat = data.get("lat")
        lng = data.get("lng")
        speed = data.get("speed", 0)
        
        log_entry = f"{time.strftime('%H:%M:%S')}: Received {service_no} at {lat}, {lng}"
        print(log_entry, flush=True)
        DEBUG_LOGS.append(log_entry)

        if not service_no or not lat or not lng:
            return jsonify({"error": "Missing data"}), 400

        db = get_db()
        cur = db.cursor()

        # Find vehicle_id for this service
        cur.execute("""
        SELECT v.vehicle_id FROM vehicles v
        JOIN services s ON v.service_id = s.service_id
        WHERE s.service_no = ?
        """, (service_no,))
        
        row = cur.fetchone()
        if not row:
            db.close()
            return jsonify({"error": "Service/Vehicle not found"}), 404

        vehicle_id = row[0]
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")

        # Update or Insert Live Location
        cur.execute("""
            UPDATE live_location 
            SET lat=?, lng=?, speed=?, updated_at=?
            WHERE bus_id=?
        """, (lat, lng, speed, timestamp, vehicle_id))

        if cur.rowcount == 0:
             cur.execute("""
            INSERT INTO live_location (bus_id, lat, lng, speed, updated_at)
            VALUES (?, ?, ?, ?, ?)
        """, (vehicle_id, lat, lng, speed, timestamp))

        db.commit()
        db.close()

        return jsonify({"message": "Location updated", "time": timestamp})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# -----------------------------
# 🔄 SIMULATE LIVE MOVEMENT
# -----------------------------
def simulate_live():
    while True:
        db = get_db()
        cur = db.cursor()

        cur.execute("""
        UPDATE live_location
        SET lat = lat + 0.0001,
            lng = lng + 0.0001,
            updated_at = ?
        """, (time.strftime("%Y-%m-%d %H:%M:%S"),))

        db.commit()
        db.close()
        time.sleep(5)


# -----------------------------
# 🛣️ ROUTES LIST & AUTOCOMPLETE
# -----------------------------
@app.route("/api/routes")
def get_all_routes():
    db = get_db()
    cur = db.cursor()
    cur.execute("SELECT route_name, from_station, to_station FROM routes")
    rows = cur.fetchall()
    db.close()

    result = []
    for row in rows:
        result.append({
            "route_name": row[0],
            "from": row[1],
            "to": row[2]
        })
    return jsonify(result)

@app.route("/api/stations")
def get_all_stations():
    db = get_db()
    cur = db.cursor()
    # Get unique stations from both 'from' and 'to' columns
    cur.execute("""
        SELECT from_station FROM routes
        UNION
        SELECT to_station FROM routes
    """)
    rows = cur.fetchall()
    db.close()

    stations = [row[0] for row in rows]
    return jsonify(stations)


# -----------------------------
# 📊 DASHBOARD DATA
# -----------------------------
@app.route("/api/dashboard")
def dashboard():
    db = get_db()
    cur = db.cursor()

    cur.execute("SELECT COUNT(*) FROM routes")
    routes = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM services")
    services = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM vehicles")
    vehicles = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM vehicles WHERE status='Running'")
    running = cur.fetchone()[0]

    db.close()

    return jsonify({
        "total_routes": routes,
        "total_services": services,
        "total_vehicles": vehicles,
        "running_buses": running
    })


# -----------------------------
# RUN
# -----------------------------
if __name__ == "__main__":
    # threading.Thread(target=simulate_live, daemon=True).start()  # Disabled for manual driver updates
    app.run(port=5000, debug=True)