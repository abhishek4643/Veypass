from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "passenger"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class CityOut(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True

class BusStationOut(BaseModel):
    id: int
    name: str
    latitude: Optional[float]
    longitude: Optional[float]
    
    class Config:
        from_attributes = True

class ScheduleOut(BaseModel):
    schedule_id: int
    route_id: int
    bus_id: int
    operator: str
    bus_number: Optional[str]
    bus_type: str
    origin: str
    destination: str
    departure_time: datetime
    arrival_time: datetime
    duration_minutes: int
    base_fare: float
    dynamic_price: float
    available_seats: int
    rating: float
    amenities: Optional[str]
    
    class Config:
        from_attributes = True

class SeatOut(BaseModel):
    id: int
    seat_number: str
    seat_type: Optional[str]
    is_window: bool
    price_modifier: float
    is_booked: bool
    is_held: bool
    locked_until: Optional[datetime] = None

    class Config:
        from_attributes = True

class SeatHoldCreate(BaseModel):
    seat_id: int
    schedule_id: int

class BookingCreate(BaseModel):
    seat_id: int
    schedule_id: int
    boarding_point_id: Optional[int] = None
    dropping_point_id: Optional[int] = None
    boarding_point_name: Optional[str] = None
    boarding_point_time: Optional[str] = None
    dropping_point_name: Optional[str] = None
    dropping_point_time: Optional[str] = None
    payment_method: Optional[str] = "Card"
    passenger_name: Optional[str] = None
    passenger_age: Optional[int] = None
    passenger_gender: Optional[str] = None

class TicketOut(BaseModel):
    id: int
    chain_hash: str
    jwt_token: str
    status: str
    final_fare: float
    qr_code_base64: Optional[str] = None

    class Config:
        from_attributes = True

class ScanRequest(BaseModel):
    jwt_token: str

class BatchScanRequest(BaseModel):
    jwt_tokens: List[str]
