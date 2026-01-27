import sqlite3

db = sqlite3.connect("apsrtc.db")
cur = db.cursor()

# ROUTES
cur.execute("""
CREATE TABLE IF NOT EXISTS routes (
    route_id INTEGER PRIMARY KEY,
    route_name TEXT,
    from_station TEXT,
    to_station TEXT
)
""")

# SERVICES
cur.execute("""
CREATE TABLE IF NOT EXISTS services (
    service_id INTEGER PRIMARY KEY,
    service_no TEXT,
    route_id INTEGER,
    service_type TEXT
)
""")

# VEHICLES
cur.execute("""
CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id INTEGER PRIMARY KEY,
    vehicle_no TEXT,
    service_id INTEGER,
    status TEXT
)
""")

# STOPS
cur.execute("""
CREATE TABLE IF NOT EXISTS stops (
    stop_id INTEGER PRIMARY KEY,
    route_id INTEGER,
    stop_name TEXT,
    lat REAL,
    lng REAL,
    stop_order INTEGER
)
""")

# TIMETABLE
cur.execute("""
CREATE TABLE IF NOT EXISTS timetable (
    time_id INTEGER PRIMARY KEY,
    service_id INTEGER,
    stop_id INTEGER,
    arrival_time TEXT
)
""")

# LIVE LOCATION
cur.execute("""
CREATE TABLE IF NOT EXISTS live_location (
    bus_id INTEGER,
    lat REAL,
    lng REAL,
    speed INTEGER,
    updated_at TEXT
)
""")

# ---------------- SAMPLE DATA ----------------

# Routes
cur.execute("INSERT INTO routes VALUES (1,'Gajuwaka → Beach Road','Gajuwaka','Beach Road')")
cur.execute("INSERT INTO routes VALUES (2,'Maddilapalem → Simhachalam','Maddilapalem','Simhachalam')")

# Services
cur.execute("INSERT INTO services VALUES (1,'28A',1,'Express')")
cur.execute("INSERT INTO services VALUES (2,'6K',2,'Metro')")

# Vehicles
cur.execute("INSERT INTO vehicles VALUES (1,'AP31 AB 1234',1,'Running')")
cur.execute("INSERT INTO vehicles VALUES (2,'AP31 CD 5678',2,'Running')")

# Stops (Route 1)
cur.execute("INSERT INTO stops VALUES (1,1,'Gajuwaka',17.72,83.30,1)")
cur.execute("INSERT INTO stops VALUES (2,1,'Maddilapalem',17.73,83.31,2)")
cur.execute("INSERT INTO stops VALUES (3,1,'Beach Road',17.75,83.33,3)")

# Timetable
cur.execute("INSERT INTO timetable VALUES (1,1,1,'10:00')")
cur.execute("INSERT INTO timetable VALUES (2,1,2,'10:20')")
cur.execute("INSERT INTO timetable VALUES (3,1,3,'10:45')")

# Live location
cur.execute("INSERT INTO live_location VALUES (1,17.72,83.30,35,'2026-01-23 09:00')")
cur.execute("INSERT INTO live_location VALUES (2,17.73,83.31,30,'2026-01-23 09:00')")

db.commit()
db.close()

print("✅ Database created successfully!")
