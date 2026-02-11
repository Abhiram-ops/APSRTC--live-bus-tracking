import sqlite3
import os

import os

# Use absolute path relative to this script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_NAME = os.path.join(BASE_DIR, "apsrtc.db")

def initialize_db():
    print(f"⏳ Initializing Database at {DB_NAME}...")
    db = sqlite3.connect(DB_NAME)
    cur = db.cursor()

    # DROP TABLES IF EXIST (To avoid duplicates)
    cur.execute("DROP TABLE IF EXISTS routes")
    cur.execute("DROP TABLE IF EXISTS services")
    cur.execute("DROP TABLE IF EXISTS vehicles")
    cur.execute("DROP TABLE IF EXISTS stops")
    cur.execute("DROP TABLE IF EXISTS timetable")
    cur.execute("DROP TABLE IF EXISTS live_location")

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
        service_type TEXT,
        ticket_price INTEGER
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

    # DRIVERS
    cur.execute("""
    CREATE TABLE IF NOT EXISTS drivers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )
    """)

    # USERS (Riders)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )
    """)

    # ---------------- SAMPLE DATA ----------------

    # Routes
    cur.execute("INSERT INTO routes VALUES (1,'Gajuwaka → Beach Road','Gajuwaka','Beach Road')")
    cur.execute("INSERT INTO routes VALUES (2,'Maddilapalem → Simhachalam','Maddilapalem','Simhachalam')")
    cur.execute("INSERT INTO routes VALUES (3,'RTC Complex → Railway Station','RTC Complex','Railway Station')")

    # Services
    cur.execute("INSERT INTO services VALUES (1,'28A',1,'Express', 30)")
    cur.execute("INSERT INTO services VALUES (2,'6K',2,'Metro', 20)")
    cur.execute("INSERT INTO services VALUES (3,'400K',3,'Deluxe', 50)")

    # Vehicles
    cur.execute("INSERT INTO vehicles VALUES (1,'AP31 AB 1234',1,'Running')")
    cur.execute("INSERT INTO vehicles VALUES (2,'AP31 CD 5678',2,'Running')")
    cur.execute("INSERT INTO vehicles VALUES (3,'AP31 EF 9012',3,'Running')")

    # Stops (Route 1)
    cur.execute("INSERT INTO stops VALUES (1,1,'Gajuwaka',17.72,83.30,1)")
    cur.execute("INSERT INTO stops VALUES (2,1,'Maddilapalem',17.73,83.31,2)")
    cur.execute("INSERT INTO stops VALUES (3,1,'Beach Road',17.75,83.33,3)")

    # Stops (Route 3)
    cur.execute("INSERT INTO stops VALUES (4,3,'RTC Complex',17.72,83.30,1)")
    cur.execute("INSERT INTO stops VALUES (5,3,'Railway Station',17.73,83.31,2)")

    # Timetable
    cur.execute("INSERT INTO timetable VALUES (1,1,1,'10:00')")
    cur.execute("INSERT INTO timetable VALUES (2,1,2,'10:20')")
    cur.execute("INSERT INTO timetable VALUES (3,1,3,'10:45')")
    cur.execute("INSERT INTO timetable VALUES (4,3,4,'11:00')")
    cur.execute("INSERT INTO timetable VALUES (5,3,5,'11:30')")

    # Live location - REMOVED dummy data so we only show real driver locations
    # cur.execute("INSERT INTO live_location VALUES (1,17.72,83.30,35,'2026-01-23 09:00')")
    # cur.execute("INSERT INTO live_location VALUES (2,17.73,83.31,30,'2026-01-23 09:00')")
    # cur.execute("INSERT INTO live_location VALUES (3,17.74,83.32,40,'2026-01-23 09:00')")

    db.commit()
    db.close()

    print("[OK] Database created successfully!")

def migrate():
    """Safely create tables if they don't exist, without dropping data."""
    print(f"[...] Checking/Migrating Database at {DB_NAME}...")
    db = sqlite3.connect(DB_NAME)
    cur = db.cursor()

    # Ensure USERS table exists (Safe to run always)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )
    """)
    
    # Ensure DRIVERS table exists
    cur.execute("""
    CREATE TABLE IF NOT EXISTS drivers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )
    """)

    db.commit()
    db.close()
    print("[OK] Migration complete!")

if __name__ == "__main__":
    initialize_db()
