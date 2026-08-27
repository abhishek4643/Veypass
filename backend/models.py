from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Enum
from sqlalchemy.orm import relationship
import enum
from database import Base
import datetime

class RoleEnum(str, enum.Enum):
    passenger = "passenger"
    admin = "admin"
    conductor = "conductor"

class TicketStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    USED = "USED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default=RoleEnum.passenger.value)

# --- Locations ---

class Country(Base):
    __tablename__ = "countries"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    code = Column(String)

class State(Base):
    __tablename__ = "states"
    id = Column(Integer, primary_key=True, index=True)
    country_id = Column(Integer, ForeignKey("countries.id"))
    name = Column(String, index=True)
    type = Column(String) # STATE or UNION_TERRITORY
    
class City(Base):
    __tablename__ = "cities"
    id = Column(Integer, primary_key=True, index=True)
    state_id = Column(Integer, ForeignKey("states.id"))
    name = Column(String, index=True)
    aliases = Column(String, nullable=True)

class BusStation(Base):
    __tablename__ = "bus_stations"
    id = Column(Integer, primary_key=True, index=True)
    city_id = Column(Integer, ForeignKey("cities.id"))
    name = Column(String, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

# --- Routing and Schedules ---

class Route(Base):
    __tablename__ = "routes"
    id = Column(Integer, primary_key=True, index=True)
    origin_city_id = Column(Integer, ForeignKey("cities.id"))
    destination_city_id = Column(Integer, ForeignKey("cities.id"))
    distance_km = Column(Float, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    popularity_score = Column(Float, default=1.0)
    
    origin = relationship("City", foreign_keys=[origin_city_id])
    destination = relationship("City", foreign_keys=[destination_city_id])

class Bus(Base):
    __tablename__ = "buses"
    id = Column(Integer, primary_key=True, index=True)
    operator_name = Column(String)
    bus_number = Column(String, nullable=True)
    bus_type = Column(String)
    total_seats = Column(Integer, default=32)
    amenities = Column(String, nullable=True)
    rating = Column(Float, default=4.5)

class BusSchedule(Base):
    __tablename__ = "bus_schedules"
    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey("routes.id"))
    bus_id = Column(Integer, ForeignKey("buses.id"))
    journey_date = Column(DateTime)
    departure_time = Column(DateTime)
    arrival_time = Column(DateTime)
    base_fare = Column(Float)
    active = Column(Boolean, default=True)
    
    route = relationship("Route")
    bus = relationship("Bus")

# --- Seats and Bookings ---

class Seat(Base):
    __tablename__ = "seats"
    id = Column(Integer, primary_key=True, index=True)
    bus_id = Column(Integer, ForeignKey("buses.id"))
    seat_number = Column(String) # e.g. "A1"
    seat_type = Column(String, nullable=True) # SEATER, SLEEPER
    is_window = Column(Boolean, default=False)
    price_modifier = Column(Float, default=0.0)

class SeatHold(Base):
    __tablename__ = "seat_holds"
    id = Column(Integer, primary_key=True, index=True)
    seat_id = Column(Integer, ForeignKey("seats.id"))
    schedule_id = Column(Integer, ForeignKey("bus_schedules.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    locked_until = Column(DateTime)

class Ticket(Base):
    __tablename__ = "tickets"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    schedule_id = Column(Integer, ForeignKey("bus_schedules.id"))
    seat_id = Column(Integer, ForeignKey("seats.id"))
    
    boarding_point_id = Column(Integer, ForeignKey("bus_stations.id"), nullable=True)
    dropping_point_id = Column(Integer, ForeignKey("bus_stations.id"), nullable=True)
    
    passenger_name = Column(String, nullable=True)
    passenger_age = Column(Integer, nullable=True)
    passenger_gender = Column(String, nullable=True)
    
    boarding_point_name = Column(String, nullable=True)
    boarding_point_time = Column(String, nullable=True)
    dropping_point_name = Column(String, nullable=True)
    dropping_point_time = Column(String, nullable=True)
    
    chain_hash = Column(String, unique=True, index=True)
    prev_hash = Column(String)
    jwt_token = Column(String)
    status = Column(String, default=TicketStatus.ACTIVE.value)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    final_fare = Column(Float)
    
    schedule = relationship("BusSchedule")
    seat = relationship("Seat")

class Scan(Base):
    __tablename__ = "scans"
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"))
    conductor_id = Column(Integer, ForeignKey("users.id"))
    scanned_at = Column(DateTime, default=datetime.datetime.utcnow)

class PricingHistory(Base):
    __tablename__ = "pricing_history"
    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey("routes.id"))
    hour = Column(Integer)
    weekday = Column(Integer)
    occupancy_percent = Column(Float)
    demand_multiplier = Column(Float)
