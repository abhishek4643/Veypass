import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import RouteSearch from './pages/RouteSearch';
import SeatSelection from './pages/SeatSelection';
import Checkout from './pages/Checkout';
import MyPasses from './pages/MyPasses';
import Ticket from './pages/Ticket';
import SharedTicket from './pages/SharedTicket';
import Navbar from './components/Navbar';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-base text-white relative">
        {/* Animated background */}
        <div className="bg-animated" />
        <div className="grid-pattern fixed inset-0 z-0 pointer-events-none" />
        
        <div className="relative z-10">
          <Navbar />
          <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
            <Routes>
              <Route path="/" element={<Register />} />
              <Route path="/login" element={<Register />} />
              <Route path="/about" element={<LandingPage />} />
              <Route path="/register" element={<Register />} />
              <Route path="/routes" element={<RouteSearch />} />
              <Route path="/seats/:routeId/:busId" element={<SeatSelection />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/ticket" element={<Ticket />} />
              <Route path="/shared-ticket" element={<SharedTicket />} />
              <Route path="/my-passes" element={<MyPasses />} />
            </Routes>
          </main>
        </div>
        
        <Toaster 
          position="bottom-right" 
          toastOptions={{
            style: {
              background: 'rgba(15,20,35,0.95)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
              borderRadius: '12px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#00E5C7', secondary: '#0A0E1A' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;
