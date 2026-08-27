import os
import datetime
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
import models

def seed_database():
    db = SessionLocal()
    
    # 1. Create Cities
    hyderabad = db.query(models.City).filter(models.City.name == "Hyderabad").first()
    if not hyderabad:
        hyderabad = models.City(name="Hyderabad")
        db.add(hyderabad)
        
    bengaluru = db.query(models.City).filter(models.City.name == "Bengaluru").first()
    if not bengaluru:
        bengaluru = models.City(name="Bengaluru")
        db.add(bengaluru)
        
    goa = db.query(models.City).filter(models.City.name == "Goa").first()
    if not goa:
        goa = models.City(name="Goa")
        db.add(goa)
        
    db.commit()
    db.refresh(hyderabad)
    db.refresh(bengaluru)
    db.refresh(goa)

    # 2. Create Routes
    route_hyd_blr = db.query(models.Route).filter(models.Route.origin_city_id == hyderabad.id, models.Route.destination_city_id == bengaluru.id).first()
    if not route_hyd_blr:
        route_hyd_blr = models.Route(origin_city_id=hyderabad.id, destination_city_id=bengaluru.id, duration_minutes=455)
        db.add(route_hyd_blr)
        
    route_hyd_goa = db.query(models.Route).filter(models.Route.origin_city_id == hyderabad.id, models.Route.destination_city_id == goa.id).first()
    if not route_hyd_goa:
        route_hyd_goa = models.Route(origin_city_id=hyderabad.id, destination_city_id=goa.id, duration_minutes=630)
        db.add(route_hyd_goa)
        
    db.commit()
    db.refresh(route_hyd_blr)
    db.refresh(route_hyd_goa)

    # 3. Create Buses and Seats
    def create_bus(operator_name, bus_number, bus_type, amenities, rating):
        bus = db.query(models.Bus).filter(models.Bus.bus_number == bus_number).first()
        if not bus:
            bus = models.Bus(
                operator_name=operator_name,
                bus_number=bus_number,
                bus_type=bus_type,
                amenities=amenities,
                rating=rating,
                total_seats=36
            )
            db.add(bus)
            db.commit()
            db.refresh(bus)
            
            # Create 36 seats for this bus
            has_upper = "Sleeper" in bus_type
            for i in range(36):
                seat_num = f"L{i%18 + 1}" if i < 18 else f"U{i%18 + 1}" if has_upper else str(i+1)
                seat = models.Seat(
                    bus_id=bus.id,
                    seat_number=seat_num,
                    is_window=(i % 4 == 0 or i % 4 == 3)
                )
                db.add(seat)
            db.commit()
        return bus

    # Adding a few prominent buses from the frontend mock list
    bus1 = create_bus("IntrCity SmartBus", "TS-10-A-1111", "AC Sleeper (2+1)", "AC, WiFi, Charging Point", 4.8)
    bus2 = create_bus("GRT Trans", "TN-42-AT-8007", "AC Multiaxle Sleeper (2+1)", "Toilet, Helpful Staff", 4.5)
    bus3 = create_bus("Sri Krishna Travels", "AP-29-X-1234", "AC Sleeper (2+1)", "AC, WiFi, Blankets", 4.9)
    bus4 = create_bus("Lahari Travels", "TS-09-Y-9876", "Non-AC Seater (2+2)", "Reading Light", 4.2)
    bus5 = create_bus("Morning Star Travels", "KA-01-Z-5555", "AC Semi-Sleeper", "AC, WiFi, Movie", 4.5)
    bus6 = create_bus("Kaveri Travels", "MH-12-W-7777", "AC Sleeper (2+1)", "AC, Snacks", 4.9)
    bus7 = create_bus("VRL Travels", "KA-25-C-8888", "AC Seater (2+2)", "AC, Charging Point", 4.4)
    bus8 = create_bus("SRS Travels", "KA-01-F-9999", "Non-AC Seater/Sleeper (2+1)", "Charging Point", 4.1)
    bus9 = create_bus("Orange Tours", "TS-11-E-2222", "AC Multiaxle Sleeper (2+1)", "AC, WiFi, Snacks", 4.7)
    bus10 = create_bus("Neeta Travels", "MH-01-AB-3333", "AC Seater (2+2)", "AC, Movie", 4.3)
    bus11 = create_bus("Jabbar Travels", "AP-09-CD-4444", "Non-AC Seater (2+2)", "Water Bottle", 3.9)
    bus12 = create_bus("Kaleswari Travels", "TS-07-EF-5555", "AC Sleeper (2+1)", "AC, Blankets", 4.6)
    
    # 4. Create Schedules
    today = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    def create_schedule(route, bus, dep_hour, dep_minute, dur_mins, base_fare, day_offset):
        target_day = today + datetime.timedelta(days=day_offset)
        dep_time = target_day + datetime.timedelta(hours=dep_hour, minutes=dep_minute)
        arr_time = dep_time + datetime.timedelta(minutes=dur_mins)
        
        # Avoid duplicate schedules
        sch = db.query(models.BusSchedule).filter(
            models.BusSchedule.route_id == route.id,
            models.BusSchedule.bus_id == bus.id,
            models.BusSchedule.departure_time == dep_time
        ).first()
        
        if not sch:
            sch = models.BusSchedule(
                route_id=route.id,
                bus_id=bus.id,
                journey_date=target_day,
                departure_time=dep_time,
                arrival_time=arr_time,
                base_fare=base_fare
            )
            db.add(sch)
            db.commit()

    # Create schedules for next 7 days
    for i in range(7):
        # Create schedules for HYD -> BLR
        create_schedule(route_hyd_blr, bus1, 22, 30, 455, 1450, i)
        create_schedule(route_hyd_blr, bus2, 18, 25, 520, 1615, i)
        create_schedule(route_hyd_blr, bus3, 19, 30, 750, 1450, i)
        create_schedule(route_hyd_blr, bus4, 21, 0, 750, 850, i)
        create_schedule(route_hyd_blr, bus5, 22, 15, 765, 1200, i)
        create_schedule(route_hyd_blr, bus6, 23, 30, 750, 1600, i)
        create_schedule(route_hyd_blr, bus7, 6, 0, 600, 950, i)
        create_schedule(route_hyd_blr, bus8, 14, 30, 540, 1050, i)
        create_schedule(route_hyd_blr, bus9, 20, 0, 660, 1850, i)
        create_schedule(route_hyd_blr, bus10, 9, 15, 630, 1100, i)
        create_schedule(route_hyd_blr, bus11, 12, 0, 630, 700, i)
        create_schedule(route_hyd_blr, bus12, 21, 45, 630, 1550, i)
        
        # Create schedules for HYD -> GOA
        create_schedule(route_hyd_goa, bus1, 22, 30, 630, 1450, i)
        create_schedule(route_hyd_goa, bus2, 18, 25, 630, 1615, i)
        create_schedule(route_hyd_goa, bus3, 19, 30, 630, 1450, i)
        create_schedule(route_hyd_goa, bus4, 21, 0, 630, 850, i)
        create_schedule(route_hyd_goa, bus5, 22, 15, 630, 1200, i)
        create_schedule(route_hyd_goa, bus6, 23, 30, 630, 1600, i)
        create_schedule(route_hyd_goa, bus7, 6, 0, 630, 950, i)
        create_schedule(route_hyd_goa, bus8, 14, 30, 630, 1050, i)
        create_schedule(route_hyd_goa, bus9, 20, 0, 630, 1850, i)
        create_schedule(route_hyd_goa, bus10, 9, 15, 630, 1100, i)
        create_schedule(route_hyd_goa, bus11, 12, 0, 630, 700, i)
        create_schedule(route_hyd_goa, bus12, 21, 45, 630, 1550, i)
        
    print("Database seeding completed successfully!")
    db.close()

if __name__ == "__main__":
    seed_database()
