<div align="center">
  <img src="https://raw.githubusercontent.com/abhishek4643/Veypass/main/frontend/public/icons.svg" alt="Vegpass Logo" width="100"/>
  <br/>
  <h1>🎟️ VEGPASS</h1>
  <strong>Next-Generation Cloud-Based Transit Booking Platform</strong>
  <br/><br/>
  <i>A highly scalable, beautifully designed bus pass system engineered to prevent ticket fraud, automate dynamic pricing, and deliver a seamless passenger experience.</i>
  <br/><br/>

  <p>
    <a href="#features">Features</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a>
  </p>
</div>

---

## 🚀 The Vision

Traditional bus ticketing systems are plagued by lost paper tickets, ticket theft, manual verification bottlenecks, and static, inefficient pricing models. 

**Vegpass** solves this by completely digitizing the transit experience. By combining a highly responsive React frontend, a high-performance Python FastAPI backend, and an integrated **Machine Learning Dynamic Pricing Model**, Vegpass brings modern cloud infrastructure to daily commuting.

## ✨ Key Features

- 📱 **Offline-Ready Digital E-Tickets**: Secure, digitally signed QR codes that act as your boarding pass. Passengers can scan their tickets from any device, completely eliminating ticket loss and theft.
- 🧠 **AI-Powered Dynamic Pricing**: Integrates a Scikit-Learn Machine Learning model (`pricing_model.joblib`) to intelligently adjust ticket prices based on route distance, time of booking, and real-time demand.
- 🚄 **High-Performance Search & Booking**: Lightning-fast route discovery and interactive UI seat selection powered by React and Framer Motion.
- ☁️ **Cloud-Native Scalability**: Built to handle high traffic bursts. Database operations are ORM-managed (SQLAlchemy) and instantly compatible with Cloud PostgreSQL (Supabase).
- 🛡️ **Military-Grade Security**: JWT-based stateless authentication and Bcrypt password hashing protect user data and ensure ticket integrity.

---

## 🛠️ Tech Stack

### Frontend (Client)
- **React 18** & **Vite**
- **Tailwind CSS** (Utility-first styling)
- **Framer Motion** (Cinematic UI interactions)
- **Axios**, **React Router DOM**, & **Lucide Icons**
- **qrcode.react** (Client-side QR generation)

### Backend (Server)
- **Python 3** & **FastAPI** (High-performance Async APIs)
- **SQLAlchemy** (Robust Object Relational Mapping)
- **Supabase (PostgreSQL)** (Cloud-hosted relational database)
- **Scikit-Learn** & **Joblib** (Machine Learning integration)
- **PyJWT** & **Passlib** (Authentication & Cryptography)

---

## 💻 Getting Started (Local Development)

Vegpass is designed to be incredibly easy to spin up locally. 

### 1. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # (Windows) or source venv/bin/activate (Mac/Linux)
pip install -r requirements.txt
```
*Create a `.env` file in the backend directory:*
```env
DATABASE_URL="sqlite:///./veypass.db" # Or your Supabase PostgreSQL URL
SECRET_KEY="yoursupersecretkey"
```
*Start the server:*
```bash
python seed.py # (Optional: Seeds the database with sample routes)
uvicorn main:app --host 0.0.0.0 --port 10000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
```
*Create a `.env` file in the frontend directory:*
```env
VITE_API_URL="http://127.0.0.1:10000/api"
```
*Start the UI:*
```bash
npm run dev
```

---

<div align="center">
  <i>Built with ❤️ for the Hackathon.</i>
</div>
