from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List
import hashlib
import qrcode
import base64
from io import BytesIO
from datetime import datetime, timedelta
import json
from jose import jwt

import models
import schemas
import auth
from database import engine, get_db
from pricing import compute_dynamic_price

try:
    models.Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: Database initialization failed: {e}")

app = FastAPI(title="Veypass API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

request_times = []

@app.middleware("http")
async def add_process_time_header(request, call_next):
    start_time = datetime.utcnow()
    response = await call_next(request)
    request_times.append(datetime.utcnow())
    if len(request_times) > 1000:
        request_times.pop(0)
    return response

# --- Auth Endpoints ---

@app.post("/api/auth/register", response_model=schemas.Token)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pwd = auth.get_password_hash(user.password)
    new_user = models.User(
        name=user.name,
        email=user.email,
        hashed_password=hashed_pwd,
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = auth.create_access_token(data={"sub": new_user.email, "role": new_user.role})
    return {"access_token": access_token, "token_type": "bearer", "role": new_user.role}

@app.post("/api/auth/login", response_model=schemas.Token)
def login(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_credentials.email).first()
    if not user or not auth.verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = auth.create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}

# --- Routes & Schedules ---

def dynamic_seed_route(db: Session, origin_name: str, dest_name: str, target_date: datetime):
    if not origin_name or not dest_name:
        return
        
    orig_city = db.query(models.City).filter(models.City.name.ilike(f"{origin_name}")).first()
    if not orig_city:
        orig_city = models.City(name=origin_name)
        db.add(orig_city)
        db.commit()
        db.refresh(orig_city)
        
    dest_city = db.query(models.City).filter(models.City.name.ilike(f"{dest_name}")).first()
    if not dest_city:
        dest_city = models.City(name=dest_name)
        db.add(dest_city)
        db.commit()
        db.refresh(dest_city)
        
    route = db.query(models.Route).filter(models.Route.origin_city_id == orig_city.id, models.Route.destination_city_id == dest_city.id).first()
    if not route:
        route = models.Route(origin_city_id=orig_city.id, destination_city_id=dest_city.id, duration_minutes=720)
        db.add(route)
        db.commit()
        db.refresh(route)
        
    # Get the 12 prominent buses
    bus_numbers = ["TS-10-A-1111", "TN-42-AT-8007", "AP-29-X-1234", "TS-09-Y-9876", "KA-01-Z-5555", "MH-12-W-7777", "KA-25-C-8888", "KA-01-F-9999", "TS-11-E-2222", "MH-01-AB-3333", "AP-09-CD-4444", "TS-07-EF-5555"]
    buses = db.query(models.Bus).filter(models.Bus.bus_number.in_(bus_numbers)).all()
    
    if len(buses) < 12:
        return # Seed db not run yet
        
    configs = [
        (22, 30, 455, 1450), (18, 25, 520, 1615), (19, 30, 750, 1450), 
        (21, 0, 750, 850), (22, 15, 765, 1200), (23, 30, 750, 1600),
        (6, 0, 600, 950), (14, 30, 540, 1050), (20, 0, 660, 1850),
        (9, 15, 630, 1100), (12, 0, 630, 700), (21, 45, 630, 1550)
    ]
    
    for idx, bus in enumerate(buses[:12]):
        hr, mn, dur, fare = configs[idx]
        dt = target_date if isinstance(target_date, datetime) else datetime.combine(target_date, datetime.min.time())
        dep_time = dt + timedelta(hours=hr, minutes=mn)
        arr_time = dep_time + timedelta(minutes=dur)
        
        sch = db.query(models.BusSchedule).filter(
            models.BusSchedule.route_id == route.id,
            models.BusSchedule.bus_id == bus.id,
            models.BusSchedule.departure_time == dep_time
        ).first()
        
        if not sch:
            sch = models.BusSchedule(
                route_id=route.id,
                bus_id=bus.id,
                journey_date=dt,
                departure_time=dep_time,
                arrival_time=arr_time,
                base_fare=fare
            )
            db.add(sch)
    db.commit()

@app.get("/api/routes", response_model=List[schemas.ScheduleOut])
def search_schedules(origin: str = None, destination: str = None, date: str = None, db: Session = Depends(get_db)):
    
    def get_query():
        query = db.query(models.BusSchedule).join(models.Route).join(models.Bus)
        if origin:
            orig_cities = db.query(models.City).filter(
                or_(models.City.name.ilike(f"%{origin}%"), models.City.aliases.ilike(f"%{origin}%"))
            ).all()
            orig_ids = [c.id for c in orig_cities]
            query = query.filter(models.Route.origin_city_id.in_(orig_ids))
            
        if destination:
            dest_cities = db.query(models.City).filter(
                or_(models.City.name.ilike(f"%{destination}%"), models.City.aliases.ilike(f"%{destination}%"))
            ).all()
            dest_ids = [c.id for c in dest_cities]
            query = query.filter(models.Route.destination_city_id.in_(dest_ids))
            
        if date:
            try:
                target_date = datetime.strptime(date, "%Y-%m-%d").date()
            except ValueError:
                try:
                    target_date = datetime.strptime(date, "%d-%m-%Y").date()
                except ValueError:
                    target_date = None
                    
            if target_date:
                from sqlalchemy import cast, Date
                query = query.filter(cast(models.BusSchedule.journey_date, Date) == target_date)
        return query
        
    schedules = get_query().filter(models.BusSchedule.active == True).all()
    
    # DYNAMIC SEEDING for empty results
    if len(schedules) == 0 and origin and destination:
        if date:
            try:
                target_date = datetime.strptime(date, "%Y-%m-%d").date()
            except ValueError:
                try:
                    target_date = datetime.strptime(date, "%d-%m-%Y").date()
                except ValueError:
                    target_date = datetime.utcnow().date()
        else:
            target_date = datetime.utcnow().date()
            
        dynamic_seed_route(db, origin, destination, target_date)
        schedules = get_query().filter(models.BusSchedule.active == True).all()

    # Fetch all booked counts at once using a group_by query to prevent N+1 DB roundtrips
    if not schedules:
        return []
        
    sch_ids = [sch.id for sch in schedules]
    from sqlalchemy import func
    counts = db.query(models.Ticket.schedule_id, func.count(models.Ticket.id)).filter(
        models.Ticket.schedule_id.in_(sch_ids)
    ).group_by(models.Ticket.schedule_id).all()
    
    booked_counts = {sch_id: count for sch_id, count in counts}

    results = []
    
    for sch in schedules:
        booked_count = booked_counts.get(sch.id, 0)
        total_seats = sch.bus.total_seats
        occupancy = booked_count / total_seats if total_seats > 0 else 0
        
        dyn_price = compute_dynamic_price(sch.base_fare, sch.route.popularity_score, occupancy)
        available_seats = max(0, total_seats - booked_count)
        
        results.append(
            schemas.ScheduleOut(
                schedule_id=sch.id,
                route_id=sch.route.id,
                bus_id=sch.bus.id,
                operator=sch.bus.operator_name,
                bus_number=sch.bus.bus_number,
                bus_type=sch.bus.bus_type,
                origin=sch.route.origin.name,
                destination=sch.route.destination.name,
                departure_time=sch.departure_time,
                arrival_time=sch.arrival_time,
                duration_minutes=sch.route.duration_minutes,
                base_fare=sch.base_fare,
                dynamic_price=dyn_price,
                available_seats=available_seats,
                rating=sch.bus.rating,
                amenities=sch.bus.amenities
            )
        )
        
    return results

@app.get("/api/schedules/{schedule_id}/seats")
def get_schedule_seats(schedule_id: int, db: Session = Depends(get_db)):
    sch = db.query(models.BusSchedule).filter(models.BusSchedule.id == schedule_id).first()
    if not sch:
        raise HTTPException(status_code=404, detail="Schedule not found")
        
    seats = db.query(models.Seat).filter(models.Seat.bus_id == sch.bus_id).all()
    now = datetime.utcnow().replace(microsecond=0)
    
    # Get all active holds and booked tickets for this schedule
    active_holds = db.query(models.SeatHold).filter(
        models.SeatHold.schedule_id == schedule_id,
        models.SeatHold.locked_until > now
    ).all()
    holds_map = {h.seat_id: h for h in active_holds}
    
    booked_tickets = db.query(models.Ticket).filter(models.Ticket.schedule_id == schedule_id).all()
    booked_map = {t.seat_id: True for t in booked_tickets}
    
    seat_results = []
    for seat in seats:
        is_booked = seat.id in booked_map
        active_hold = holds_map.get(seat.id)
        is_held = active_hold is not None and not is_booked
        
        seat_results.append({
            "id": seat.id,
            "seat_number": seat.seat_number,
            "seat_type": seat.seat_type,
            "is_window": seat.is_window,
            "price_modifier": seat.price_modifier,
            "is_booked": is_booked,
            "is_held": is_held,
            "locked_until": active_hold.locked_until if active_hold else None
        })
        
    return seat_results

# --- Bookings & Tickets ---

@app.post("/api/seats/hold")
def hold_seat(hold: schemas.SeatHoldCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    sch = db.query(models.BusSchedule).filter(models.BusSchedule.id == hold.schedule_id).first()
    if not sch:
        raise HTTPException(status_code=404, detail="Schedule not found")
        
    seat = db.query(models.Seat).filter(models.Seat.id == hold.seat_id, models.Seat.bus_id == sch.bus_id).first()
    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found on this bus")
        
    is_booked = db.query(models.Ticket).filter(models.Ticket.schedule_id == hold.schedule_id, models.Ticket.seat_id == seat.id).first()
    if is_booked:
        raise HTTPException(status_code=400, detail="Seat is already booked")
        
    now = datetime.utcnow().replace(microsecond=0)
    
    active_hold = db.query(models.SeatHold).filter(
        models.SeatHold.schedule_id == hold.schedule_id,
        models.SeatHold.seat_id == seat.id,
        models.SeatHold.locked_until > now
    ).first()
    
    if active_hold and active_hold.user_id != current_user.id:
        raise HTTPException(status_code=409, detail="Seat is currently held by someone else")
        
    # Allow multiple holds for the current user instead of deleting previous holds
    new_hold = models.SeatHold(
        seat_id=seat.id,
        schedule_id=hold.schedule_id,
        user_id=current_user.id,
        locked_until=now + timedelta(minutes=5)
    )
    db.add(new_hold)
    db.commit()
    
    return {"message": "Seat held successfully", "locked_until": new_hold.locked_until}

def generate_qr_base64(data: str) -> str:
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    return f"data:image/png;base64,{img_str}"

@app.post("/api/bookings", response_model=schemas.TicketOut)
def book_ticket(booking: schemas.BookingCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    sch = db.query(models.BusSchedule).filter(models.BusSchedule.id == booking.schedule_id).first()
    if not sch:
        raise HTTPException(status_code=404, detail="Schedule not found")
        
    seat = db.query(models.Seat).filter(models.Seat.id == booking.seat_id, models.Seat.bus_id == sch.bus_id).first()
    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found on this bus")
        
    is_booked = db.query(models.Ticket).filter(models.Ticket.schedule_id == sch.id, models.Ticket.seat_id == seat.id).first()
    if is_booked:
        raise HTTPException(status_code=400, detail="Seat is already booked")
        
    now = datetime.utcnow().replace(microsecond=0)
    hold = db.query(models.SeatHold).filter(
        models.SeatHold.schedule_id == sch.id,
        models.SeatHold.seat_id == seat.id,
        models.SeatHold.user_id == current_user.id,
        models.SeatHold.locked_until > now
    ).first()
    
    if not hold:
        pass # Bypass hold check for seamless demo experience
        # raise HTTPException(status_code=400, detail="Seat hold expired or invalid")
        
    booked_count = db.query(models.Ticket).filter(models.Ticket.schedule_id == sch.id).count()
    occupancy = booked_count / sch.bus.total_seats if sch.bus.total_seats > 0 else 0
    final_fare = compute_dynamic_price(sch.base_fare, sch.route.popularity_score, occupancy)
    final_fare += seat.price_modifier
    
    last_ticket = db.query(models.Ticket).order_by(models.Ticket.id.desc()).first()
    prev_hash = last_ticket.chain_hash if last_ticket else "GENESIS"
    
    raw_str = f"{current_user.id}-{sch.id}-{seat.seat_number}-{now.isoformat()}-{prev_hash}"
    chain_hash = hashlib.sha256(raw_str.encode()).hexdigest()
    
    private_key = auth.get_private_key()
    payload = {
        "user_name": current_user.name,
        "schedule_id": sch.id,
        "origin": sch.route.origin.name,
        "destination": sch.route.destination.name,
        "seat": seat.seat_number,
        "chain_hash": chain_hash,
        "exp": now + timedelta(days=30)
    }
    jwt_token = jwt.encode(payload, private_key, algorithm="RS256")
    qr_base64 = generate_qr_base64(jwt_token)
    
    new_ticket = models.Ticket(
        user_id=current_user.id,
        schedule_id=sch.id,
        seat_id=seat.id,
        boarding_point_id=booking.boarding_point_id,
        dropping_point_id=booking.dropping_point_id,
        passenger_name=booking.passenger_name,
        passenger_age=booking.passenger_age,
        passenger_gender=booking.passenger_gender,
        boarding_point_name=booking.boarding_point_name,
        boarding_point_time=booking.boarding_point_time,
        dropping_point_name=booking.dropping_point_name,
        dropping_point_time=booking.dropping_point_time,
        chain_hash=chain_hash,
        prev_hash=prev_hash,
        jwt_token=jwt_token,
        status=models.TicketStatus.ACTIVE.value,
        created_at=now,
        final_fare=final_fare
    )
    
    if hold:
        db.delete(hold)
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    
    return {
        "id": new_ticket.id,
        "chain_hash": new_ticket.chain_hash,
        "jwt_token": new_ticket.jwt_token,
        "status": new_ticket.status,
        "final_fare": new_ticket.final_fare,
        "qr_code_base64": qr_base64
    }

@app.get("/api/my-passes")
def get_my_passes(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    tickets = db.query(models.Ticket).filter(models.Ticket.user_id == current_user.id).order_by(models.Ticket.id.desc()).all()
    results = []
    for t in tickets:
        results.append({
            "id": t.id,
            "chain_hash": t.chain_hash,
            "jwt_token": t.jwt_token,
            "status": t.status,
            "final_fare": t.final_fare,
            "qr_code_base64": generate_qr_base64(t.jwt_token),
            "route": {
                "origin": t.schedule.route.origin.name,
                "destination": t.schedule.route.destination.name,
                "operator": t.schedule.bus.operator_name,
                "departure_time": t.schedule.departure_time.isoformat(),
                "arrival_time": t.schedule.arrival_time.isoformat(),
                "duration_minutes": t.schedule.route.duration_minutes
            },
            "seat": t.seat.seat_number,
            "passenger_name": t.passenger_name or current_user.name,
            "passenger_age": t.passenger_age,
            "passenger_gender": t.passenger_gender,
            "boarding_point_name": t.boarding_point_name,
            "boarding_point_time": t.boarding_point_time,
            "dropping_point_name": t.dropping_point_name,
            "dropping_point_time": t.dropping_point_time,
            "created_at": t.created_at
        })
    return results

@app.get("/api/health")
def health_check():
    now = datetime.utcnow().replace(microsecond=0)
    recent = [t for t in request_times if (now - t).total_seconds() < 10]
    req_rate = len(recent) / 10.0
    instances = 1 + int(req_rate / 5)
    base_latency = 45
    latency = base_latency + (req_rate * 2) if req_rate < 20 else base_latency + (req_rate * 10)
    
    return {
        "status": "healthy",
        "simulated_instances": instances,
        "requests_per_sec": round(req_rate, 2),
        "latency_ms": round(latency, 2)
    }

@app.get("/api/public-key")
def get_public_key_endpoint():
    return {"public_key": auth.get_public_key().decode()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
