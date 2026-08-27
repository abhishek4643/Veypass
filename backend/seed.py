import datetime
import random
from database import engine, SessionLocal
import models
from pricing import train_model

def seed_db():
    print("Checking database tables...")
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    if db.query(models.User).first() and db.query(models.Route).first():
        print("Database is already seeded! Skipping initialization to prevent duplicates.")
        db.close()
        return
        
    print("Initializing fresh seed data...")
    train_model()
    import auth
    
    # 1. Admin & Conductor
    admin = models.User(name="Admin", email="admin@veypass.com", hashed_password=auth.get_password_hash("admin123"), role="admin")
    conductor = models.User(name="Conductor", email="conductor@veypass.com", hashed_password=auth.get_password_hash("conductor123"), role="conductor")
    db.add_all([admin, conductor])
    db.flush()

    # 2. Locations (India)
    cities_data = [
        "Hyderabad", "Bengaluru", "Chennai", "Mumbai", "Pune", 
        "Delhi", "Jaipur", "Ahmedabad", "Surat", "Goa",
        "Kochi", "Trivandrum", "Vijayawada", "Visakhapatnam", "Nagpur",
        "Kolkata", "Bhubaneswar", "Indore", "Bhopal", "Lucknow", "Patna", "Ranchi"
    ]
    city_objs = {}
    for c in cities_data:
        city = models.City(name=c, aliases=c.lower())
        db.add(city)
        city_objs[c] = city
    db.flush()
    
    # 3. Buses
    operators = ["Veypass Express", "TravelChain Express", "Veyora Travels", "NovaRide Travels", "MetroLink Travels", "RoadNexa Travels"]
    bus_types = ["A/C Sleeper (2+1)", "Non A/C Seater (2+2)", "Volvo Multi-Axle I-Shift", "Scania AC Semi-Sleeper"]
    amenities_list = ["WIFI, Blankets, Water Bottle", "Charging Point, Reading Light", "CCTV, GPS Tracking, Rest Stop"]
    
    buses = []
    for i in range(20):
        bus = models.Bus(
            operator_name=random.choice(operators),
            bus_number=f"MH-{random.randint(10,99)}-{random.randint(1000,9999)}",
            bus_type=random.choice(bus_types),
            total_seats=32,
            amenities=random.choice(amenities_list),
            rating=round(random.uniform(3.5, 4.9), 1)
        )
        db.add(bus)
        buses.append(bus)
    db.flush()
    
    # 4. Seats per bus
    for bus in buses:
        for i in range(1, 33):
            # Assign logical rows
            row = (i - 1) // 4 + 1
            col = (i - 1) % 4
            is_window = (col == 0 or col == 3)
            seat = models.Seat(
                bus_id=bus.id,
                seat_number=f"{chr(64 + row)}{col + 1}",
                seat_type="SLEEPER" if "Sleeper" in bus.bus_type else "SEATER",
                is_window=is_window,
                price_modifier=50.0 if is_window else 0.0
            )
            db.add(seat)
    db.flush()
    
    # 5. Routes & Schedules
    print("Generating routes and schedules...")
    now = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    for _ in range(50):
        orig = random.choice(list(city_objs.values()))
        dest = random.choice([c for c in city_objs.values() if c.id != orig.id])
        
        # Check if route exists
        route = db.query(models.Route).filter(models.Route.origin_city_id == orig.id, models.Route.destination_city_id == dest.id).first()
        if not route:
            route = models.Route(
                origin_city_id=orig.id,
                destination_city_id=dest.id,
                distance_km=random.uniform(200, 1500),
                duration_minutes=random.randint(180, 800),
                popularity_score=random.uniform(0.5, 2.0)
            )
            db.add(route)
            db.flush()
            
        # Create schedules for this route (2 to 5 schedules per route)
        for _ in range(random.randint(2, 5)):
            bus = random.choice(buses)
            journey_date = now + datetime.timedelta(days=random.randint(0, 7))
            dep_hour = random.randint(5, 23)
            dep_time = journey_date + datetime.timedelta(hours=dep_hour)
            arr_time = dep_time + datetime.timedelta(minutes=route.duration_minutes)
            
            schedule = models.BusSchedule(
                route_id=route.id,
                bus_id=bus.id,
                journey_date=journey_date,
                departure_time=dep_time,
                arrival_time=arr_time,
                base_fare=round(random.uniform(500, 2500), -1),
                active=True
            )
            db.add(schedule)
            
    db.commit()
    db.close()
    print("Seed complete! Created safe, normalized demo data for Supabase.")

if __name__ == "__main__":
    seed_db()
