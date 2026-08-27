<div align="center">
  <img src="https://raw.githubusercontent.com/abhishek4643/Veypass/main/frontend/public/icons.svg" alt="Vegpass Logo" width="100"/>
  <br/>
  <h1>VEGPASS</h1>
  <strong>Next-Generation Transit Automation Platform</strong>
  <br/><br/>
  <i>An enterprise-grade, digitally integrated transit ecosystem engineered to eliminate ticket fraud, optimize seat occupancy via Machine Learning, and streamline the passenger lifecycle.</i>
  <br/><br/>
  <a href="#core-architecture">Architecture</a> •
  <a href="#platform-capabilities">Capabilities</a> •
  <a href="#technology-stack">Technology Stack</a> •
  <a href="#deployment--setup">Setup</a>
</div>

---

## Core Architecture

Vegpass transitions legacy bus ticketing systems into a secure, stateless, cloud-native application.

### The Passenger Flow
1. **Search & Intelligence:** The passenger queries routes. The FastAPI backend cross-references active schedules with a pre-trained Scikit-Learn Machine Learning model to calculate dynamic pricing based on realtime factors.
2. **Interactive Booking:** The React client renders an interactive 3D bus layout (via Framer Motion), allowing precise seat selection with instant visual feedback.
3. **Stateless Ticketing:** Upon booking, a JSON Web Token (JWT) is generated and embedded directly into a cryptographic QR Code. This QR code acts as a decentralized boarding pass.
4. **Offline Verification:** Conductors can scan the passenger's QR Code ticket offline; the ticket contains all necessary payload data to securely verify the passenger without relying on fragile network connections.

---

## Platform Capabilities

### Intelligent Ticket Cryptography
Traditional systems rely heavily on paper or easily forged screenshots. Vegpass generates dynamic QR codes that encrypt the Booking ID, Route, and Passenger information. The Conductor scanning module verifies the ticket signature locally, preventing any form of ticket duplication or theft.

### Algorithmic Dynamic Pricing
Static pricing leads to lost revenue on high-demand routes. Vegpass integrates a dedicated `pricing_model.joblib` data pipeline. Prices dynamically scale based on:
- Distance and journey duration
- Proximity to departure time
- Current seat occupancy metrics

### High-Fidelity User Experience
The user interface avoids traditional, clunky multi-step forms. It utilizes React-driven single-page architecture with localized state management. Animations are engineered to provide cinematic feedback during critical actions like seat selection and final payment processing.

---

## Technology Stack

### Client Architecture (Frontend)
- **Framework:** React 18 & Vite
- **Styling:** Tailwind CSS (Utility-first)
- **State & Routing:** React Router DOM
- **Animations:** Framer Motion
- **Cryptography:** qrcode.react (Client-side localized generation)

### Server Architecture (Backend)
- **Core Framework:** Python 3 & FastAPI
- **Data Modeling:** SQLAlchemy ORM & Pydantic
- **Database Engine:** PostgreSQL (Supabase Cloud-ready)
- **Machine Learning Engine:** Scikit-Learn & Joblib
- **Security:** PyJWT (Tokenization) & Passlib (Bcrypt Hashing)

---

## Deployment & Setup

The system is configured to decouple the frontend client from the backend API, allowing independent scaling.

### Local Initialization

**1. Backend Environment**
```bash
cd backend
python -m venv venv
# Activate virtual environment: venv\Scripts\activate (Windows)
pip install -r requirements.txt
```
Create a `.env` file containing your Supabase PostgreSQL connection string and Secret Key. Start the high-performance ASGI server:
```bash
python seed.py # (Optional: Initializes Database Schema)
uvicorn main:app --host 0.0.0.0 --port 10000
```

**2. Frontend Environment**
```bash
cd frontend
npm install
```
Create a `.env` file to map the client to the API:
```env
VITE_API_URL="http://127.0.0.1:10000/api"
```
Initiate the Vite development server:
```bash
npm run dev
```
