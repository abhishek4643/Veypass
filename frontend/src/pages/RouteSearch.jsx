import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { 
  Search, MapPin, ArrowRight, TrendingUp, Flame, ArrowLeftRight, 
  Calendar, Users, Filter, SlidersHorizontal, Star, Clock, 
  Wifi, Zap, Wind, Coffee, AlertCircle, ChevronDown, ShieldCheck,
  Award, Sparkles, Map, Bell, Ticket, HeartHandshake, Lightbulb, Tag,
  Armchair, Bed, Snowflake, Check, Sunrise, Sun, Sunset, Moon,
  BadgeCheck, Banknote, Radio, CloudSun
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RouteSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Search Form State
  const [origin, setOrigin] = useState(searchParams.get('origin') || '');
  const [destination, setDestination] = useState(searchParams.get('destination') || '');
  const [date, setDate] = useState(searchParams.get('date') || new Date().toISOString().split('T')[0]);
  const [passengers, setPassengers] = useState(parseInt(searchParams.get('passengers') || '1'));

  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!(searchParams.get('origin') && searchParams.get('destination')));
  const [showTrackerModal, setShowTrackerModal] = useState(false);
  const [error, setError] = useState(null);

  // Filter State
  const [filters, setFilters] = useState({
    departure: [],
    busType: [],
    price: [],
    amenities: [],
    rating: [],
    availability: [],
    partners: [],
    boarding: [],
    dropping: []
  });
  const [maxPrice, setMaxPrice] = useState(9999);
  const [expandedDropdown, setExpandedDropdown] = useState(null); // 'partner', 'boarding', 'dropping'
  const [sortBy, setSortBy] = useState('Recommended');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  useEffect(() => {
    if (searchParams.get('origin') && searchParams.get('destination')) {
      fetchRoutes(true);
    }
  }, []);

  const fetchRoutes = async (fromUrl = false) => {
    if (!origin || !destination) return;
    
    setLoading(true);
    setError(null);
    setHasSearched(true);
    
    try {
      const params = new URLSearchParams();
      const searchOrigin = fromUrl ? searchParams.get('origin') : origin;
      const searchDest = fromUrl ? searchParams.get('destination') : destination;
      const searchDate = fromUrl ? searchParams.get('date') : date;
      
      if (searchOrigin) params.append('origin', searchOrigin);
      if (searchDest) params.append('destination', searchDest);
      if (searchDate) params.append('date', searchDate);
      
      const res = await api.get(`/routes?${params.toString()}`);
      if (res.data && res.data.length > 0) {
        setRoutes(res.data);
      } else {
        setRoutes([]);
      }
      if (!fromUrl) {
        setSearchParams({ origin, destination, date, passengers: passengers.toString() });
      }
    } catch (err) {
      console.error(err);
      setError("Unable to load buses");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => fetchRoutes(false);

  const handleSwap = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  const toggleFilter = (category, value) => {
    setFilters(prev => {
      const current = prev[category];
      if (current.includes(value)) {
        return { ...prev, [category]: current.filter(v => v !== value) };
      }
      return { ...prev, [category]: [...current, value] };
    });
  };

  const clearFilters = () => {
    setFilters({ departure: [], busType: [], price: [], amenities: [], rating: [], availability: [], partners: [], boarding: [], dropping: [] });
    setMaxPrice(9999);
  };

  const activeFilterCount = Object.values(filters).reduce((acc, curr) => acc + curr.length, 0);

  // Data Formatting Helpers
  const getHour = (isoString) => new Date(isoString).getHours();
  const formatTime = (isoString) => new Date(isoString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const formatDuration = (minutes) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  const isNextDay = (dep, arr) => new Date(arr).getDate() !== new Date(dep).getDate();
  const getAmenityIcon = (am) => {
    const str = am.toLowerCase();
    if (str.includes("ac") || str.includes("cool")) return <Wind className="w-3.5 h-3.5" />;
    if (str.includes("charg")) return <Zap className="w-3.5 h-3.5" />;
    if (str.includes("wi-fi") || str.includes("wifi")) return <Wifi className="w-3.5 h-3.5" />;
    return <Coffee className="w-3.5 h-3.5" />;
  };

  const uniqueOperators = useMemo(() => {
    const ops = new Set(routes.map(r => r.operator));
    return Array.from(ops).sort();
  }, [routes]);

  const genericBoardingPoints = ["Main Bus Stand", "Highway Junction", "City Center", "Railway Station Road"];
  const genericDroppingPoints = ["Central Bus Terminal", "Toll Plaza", "University Gate", "Market Area"];

  // Filter & Sort Logic
  const filteredRoutes = useMemo(() => {
    return routes.filter(route => {
      const hr = getHour(route.departure_time);
      if (filters.departure.length > 0) {
        if (!filters.departure.some(f => {
          if (f === "Before 10 AM" && hr < 10) return true;
          if (f === "10 AM - 5 PM" && hr >= 10 && hr < 17) return true;
          if (f === "5 PM - 11 PM" && hr >= 17 && hr < 23) return true;
          if (f === "After 11 PM" && (hr >= 23 || hr < 4)) return true; // Handling late night
          return false;
        })) return false;
      }

      if (filters.busType.length > 0) {
        const type = route.bus_type.toLowerCase();
        if (!filters.busType.some(t => {
           if (t === "AC" && type.includes("ac") && !type.includes("non-ac")) return true;
           if (t === "Non-AC" && type.includes("non-ac")) return true;
           if (t === "Sleeper" && type.includes("sleeper") && !type.includes("semi")) return true;
           if (t === "Seater" && type.includes("seater")) return true;
           return false;
        })) return false;
      }

      if (filters.price.length > 0) {
        const p = route.dynamic_price;
        if (!filters.price.some(t => {
          if (t === "Under ₹500" && p < 500) return true;
          if (t === "₹500 - ₹1,000" && p >= 500 && p <= 1000) return true;
          if (t === "₹1,000 - ₹1,500" && p > 1000 && p <= 1500) return true;
          if (t === "₹1,500+" && p > 1500) return true;
          return false;
        })) return false;
      }

      if (filters.partners.length > 0) {
        if (!filters.partners.includes(route.operator)) return false;
      }

      return true;
    });
  }, [routes, filters]);

  const sortedRoutes = useMemo(() => {
    const arr = [...filteredRoutes];
    switch (sortBy) {
      case 'Cheapest': return arr.sort((a, b) => a.dynamic_price - b.dynamic_price);
      case 'Earliest Departure': return arr.sort((a, b) => new Date(a.departure_time) - new Date(b.departure_time));
      case 'Fastest': return arr.sort((a, b) => a.duration_minutes - b.duration_minutes);
      case 'Recommended':
      default: return arr.sort((a, b) => (b.rating * 100 - b.dynamic_price) - (a.rating * 100 - a.dynamic_price));
    }
  }, [filteredRoutes, sortBy]);

  const FilterCheckbox = ({ category, value }) => {
    const isActive = filters[category].includes(value);
    return (
      <label 
        className="flex items-center gap-3 py-2 cursor-pointer group select-none"
        onClick={() => toggleFilter(category, value)}
      >
        <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors border ${isActive ? 'bg-[#639922] border-[#639922]' : 'border-[#DCE5CF] group-hover:border-[#97C459] bg-white'}`}>
          {isActive && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
        </div>
        <span className={`text-sm font-semibold transition-colors ${isActive ? 'text-[#173404]' : 'text-[#6B7062] group-hover:text-[#3B6D11]'}`}>{value}</span>
      </label>
    );
  };

  // --- HOME VIEW ---
  if (!hasSearched) {
    return (
      <div className="min-h-screen flex flex-col relative -mt-8 bg-[#FBFDF7] font-sans text-[#20241C]">
        {/* Hero Section */}
        <div className="relative w-full h-[65vh] min-h-[480px] overflow-hidden">
          <div className="absolute inset-0">
            <motion.img 
              src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069&auto=format&fit=crop" 
              alt="Scenic Bus Journey" 
              className="w-full h-full object-cover origin-center"
              initial={{ scale: 1.25, x: '2%' }}
              animate={{ scale: 1, x: '0%' }}
              transition={{ duration: 3, ease: [0.25, 0.8, 0.25, 1] }}
            />
            {/* Elegant Gradient Overlay - Vegpass Theme */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#173404]/60 via-[#173404]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#FBFDF7] via-transparent to-[#173404]/30" />
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 -mt-16">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-[#C0DD97]/30 mb-6 shadow-xl"
            >
              <Sparkles className="w-4 h-4 text-[#97C459]" />
              <span className="text-sm font-medium text-[#EAF3DE] tracking-wider uppercase">The New Standard of Travel</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-7xl font-heading font-extrabold tracking-tight text-white mb-6 text-center drop-shadow-2xl"
            >
              Book Your Next <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#97C459] to-[#C0DD97]">Great Adventure.</span>
            </motion.h1>
          </div>
        </div>

        {/* Floating Search Bar (Ultra Premium Light Glass) */}
        <div className="max-w-[1200px] w-full mx-auto px-4 -mt-32 relative z-20">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-xl border border-[#DCE5CF] p-3 flex flex-col md:flex-row items-center relative overflow-hidden"
          >
            <div className="flex w-full flex-col md:flex-row items-center divide-y md:divide-y-0 md:divide-x divide-[#DCE5CF]">
              
              {/* Origin */}
              <label className="relative flex-1 w-full px-6 py-4 hover:bg-[#FBFDF7] transition-colors group cursor-text rounded-t-[1.5rem] md:rounded-l-[1.5rem] md:rounded-tr-none flex flex-col justify-center">
                <span className="text-[10px] text-[#6B7062] font-bold uppercase tracking-widest mb-1 block">Leaving From</span>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#97C459]/20 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-[#3B6D11]" />
                  </div>
                  <input 
                    type="text" 
                    value={origin}
                    onChange={e => setOrigin(e.target.value)}
                    placeholder="Select City"
                    className="w-full bg-transparent outline-none text-2xl font-bold text-[#20241C] placeholder:text-[#6B7062]/40 truncate"
                  />
                </div>
                {/* Swap Button */}
                <button 
                  type="button"
                  onClick={(e) => { e.preventDefault(); handleSwap(); }}
                  className="absolute -bottom-6 md:top-1/2 md:-bottom-auto left-1/2 md:left-auto md:-right-6 -translate-x-1/2 md:translate-x-0 md:-translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white border border-[#DCE5CF] flex items-center justify-center hover:bg-[#EAF3DE] shadow-md text-[#6B7062] hover:text-[#3B6D11] hover:scale-110 transition-all duration-300"
                >
                  <ArrowLeftRight className="w-5 h-5" />
                </button>
              </label>

              {/* Destination */}
              <label className="relative flex-1 w-full px-6 py-4 md:pl-10 hover:bg-[#FBFDF7] transition-colors group cursor-text flex flex-col justify-center">
                <span className="text-[10px] text-[#6B7062] font-bold uppercase tracking-widest mb-1 block">Going To</span>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#97C459]/20 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-[#3B6D11]" />
                  </div>
                  <input 
                    type="text" 
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    placeholder="Select City"
                    className="w-full bg-transparent outline-none text-2xl font-bold text-[#20241C] placeholder:text-[#6B7062]/40 truncate"
                  />
                </div>
              </label>

              {/* Date */}
              <label className="relative flex-1 w-full px-6 py-4 hover:bg-[#FBFDF7] transition-colors group cursor-pointer flex flex-col justify-center">
                <span className="text-[10px] text-[#6B7062] font-bold uppercase tracking-widest mb-1 block">Journey Date</span>
                <div className="flex items-center gap-4 relative">
                  <div className="w-8 h-8 rounded-full bg-[#97C459]/20 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-[#3B6D11]" />
                  </div>
                  <input 
                    type="date" 
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    onClick={(e) => e.target.showPicker && e.target.showPicker()}
                    className="w-full bg-transparent outline-none text-xl font-bold text-[#20241C] cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                </div>
              </label>
            </div>
            
            {/* Search Button */}
            <div className="w-full md:w-auto p-2">
              <button 
                onClick={handleSearch}
                className="w-full md:w-auto h-full min-h-[72px] bg-gradient-to-r from-[#97C459] to-[#639922] hover:from-[#C0DD97] hover:to-[#97C459] text-[#173404] font-extrabold text-lg px-12 rounded-[1.5rem] transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                Search
              </button>
            </div>
          </motion.div>

          {/* Elegant Offers Section */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-16 mb-24"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-heading font-extrabold text-[#20241C] flex items-center gap-3">
                <Tag className="w-6 h-6 text-[#639922]" /> Exclusive Offers
              </h2>
              <button className="text-sm font-bold text-[#639922] hover:text-[#3B6D11] transition-colors">View All</button>
            </div>
            
            <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide snap-x">
              
              {/* Offer 1 */}
              <div className="snap-start min-w-[340px] h-[160px] bg-white rounded-[24px] p-1 relative overflow-hidden group border border-[#DCE5CF] hover:border-[#97C459] transition-all cursor-pointer shadow-sm hover:shadow-md">
                 <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#EAF3DE] rounded-full blur-3xl group-hover:bg-[#C0DD97]/50 transition-all" />
                 <div className="w-full h-full bg-white rounded-[20px] p-6 flex flex-col justify-between">
                   <div className="flex justify-between items-start">
                     <div>
                       <p className="text-[10px] font-bold text-[#639922] uppercase tracking-widest mb-2">First Booking</p>
                       <p className="font-bold text-xl text-[#20241C] leading-tight">Save 20% on your <br/>first ride</p>
                     </div>
                     <div className="w-10 h-10 bg-[#EAF3DE] rounded-full flex items-center justify-center shrink-0 border border-[#DCE5CF]">
                        <Star className="w-5 h-5 text-[#3B6D11]" />
                     </div>
                   </div>
                   <div className="flex items-center justify-between border-t border-[#DCE5CF] pt-3 mt-2">
                     <span className="text-xs text-[#6B7062]">Use code</span>
                     <span className="text-sm font-bold text-[#3B6D11] bg-[#EAF3DE] px-3 py-1 rounded-md tracking-widest font-mono">FIRST20</span>
                   </div>
                 </div>
              </div>

              {/* Offer 2 */}
              <div className="snap-start min-w-[340px] h-[160px] bg-white rounded-[24px] p-1 relative overflow-hidden group border border-[#DCE5CF] hover:border-[#97C459] transition-all cursor-pointer shadow-sm hover:shadow-md">
                 <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#EAF3DE] rounded-full blur-3xl group-hover:bg-[#C0DD97]/50 transition-all" />
                 <div className="w-full h-full bg-white rounded-[20px] p-6 flex flex-col justify-between">
                   <div className="flex justify-between items-start">
                     <div>
                       <p className="text-[10px] font-bold text-[#639922] uppercase tracking-widest mb-2">Return Trip</p>
                       <p className="font-bold text-xl text-[#20241C] leading-tight">₹150 Cashback on <br/>return tickets</p>
                     </div>
                     <div className="w-10 h-10 bg-[#EAF3DE] rounded-full flex items-center justify-center shrink-0 border border-[#DCE5CF]">
                        <TrendingUp className="w-5 h-5 text-[#3B6D11]" />
                     </div>
                   </div>
                   <div className="flex items-center justify-between border-t border-[#DCE5CF] pt-3 mt-2">
                     <span className="text-xs text-[#6B7062]">Use code</span>
                     <span className="text-sm font-bold text-[#3B6D11] bg-[#EAF3DE] px-3 py-1 rounded-md tracking-widest font-mono">RETURN150</span>
                   </div>
                 </div>
              </div>

              {/* Offer 3 */}
              <div className="snap-start min-w-[340px] h-[160px] bg-white rounded-[24px] p-1 relative overflow-hidden group border border-[#DCE5CF] hover:border-[#97C459] transition-all cursor-pointer shadow-sm hover:shadow-md">
                 <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#EAF3DE] rounded-full blur-3xl group-hover:bg-[#C0DD97]/50 transition-all" />
                 <div className="w-full h-full bg-white rounded-[20px] p-6 flex flex-col justify-between">
                   <div className="flex justify-between items-start">
                     <div>
                       <p className="text-[10px] font-bold text-[#639922] uppercase tracking-widest mb-2">Premium Perks</p>
                       <p className="font-bold text-xl text-[#20241C] leading-tight">Free Cancellation <br/>on AC Buses</p>
                     </div>
                     <div className="w-10 h-10 bg-[#EAF3DE] rounded-full flex items-center justify-center shrink-0 border border-[#DCE5CF]">
                        <ShieldCheck className="w-5 h-5 text-[#3B6D11]" />
                     </div>
                   </div>
                   <div className="flex items-center justify-between border-t border-[#DCE5CF] pt-3 mt-2">
                     <span className="text-xs text-[#6B7062]">Status</span>
                     <span className="text-sm font-bold text-[#3B6D11] bg-[#EAF3DE] px-3 py-1 rounded-md tracking-wide">Auto-applied</span>
                   </div>
                 </div>
              </div>

              {/* Offer 4 */}
              <div className="snap-start min-w-[340px] h-[160px] bg-white rounded-[24px] p-1 relative overflow-hidden group border border-[#DCE5CF] hover:border-[#97C459] transition-all cursor-pointer shadow-sm hover:shadow-md">
                 <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#EAF3DE] rounded-full blur-3xl group-hover:bg-[#C0DD97]/50 transition-all" />
                 <div className="w-full h-full bg-white rounded-[20px] p-6 flex flex-col justify-between">
                   <div className="flex justify-between items-start">
                     <div>
                       <p className="text-[10px] font-bold text-[#639922] uppercase tracking-widest mb-2">Student Special</p>
                       <p className="font-bold text-xl text-[#20241C] leading-tight">Get 15% off with <br/>student ID</p>
                     </div>
                     <div className="w-10 h-10 bg-[#EAF3DE] rounded-full flex items-center justify-center shrink-0 border border-[#DCE5CF]">
                        <Award className="w-5 h-5 text-[#3B6D11]" />
                     </div>
                   </div>
                   <div className="flex items-center justify-between border-t border-[#DCE5CF] pt-3 mt-2">
                     <span className="text-xs text-[#6B7062]">Use code</span>
                     <span className="text-sm font-bold text-[#3B6D11] bg-[#EAF3DE] px-3 py-1 rounded-md tracking-widest font-mono">EDU15</span>
                   </div>
                 </div>
              </div>

              {/* Offer 5 */}
              <div className="snap-start min-w-[340px] h-[160px] bg-white rounded-[24px] p-1 relative overflow-hidden group border border-[#DCE5CF] hover:border-[#97C459] transition-all cursor-pointer shadow-sm hover:shadow-md">
                 <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#EAF3DE] rounded-full blur-3xl group-hover:bg-[#C0DD97]/50 transition-all" />
                 <div className="w-full h-full bg-white rounded-[20px] p-6 flex flex-col justify-between">
                   <div className="flex justify-between items-start">
                     <div>
                       <p className="text-[10px] font-bold text-[#639922] uppercase tracking-widest mb-2">Festive Season</p>
                       <p className="font-bold text-xl text-[#20241C] leading-tight">Flat ₹500 off on <br/>group bookings</p>
                     </div>
                     <div className="w-10 h-10 bg-[#EAF3DE] rounded-full flex items-center justify-center shrink-0 border border-[#DCE5CF]">
                        <Users className="w-5 h-5 text-[#3B6D11]" />
                     </div>
                   </div>
                   <div className="flex items-center justify-between border-t border-[#DCE5CF] pt-3 mt-2">
                     <span className="text-xs text-[#6B7062]">Use code</span>
                     <span className="text-sm font-bold text-[#3B6D11] bg-[#EAF3DE] px-3 py-1 rounded-md tracking-widest font-mono">FESTIVE5</span>
                   </div>
                 </div>
              </div>

            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // --- RESULTS VIEW ---
  return (
    <div className="min-h-screen flex flex-col relative -mt-8 bg-[#FBFDF7] font-sans text-[#20241C]">
      {/* Full screen background expansion to cover any dark mode gaps */}
      <div className="fixed inset-0 bg-[#FBFDF7] -z-10" />
      
      <div className="max-w-[1440px] w-full mx-auto px-4 py-8">
        {/* Top Search Bar (Compact) */}
      <div className="bg-white rounded-2xl mb-6 flex flex-col lg:flex-row gap-3 items-center z-20 relative shadow-sm border border-[#DCE5CF] p-3">
        <div className="flex flex-1 gap-2 w-full">
          <label className="relative flex-1 bg-[#FBFDF7] hover:bg-[#EAF3DE]/50 transition-colors rounded-xl border border-[#DCE5CF] overflow-hidden">
            <input type="text" value={origin} onChange={e=>setOrigin(e.target.value)} className="w-full bg-transparent outline-none py-3 px-4 text-sm font-bold text-[#20241C] placeholder:text-[#6B7062]/50" placeholder="From" />
          </label>
          <button type="button" onClick={(e) => { e.preventDefault(); handleSwap(); }} className="w-10 flex-shrink-0 bg-white rounded-xl border border-[#DCE5CF] flex items-center justify-center hover:bg-[#EAF3DE] text-[#6B7062] hover:text-[#3B6D11] transition-colors shadow-sm">
            <ArrowLeftRight className="w-4 h-4" />
          </button>
          <label className="relative flex-1 bg-[#FBFDF7] hover:bg-[#EAF3DE]/50 transition-colors rounded-xl border border-[#DCE5CF] overflow-hidden">
            <input type="text" value={destination} onChange={e=>setDestination(e.target.value)} className="w-full bg-transparent outline-none py-3 px-4 text-sm font-bold text-[#20241C] placeholder:text-[#6B7062]/50" placeholder="To" />
          </label>
        </div>
        <div className="flex gap-2 w-full lg:w-auto">
          <label className="relative bg-[#FBFDF7] hover:bg-[#EAF3DE]/50 transition-colors rounded-xl border border-[#DCE5CF] overflow-hidden flex-1 lg:w-40 cursor-pointer">
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} onClick={(e) => e.target.showPicker && e.target.showPicker()} className="w-full bg-transparent outline-none py-3 px-4 text-sm font-bold text-[#20241C] cursor-pointer" />
          </label>
          <label className="relative bg-[#FBFDF7] hover:bg-[#EAF3DE]/50 transition-colors rounded-xl border border-[#DCE5CF] overflow-hidden w-28 hidden sm:block">
            <select value={passengers} onChange={e=>setPassengers(parseInt(e.target.value))} className="w-full bg-transparent outline-none py-3 pl-4 pr-8 text-sm font-bold text-[#20241C] appearance-none cursor-pointer">
              {[1,2,3,4,5,6].map(n => <option key={n} value={n} className="bg-white">{n} Pass</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-[#6B7062] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </label>
          <button onClick={handleSearch} className="bg-gradient-to-r from-[#97C459] to-[#639922] hover:from-[#C0DD97] hover:to-[#97C459] text-[#173404] font-extrabold text-sm rounded-xl px-6 py-3 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2">
            <Search className="w-4 h-4" /> Modify
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start mt-8">
        
        {/* Left Sidebar: Filters */}
        <div className="w-full lg:w-64 shrink-0 bg-white rounded-2xl p-5 sticky top-24 border border-[#DCE5CF] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-heading font-bold uppercase tracking-wider text-[#6B7062]">Filters</h2>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs font-bold text-[#639922] hover:text-[#3B6D11] transition-colors">Clear All</button>
            )}
          </div>

          <div className="space-y-6">
            {/* Bus Type Buttons */}
            <div>
              <h3 className="text-[#6B7062] font-semibold mb-3">Bus Type</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'AC', icon: Snowflake, label: 'AC' },
                  { value: 'Non-AC', icon: Wind, label: 'Non-AC' },
                  { value: 'Sleeper', icon: Bed, label: 'Sleeper' },
                  { value: 'Seater', icon: Armchair, label: 'Seater' }
                ].map((type) => {
                  const isActive = filters.busType.includes(type.value);
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => toggleFilter('busType', type.value)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                        isActive 
                          ? 'bg-[#EAF3DE] border-[#97C459] text-[#173404] shadow-sm' 
                          : 'bg-[#FBFDF7] border-[#DCE5CF] text-[#6B7062] hover:border-[#97C459] hover:text-[#173404]'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-[#3B6D11]' : 'text-[#6B7062]'}`} />
                      <span className="text-xs font-bold">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Departure Time Buttons */}
            <div>
              <h3 className="text-[#6B7062] font-semibold mb-3">Departure Time</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'Before 10 AM', icon: Sunrise },
                  { value: '10 AM - 5 PM', icon: Sun },
                  { value: '5 PM - 11 PM', icon: Sunset },
                  { value: 'After 11 PM', icon: Moon }
                ].map((type) => {
                  const isActive = filters.departure.includes(type.value);
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => toggleFilter('departure', type.value)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                        isActive 
                          ? 'bg-[#F4F8FA] border-[#7F93A0] text-[#2C3E50] shadow-sm' 
                          : 'bg-white border-[#E0E7ED] text-[#6B7062] hover:border-[#A4B3C1]'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-[#2C3E50]' : 'text-[#7F93A0]'}`} />
                      <span className="text-[11px] font-bold">{type.value}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dropdowns */}
            <div className="space-y-3">
              {/* Bus Partner Dropdown */}
              <div className="bg-white border border-[#E0E7ED] rounded-xl overflow-hidden transition-all">
                <button 
                  onClick={() => setExpandedDropdown(expandedDropdown === 'partner' ? null : 'partner')}
                  className="w-full flex items-center justify-between p-3.5 text-sm font-semibold text-[#2C3E50] hover:bg-[#F4F8FA] transition-colors"
                >
                  <span>Bus Partner {filters.partners.length > 0 && `(${filters.partners.length})`}</span>
                  <ChevronDown className={`w-4 h-4 text-[#7F93A0] transition-transform ${expandedDropdown === 'partner' ? 'rotate-180' : ''}`} />
                </button>
                {expandedDropdown === 'partner' && (
                  <div className="p-3 border-t border-[#E0E7ED] max-h-48 overflow-y-auto custom-scrollbar bg-[#FBFDF7]">
                    <div className="space-y-1">
                      {uniqueOperators.map(op => (
                        <FilterCheckbox key={op} category="partners" value={op} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Boarding Point Dropdown */}
              <div className="bg-white border border-[#E0E7ED] rounded-xl overflow-hidden transition-all">
                <button 
                  onClick={() => setExpandedDropdown(expandedDropdown === 'boarding' ? null : 'boarding')}
                  className="w-full flex items-center justify-between p-3.5 text-sm font-semibold text-[#2C3E50] hover:bg-[#F4F8FA] transition-colors"
                >
                  <span>Boarding Point {filters.boarding.length > 0 && `(${filters.boarding.length})`}</span>
                  <ChevronDown className={`w-4 h-4 text-[#7F93A0] transition-transform ${expandedDropdown === 'boarding' ? 'rotate-180' : ''}`} />
                </button>
                {expandedDropdown === 'boarding' && (
                  <div className="p-3 border-t border-[#E0E7ED] max-h-48 overflow-y-auto custom-scrollbar bg-[#FBFDF7]">
                    <div className="space-y-1">
                      {genericBoardingPoints.map(pt => (
                        <FilterCheckbox key={pt} category="boarding" value={pt} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Dropping Point Dropdown */}
              <div className="bg-white border border-[#E0E7ED] rounded-xl overflow-hidden transition-all">
                <button 
                  onClick={() => setExpandedDropdown(expandedDropdown === 'dropping' ? null : 'dropping')}
                  className="w-full flex items-center justify-between p-3.5 text-sm font-semibold text-[#2C3E50] hover:bg-[#F4F8FA] transition-colors"
                >
                  <span>Dropping Point {filters.dropping.length > 0 && `(${filters.dropping.length})`}</span>
                  <ChevronDown className={`w-4 h-4 text-[#7F93A0] transition-transform ${expandedDropdown === 'dropping' ? 'rotate-180' : ''}`} />
                </button>
                {expandedDropdown === 'dropping' && (
                  <div className="p-3 border-t border-[#E0E7ED] max-h-48 overflow-y-auto custom-scrollbar bg-[#FBFDF7]">
                    <div className="space-y-1">
                      {genericDroppingPoints.map(pt => (
                        <FilterCheckbox key={pt} category="dropping" value={pt} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Price Range Checkboxes */}
            <div>
              <h3 className="text-[#6B7062] font-semibold mb-3">Price Range</h3>
              <div className="space-y-1">
                <FilterCheckbox category="price" value="Under ₹500" />
                <FilterCheckbox category="price" value="₹500 - ₹1,000" />
                <FilterCheckbox category="price" value="₹1,000 - ₹1,500" />
                <FilterCheckbox category="price" value="₹1,500+" />
              </div>
            </div>
          </div>
        </div>

        {/* Center: Results */}
        <div className="flex-1 min-w-0 w-full">
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-heading font-bold text-[#20241C] flex items-center gap-2">
                {origin} <ArrowRight className="w-5 h-5 text-[#6B7062]" /> {destination}
              </h1>
              <p className="text-sm font-semibold text-[#6B7062] mt-1">
                {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} • {sortedRoutes.length} Buses Found
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-[#6B7062]">Sort by:</span>
              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)}
                className="bg-white border border-[#DCE5CF] rounded-lg px-3 py-1.5 text-sm font-bold text-[#20241C] outline-none cursor-pointer shadow-sm hover:border-[#97C459]"
              >
                <option value="Recommended" className="bg-white text-[#20241C]">Recommended</option>
                <option value="Cheapest" className="bg-white text-[#20241C]">Cheapest</option>
                <option value="Earliest Departure" className="bg-white text-[#20241C]">Earliest Departure</option>
                <option value="Fastest" className="bg-white text-[#20241C]">Fastest</option>
              </select>
            </div>
          </div>

          {loading && (
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="glass-card p-6 h-[180px] animate-pulse bg-white/5 border border-white/5" />
              ))}
            </div>
          )}

          {error && !loading && (
            <div className="glass-card-static p-12 text-center border border-red-500/20 bg-red-500/5 rounded-2xl">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Unable to load buses</h2>
              <p className="text-white/60 mb-6 text-sm">There was an error communicating with the server. Please try again.</p>
              <button onClick={() => fetchRoutes(true)} className="btn-secondary !px-8">Retry</button>
            </div>
          )}

          {!loading && !error && sortedRoutes.length === 0 && (
            <div className="glass-card-static p-16 text-center border border-white/5 rounded-2xl">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-8 h-8 text-white/20" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">No buses found</h2>
              <p className="text-white/40 mb-8 max-w-sm mx-auto">We couldn't find any buses for this route matching your selected filters or date.</p>
              <button onClick={clearFilters} className="bg-white/10 hover:bg-white/20 text-white font-medium px-6 py-2.5 rounded-xl transition-colors">Clear All Filters</button>
            </div>
          )}

          {/* Bus Cards */}
          <div className="space-y-4">
            <AnimatePresence>
              {!loading && !error && sortedRoutes.map((route, idx) => {
                const depStr = formatTime(route.departure_time);
                const arrStr = formatTime(route.arrival_time);
                const isNext = isNextDay(route.departure_time, route.arrival_time);
                const surge = Math.max(0, route.dynamic_price - route.base_fare);
                const amenities = route.amenities ? route.amenities.split(',').map(s=>s.trim()) : [];
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    key={route.schedule_id}
                    className="relative bg-white border border-[#DCE5CF] hover:border-[#97C459] transition-all rounded-2xl overflow-hidden group shadow-sm hover:shadow-md"
                  >
                    {idx === 0 && sortBy === 'Recommended' && (
                      <div className="absolute top-0 left-0 bg-gradient-to-r from-[#EF9F27] to-[#D97706] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-br-lg z-10 flex items-center gap-1 shadow-sm">
                        <Award className="w-3 h-3" /> Top Pick
                      </div>
                    )}
                    
                    <div className="p-5">
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        
                        {/* Left Info: Operator & Timing */}
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-5">
                            <div>
                              <h3 className="text-lg font-bold text-[#173404] flex items-center gap-2">
                                {route.operator}
                              </h3>
                              <p className="text-[10px] font-bold text-[#6B7062] mt-1 uppercase tracking-widest">
                                {route.bus_number || 'TC-BUS'} • {route.bus_type}
                              </p>
                            </div>
                            {route.rating > 0 && (
                              <div className="flex items-center gap-1 bg-[#EAF3DE] text-[#3B6D11] px-2 py-1 rounded-md text-xs font-bold border border-[#C0DD97]">
                                <Star className="w-3 h-3 fill-current" /> {route.rating}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-4">
                            <div className="text-center md:text-left">
                              <p className="text-2xl font-heading font-bold text-[#20241C] tracking-tight">{depStr}</p>
                              <p className="text-xs text-[#6B7062] mt-1 font-semibold">{route.origin}</p>
                            </div>

                            <div className="flex-1 flex flex-col items-center px-2">
                              <p className="text-[11px] text-[#6B7062] mb-1 font-bold">{formatDuration(route.duration_minutes)}</p>
                              <div className="w-full flex items-center">
                                <div className="h-px bg-[#DCE5CF] flex-1 relative"><div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#97C459]" /></div>
                                <div className="h-px bg-[#DCE5CF] flex-1 relative"><div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#639922]" /></div>
                              </div>
                            </div>

                            <div className="text-center md:text-right">
                              <p className="text-2xl font-heading font-bold text-[#20241C] tracking-tight flex items-start justify-end gap-1">
                                {arrStr}
                                {isNext && <span className="text-[9px] text-[#EF9F27] font-bold bg-[#EF9F27]/10 px-1 rounded uppercase tracking-wider">Next Day</span>}
                              </p>
                              <p className="text-xs text-[#6B7062] mt-1 font-semibold">{route.destination}</p>
                            </div>
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="hidden md:block w-px bg-[#DCE5CF] shrink-0 my-2" />

                        {/* Right Info: Price & Action */}
                        <div className="flex flex-col justify-between items-end w-full md:w-48 shrink-0">
                          <div className="w-full">
                            <div className="flex justify-between items-center text-sm mb-1 text-[#6B7062] font-medium">
                              <span>Base Fare</span>
                              <span>₹{route.base_fare}</span>
                            </div>
                            {surge > 0 && (
                              <div className="flex justify-between items-center text-sm mb-2 text-[#A32D2D] font-medium">
                                <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider"><TrendingUp className="w-3 h-3" /> Demand</span>
                                <span>+₹{surge.toFixed(0)}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-end mt-3 pt-3 border-t border-[#DCE5CF]">
                              <span className="text-[10px] text-[#6B7062] font-bold uppercase tracking-widest">Total Fare</span>
                              <span className="text-2xl font-bold text-[#173404] tracking-tight">₹{route.dynamic_price.toFixed(0)}</span>
                            </div>
                          </div>

                          <div className="w-full mt-5">
                            <button 
                              onClick={() => navigate(`/seats/${route.schedule_id}/${route.bus_id}`, { state: { routeInfo: route } })}
                              disabled={route.available_seats === 0}
                              className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 ${route.available_seats === 0 ? 'bg-[#FBFDF7] text-[#6B7062] border border-[#DCE5CF] cursor-not-allowed' : 'bg-gradient-to-r from-[#97C459] to-[#639922] hover:from-[#C0DD97] hover:to-[#97C459] text-[#173404] hover:-translate-y-0.5 hover:shadow-lg'}`}
                            >
                              {route.available_seats === 0 ? 'SOLD OUT' : 'VIEW SEATS'}
                            </button>
                            <p className="text-center text-[10px] font-bold text-[#6B7062] mt-2 uppercase tracking-widest">
                              {route.available_seats} seats left
                            </p>
                          </div>
                        </div>

                      </div>
                    </div>
                    
                    {/* Bottom Amenities Bar */}
                    <div className="px-5 py-2.5 bg-[#FBFDF7] border-t border-[#DCE5CF] flex flex-wrap items-center gap-4">
                      {amenities.slice(0, 5).map((am, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-[#6B7062] font-bold">
                          {getAmenityIcon(am)} {am}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Sidebar: Premium Widgets */}
        <div className="hidden xl:block w-72 shrink-0 space-y-4 sticky top-24">
          
          {/* Widget 1: Vegpass Promise / Trust Badges */}
          <div className="bg-white p-5 rounded-2xl border border-[#DCE5CF] shadow-sm">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#6B7062] mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#639922]" /> The Vegpass Promise
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#EAF3DE] flex items-center justify-center shrink-0">
                  <BadgeCheck className="w-4 h-4 text-[#3B6D11]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#173404]">Zero Cancellation Fees</p>
                  <p className="text-xs text-[#6B7062] font-medium mt-0.5">Cancel up to 2 hours before departure.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#EAF3DE] flex items-center justify-center shrink-0">
                  <Banknote className="w-4 h-4 text-[#3B6D11]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#173404]">Instant Refunds</p>
                  <p className="text-xs text-[#6B7062] font-medium mt-0.5">Money back to your source in 5 minutes.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Widget 2: Live Bus Tracker Promo */}
          <div className="p-5 rounded-2xl border border-transparent shadow-md relative overflow-hidden bg-gradient-to-br from-[#173404] to-[#20241C] text-white">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-[#97C459]/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-[#639922]/20 rounded-full blur-2xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-start">
              <div className="bg-[#97C459] text-[#173404] text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-3 flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse" /> Live Now
              </div>
              <h3 className="text-lg font-heading font-bold mb-2">Track Your Ride</h3>
              <p className="text-xs text-[#DCE5CF] mb-4 font-medium leading-relaxed">
                Share your live bus location with family and never miss your boarding point.
              </p>
              <button 
                onClick={() => setShowTrackerModal(true)}
                className="text-xs font-bold text-[#173404] bg-white px-4 py-2 rounded-lg shadow hover:bg-[#FBFDF7] transition-colors flex items-center gap-2"
              >
                See How It Works <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Widget 3: Destination Weather */}
          <div className="bg-white p-5 rounded-2xl border border-[#DCE5CF] shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Sun className="w-24 h-24 text-[#EF9F27]" />
            </div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#6B7062] mb-3 flex items-center gap-2">
              <CloudSun className="w-4 h-4 text-[#EF9F27]" /> Destination Weather
            </h3>
            <p className="text-sm font-bold text-[#173404] mb-1">{destination || 'Your Destination'}</p>
            <div className="flex items-center gap-3 mt-3">
              <div className="text-3xl font-heading font-black text-[#20241C]">28°</div>
              <div>
                <p className="text-xs font-bold text-[#D97706] uppercase tracking-widest">Sunny</p>
                <p className="text-[10px] text-[#6B7062] font-medium">Perfect travel weather!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Live Tracker Explanation Modal */}
    <AnimatePresence>
      {showTrackerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#173404]/60 backdrop-blur-sm"
            onClick={() => setShowTrackerModal(false)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden border border-[#DCE5CF]"
          >
            <div className="bg-gradient-to-br from-[#97C459] to-[#639922] p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
                <Map className="w-24 h-24" />
              </div>
              <div className="w-16 h-16 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg relative z-10">
                <Radio className="w-8 h-8 text-[#639922] animate-pulse" />
              </div>
              <h2 className="text-2xl font-heading font-black text-[#173404] relative z-10">Vegpass Live Tracker</h2>
              <p className="text-[#173404]/80 text-sm font-bold mt-2 relative z-10">Never wonder where your bus is again.</p>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-[#EAF3DE] text-[#3B6D11] flex items-center justify-center font-bold shrink-0">1</div>
                <div>
                  <h4 className="text-[#173404] font-bold mb-1">Book Your Ticket</h4>
                  <p className="text-[#6B7062] text-sm">Once you book a Vegpass verified bus, a live tracking link is generated automatically.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-[#EAF3DE] text-[#3B6D11] flex items-center justify-center font-bold shrink-0">2</div>
                <div>
                  <h4 className="text-[#173404] font-bold mb-1">Get The SMS/WhatsApp</h4>
                  <p className="text-[#6B7062] text-sm">30 minutes before departure, we send you the exact GPS location of your bus.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-[#EAF3DE] text-[#3B6D11] flex items-center justify-center font-bold shrink-0">3</div>
                <div>
                  <h4 className="text-[#173404] font-bold mb-1">Share With Family</h4>
                  <p className="text-[#6B7062] text-sm">Forward the link to your loved ones so they can track your journey in real-time.</p>
                </div>
              </div>
              
              <button 
                onClick={() => setShowTrackerModal(false)}
                className="w-full bg-[#173404] hover:bg-[#20241C] text-white py-3 rounded-xl font-bold transition-colors shadow-lg mt-4"
              >
                Got It!
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  </div>
  );
}
