import pytest
from fastapi.testclient import TestClient
from main import app
from database import Base, engine, SessionLocal
import models
import auth
from seed import seed_db

client = TestClient(app)

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    seed_db()
    yield
    Base.metadata.drop_all(bind=engine)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert "status" in response.json()

def test_get_routes():
    response = client.get("/api/routes")
    assert response.status_code == 200
    assert len(response.json()) > 0
    
def test_full_booking_and_scan_flow():
    # 1. Login as passenger
    res = client.post("/api/auth/login", json={"email": "passenger@veypass.com", "password": "Passenger@123"})
    assert res.status_code == 200
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Hold seat
    res = client.post("/api/seats/hold", json={"seat_id": 1}, headers=headers)
    assert res.status_code == 200
    
    # 3. Book seat
    res = client.post("/api/bookings", json={"seat_id": 1, "route_id": 1, "bus_id": 1}, headers=headers)
    assert res.status_code == 200
    ticket = res.json()
    assert "jwt_token" in ticket
    jwt_token = ticket["jwt_token"]
    
    # 4. Login as conductor
    res = client.post("/api/auth/login", json={"email": "conductor@veypass.com", "password": "Conductor@123"})
    cond_token = res.json()["access_token"]
    cond_headers = {"Authorization": f"Bearer {cond_token}"}
    
    # 5. Scan ticket (valid)
    res = client.post("/api/tickets/scan", json={"jwt_token": jwt_token}, headers=cond_headers)
    assert res.status_code == 200
    
    # 6. Scan ticket again (invalid - already used)
    res = client.post("/api/tickets/scan", json={"jwt_token": jwt_token}, headers=cond_headers)
    assert res.status_code == 400
    
    # 7. Login as admin and verify chain
    res = client.post("/api/auth/login", json={"email": "admin@veypass.com", "password": "Admin@123"})
    admin_token = res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    res = client.get("/api/admin/verify-chain", headers=admin_headers)
    assert res.status_code == 200
    assert res.json()["chain_valid"] == True
