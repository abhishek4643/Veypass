import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bus, LogOut, Ticket, Settings, ScanLine, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const isLight = scrolled || isMenuOpen;

  useEffect(() => {
    setRole(localStorage.getItem('role'));
  }, [location]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setRole(null);
    setIsMenuOpen(false);
    navigate('/login');
  };

  const NavLink = ({ to, children, className = '' }) => {
    const isActive = location.pathname === to;
    return (
      <Link 
        to={to} 
        onClick={() => setIsMenuOpen(false)}
        className={`text-sm font-semibold transition-all duration-200 ${isActive ? 'text-[#639922]' : (isLight ? 'text-[#6B7062] hover:text-[#20241C]' : 'text-white/70 hover:text-white')} ${className}`}
      >
        {children}
      </Link>
    );
  };

  const NavLinks = () => (
    <>
      {!role ? (
        (location.pathname !== '/' && location.pathname !== '/login' && location.pathname !== '/register') && (
          <>
            <NavLink to="/login">Login</NavLink>
            <Link 
              to="/" 
              onClick={() => setIsMenuOpen(false)}
              className="btn-primary !py-2 !px-5 !text-sm"
            >
              Get Started
            </Link>
          </>
        )
      ) : (
        <>
          <NavLink to="/routes">
            <span className="flex items-center gap-1.5"><Bus className="w-4 h-4" /> Book</span>
          </NavLink>
          <NavLink to="/my-passes">
            <span className="flex items-center gap-1.5"><Ticket className="w-4 h-4" /> My Passes</span>
          </NavLink>
          <button 
            onClick={handleLogout} 
            className={`flex items-center gap-1.5 text-sm font-semibold transition cursor-pointer ${isLight ? 'text-[#A32D2D]/80 hover:text-[#A32D2D]' : 'text-red-400/80 hover:text-red-400'}`}
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </>
      )}
    </>
  );

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isLight ? 'bg-[#FBFDF7]/95 backdrop-blur-xl border-b border-[#DCE5CF] shadow-sm' : 'bg-transparent'}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link 
          to={!role ? "/" : role === 'admin' ? "/admin" : role === 'conductor' ? "/scanner" : "/routes"} 
          className="flex items-center gap-2.5 group z-50"
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${isLight ? 'bg-[#3B6D11]' : 'bg-[#97C459] group-hover:shadow-[0_0_20px_rgba(151,196,89,0.3)]'}`}>
            <Bus className={`w-4 h-4 ${isLight ? 'text-[#EAF3DE]' : 'text-[#173404]'}`} />
          </div>
          <span className={`font-heading font-bold text-xl tracking-wide transition-colors ${isLight ? 'text-[#173404]' : 'text-white'}`}>Veypass</span>
        </Link>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <NavLinks />
        </div>

        {/* Mobile Menu Button */}
        <button 
          className={`md:hidden p-2 transition z-50 ${isLight ? 'text-[#20241C]' : 'text-white'}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-16 left-0 w-full bg-[#FBFDF7] border-b border-[#DCE5CF] p-6 flex flex-col gap-5 md:hidden shadow-lg shadow-black/5"
            >
              <NavLinks />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
