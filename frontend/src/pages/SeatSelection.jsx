import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { User, Clock, ArrowRight, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SeatSelection() {
  const { routeId, busId } = useParams();
  const location = useLocation();
  const passedRouteInfo = location.state?.routeInfo;
  
  const [seats, setSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [routeInfo, setRouteInfo] = useState(passedRouteInfo || null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  
  // Point Selection State
  const [activeTab, setActiveTab] = useState('boarding'); // 'boarding' or 'dropping'
  const [selectedBoarding, setSelectedBoarding] = useState(null);
  const [selectedDropping, setSelectedDropping] = useState(null);
  
  const navigate = useNavigate();

  const getCityPoints = (city) => {
    const points = {
      hyderabad: [
        { id: 1, name: "KPHB", timeOffset: -45, desc: "Kukatpally Housing Board" },
        { id: 2, name: "Ameerpet", timeOffset: -20, desc: "Near Mythrivanam" },
        { id: 3, name: "MGBS", timeOffset: 0, desc: "Mahatma Gandhi Bus Station" },
        { id: 4, name: "LB Nagar", timeOffset: 30, desc: "Near Kamineni Hospital" },
        { id: 5, name: "Aramghar", timeOffset: 50, desc: "Aramghar Cross Roads" }
      ],
      bengaluru: [
        { id: 1, name: "Majestic", timeOffset: 0, desc: "Kempegowda Bus Station" },
        { id: 2, name: "Kalasi Palayam", timeOffset: 15, desc: "City Market Area" },
        { id: 3, name: "Madiwala", timeOffset: 45, desc: "Madiwala Police Station" },
        { id: 4, name: "Silk Board", timeOffset: 60, desc: "Central Silk Board Junction" },
        { id: 5, name: "Electronic City", timeOffset: 80, desc: "Toll Gate" }
      ]
    };
    
    const cityKey = city?.toLowerCase() || "";
    return points[cityKey] || [
      { id: 1, name: `${city || "City"} Bus Stand`, timeOffset: 0, desc: "Main Bus Terminus" },
      { id: 2, name: `Highway Junction`, timeOffset: 30, desc: "Bypass Road Toll Plaza" }
    ];
  };

  const formatPointTime = (timeStr, offsetMinutes) => {
    if (!timeStr) return "00:00";
    let date;
    if (timeStr.includes('T')) {
      date = new Date(timeStr);
    } else {
      const [h, m] = timeStr.split(':').map(Number);
      date = new Date(2000, 1, 1, h, m);
    }
    date.setMinutes(date.getMinutes() + offsetMinutes);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const fetchSeats = async () => {
    if (routeId.startsWith('demo-')) {
      const isSleeper = passedRouteInfo ? passedRouteInfo.bus_type.toLowerCase().includes('sleeper') : parseInt(routeId.split('-')[1]) % 2 !== 0; // Just alternating dummy types
      
      if (!passedRouteInfo) {
        setRouteInfo({
          origin: "Hyderabad", destination: "Bengaluru",
          operator: isSleeper ? "IntrCity SmartBus" : "GRT Trans",
          bus_type: isSleeper ? "AC Sleeper (2+1)" : "AC Seater (2+2)",
          departure_time: "22:30", arrival_time: "06:05", duration: "07h 35m",
          base_fare: isSleeper ? 1450 : 850
        });
      }

      // Generate dummy seats
      const baseFare = passedRouteInfo ? passedRouteInfo.base_fare : (isSleeper ? 1450 : 850);
      const hasUpper = true; // User requested all buses to have upper and lower
      const busTypeStrLocal = passedRouteInfo ? passedRouteInfo.bus_type.toLowerCase() : (isSleeper ? "ac sleeper" : "ac seater");
      
      const dummySeats = Array.from({ length: 36 }).map((_, i) => {
        const isBooked = Math.random() > 0.7;
        const seatNum = hasUpper ? `${i < 18 ? 'L' : 'U'}${i % 18 + 1}` : `${i + 1}`;
        
        // Determine if this specific seat will be rendered as a Sleeper
        const isUpperSeat = i >= 18;
        const isMixedLocal = busTypeStrLocal.includes('seater') && busTypeStrLocal.includes('sleeper');
        const isAllSleeperLocal = !isMixedLocal && busTypeStrLocal.includes('sleeper');
        const isAllSeaterLocal = !isMixedLocal && busTypeStrLocal.includes('seater');
        
        let isSeatSleeper = isAllSleeperLocal || isUpperSeat;
        const rowIndex = Math.floor((i % 18) / (isAllSeaterLocal && !isUpperSeat ? 5 : 6));

        if (!isUpperSeat && isMixedLocal) {
          isSeatSleeper = rowIndex === 2; // Bottom row in lower deck of mixed bus is sleeper
        } else if (!isUpperSeat && isAllSeaterLocal) {
          isSeatSleeper = false;
        } else if (isUpperSeat && isAllSeaterLocal) {
          // If it's an all-seater bus but forced to have an upper deck, the upper deck is also seaters
          isSeatSleeper = false;
        }

        const seatPrice = isSeatSleeper ? baseFare + 400 : baseFare;

        return {
          id: i + 1,
          seat_number: seatNum,
          is_booked: isBooked,
          price: isBooked ? null : seatPrice,
          is_female: isBooked && Math.random() > 0.7
        };
      });
      setSeats(dummySeats);
      return;
    }

    try {
      const res = await api.get(`/schedules/${routeId}/seats`);
      setSeats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSeats();
    if (!routeId.startsWith('demo-')) {
      const interval = setInterval(fetchSeats, 5000);
      return () => clearInterval(interval);
    }
  }, [routeId]);

  const handleSeatClick = async (seat) => {
    if (seat.is_booked) return;

    if (routeId.startsWith('demo-')) {
      setSelectedSeats(prev => 
        prev.find(s => s.id === seat.id)
          ? prev.filter(s => s.id !== seat.id)
          : [...prev, seat]
      );
      return;
    }

    if (seat.is_held && !selectedSeats.find(s => s.id === seat.id)) {
      toast.error("Seat is currently held by someone else");
      return;
    }

    // Check if already selected (deselect)
    const isSelected = selectedSeats.find(s => s.id === seat.id);
    if (isSelected) {
      setSelectedSeats(prev => prev.filter(s => s.id !== seat.id));
      return;
    }

    // Limit to 6 seats
    if (selectedSeats.length >= 6) {
      toast.error("You can only select up to 6 seats per booking");
      return;
    }

    try {
      const res = await api.post('/seats/hold', { 
        seat_id: seat.id,
        schedule_id: parseInt(routeId)
      });
      setSelectedSeats(prev => {
        if (prev.find(s => s.id === seat.id)) return prev;
        return [...prev, seat];
      });
      setLockedUntil(res.data.locked_until + 'Z');
      toast.success("Seat held for 5 minutes");
      fetchSeats();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to hold seat");
    }
  };

  const handleContinue = () => {
    if (selectedSeats.length === 0) return;
    
    // Get the exact boarding and dropping point objects
    const bpOptions = getCityPoints(routeInfo?.origin);
    const dpOptions = getCityPoints(routeInfo?.destination);
    
    const finalBoarding = bpOptions.find(p => p.id === selectedBoarding) || bpOptions[0];
    const finalDropping = dpOptions.find(p => p.id === selectedDropping) || dpOptions[0];

    navigate('/checkout', { 
      state: { 
        seats: selectedSeats, 
        routeInfo, 
        routeId, 
        busId,
        boardingPoint: {
          ...finalBoarding,
          time: formatPointTime(routeInfo?.departure_time, finalBoarding.timeOffset)
        },
        droppingPoint: {
          ...finalDropping,
          time: formatPointTime(routeInfo?.arrival_time, finalDropping.timeOffset)
        }
      } 
    });
  };

  const getSeatStyle = (seat) => {
    if (seat.is_booked) return "bg-[#f5f5f5] border-[#e0e0e0] text-[#a0a0a0] cursor-not-allowed opacity-50";
    if (seat.is_held && !selectedSeats.find(s => s.id === seat.id)) return "bg-orange-500/20 border-orange-500/40 text-orange-400/80 cursor-not-allowed opacity-80";
    if (selectedSeats.find(s => s.id === seat.id)) return "bg-[#EAF3DE] border-[#97C459] text-[#173404] shadow-md scale-105 z-10";
    return "bg-white border-[#DCE5CF] text-[#6B7062] hover:border-[#97C459] hover:text-[#173404]";
  };

  const getSeatPosition = (index) => {
    const col = index % 4;
    if (col === 0 || col === 3) return "Window";
    return "Aisle";
  };

  return (
    <div className="min-h-screen flex flex-col relative -mt-8 bg-[#FBFDF7] font-sans text-[#20241C] pb-12">
      <div className="fixed inset-0 bg-[#FBFDF7] -z-10" />
      
      <div className="max-w-6xl w-full mx-auto px-4 py-8">
        {routeInfo && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-[#DCE5CF] shadow-sm p-4 sm:p-6 rounded-2xl">
            <div>
              <h1 className="text-xl sm:text-2xl font-heading font-bold text-[#173404]">{routeInfo.origin} → {routeInfo.destination}</h1>
              <p className="text-[#6B7062] font-semibold text-sm mt-1">{routeInfo.operator} • {routeInfo.bus_type}</p>
              <p className="text-[#3B6D11] font-bold text-xs mt-1.5 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                {routeInfo.departure_time?.includes('T') ? new Date(routeInfo.departure_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div className="text-left md:text-right mt-2 md:mt-0">
              <p className="font-bold text-lg text-[#173404]">
                {routeInfo.departure_time?.includes('T') ? new Date(routeInfo.departure_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : routeInfo.departure_time} 
                {' — '} 
                {routeInfo.arrival_time?.includes('T') ? new Date(routeInfo.arrival_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : routeInfo.arrival_time}
              </p>
              <p className="text-[#6B7062] font-semibold text-xs">Total Duration: {routeInfo.duration || '9h 30m'}</p>
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex justify-between items-end border-b border-[#DCE5CF] pb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-[#173404] mb-2">Select Seats</h2>
            <p className="text-[#6B7062] font-medium text-sm">Click a seat to hold it for 5 minutes (Ghost Lock™)</p>
          </div>
          
          {/* Legend */}
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2 text-xs font-bold text-[#6B7062]"><div className="w-4 h-4 rounded bg-white border border-[#DCE5CF]" /> Available</div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#6B7062]"><div className="w-4 h-4 rounded bg-[#EAF3DE] border border-[#97C459]" /> Selected</div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#6B7062]"><div className="w-4 h-4 rounded bg-[#f5f5f5] border border-[#e0e0e0] opacity-50" /> Booked</div>
          </div>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Seat Map */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 bg-white border border-[#DCE5CF] shadow-sm rounded-2xl p-6 sm:p-8"
          >
          <div className="flex flex-col gap-8 max-w-4xl mx-auto justify-center">
              {/* Upper Deck (Only for Sleeper or Mixed) */}
              {(() => {
                const busTypeStr = routeInfo?.bus_type?.toLowerCase() || "";
                const isMixed = busTypeStr.includes('seater') && busTypeStr.includes('sleeper');
                const isAllSleeper = !isMixed && busTypeStr.includes('sleeper');
                const isAllSeater = !isMixed && busTypeStr.includes('seater');
                const hasUpperDeck = true; // User requested ALL buses to split into upper and lower

                const renderDeck = (isUpper, seatsArray) => {
                  const deckTitle = isUpper ? "Upper" : "Lower";
                  const isMixedLower = !isUpper && isMixed;
                  const isAllSeaterLower = !isUpper && isAllSeater;
                  
                  // Layout logic
                  const cols = isAllSeaterLower ? 5 : 6;
                  
                  return (
                    <div className="flex border border-[#DCE5CF] rounded-xl bg-[#F8F9FA] w-full overflow-hidden shadow-sm">
                      {/* Left Sidebar */}
                      <div className="w-12 sm:w-14 bg-[#F8F9FA] border-r border-[#DCE5CF] flex flex-col items-center justify-start py-6 shrink-0 relative">
                        {!isUpper && (
                          <div className="mb-8">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#A4B3C1]">
                              <circle cx="12" cy="12" r="10" />
                              <circle cx="12" cy="12" r="3" />
                              <line x1="12" y1="15" x2="12" y2="22" />
                              <line x1="9.5" y1="10.5" x2="3.5" y2="6.5" />
                              <line x1="14.5" y1="10.5" x2="20.5" y2="6.5" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1 flex items-center justify-center min-h-[100px]">
                          <span className="-rotate-90 text-sm sm:text-base font-semibold text-[#20241C] tracking-widest uppercase whitespace-nowrap">
                            {deckTitle}
                          </span>
                        </div>
                      </div>

                      {/* Seats Grid */}
                      <div className="flex-1 p-5 sm:p-8 overflow-x-auto custom-scrollbar">
                        <div className={`grid ${cols === 5 ? 'grid-cols-5' : 'grid-cols-6'} gap-3 sm:gap-4 min-w-[400px]`}>
                          {seatsArray.map((seat, i) => {
                            const rowIndex = Math.floor(i / cols);
                            let isSleeper = isAllSleeper || (isUpper && !isAllSeater);
                            let isAisle = false;

                            if (isMixedLower) {
                              isSleeper = rowIndex === 2; // Bottom row is sleeper
                              isAisle = rowIndex === 1;   // Aisle after second row
                            } else if (isAllSeater) {
                              isSleeper = false;
                              isAisle = rowIndex === 1;
                            } else {
                              // All Sleeper (Upper or Lower)
                              isAisle = rowIndex === 1;
                            }

                            const isSelected = !!selectedSeats.find(s => s.id === seat.id);

                            return (
                              <div key={seat.id} className={`relative group ${isAisle ? 'mb-6 sm:mb-10' : ''}`}>
                                <motion.button
                                  initial={false}
                                  animate={
                                    isSelected 
                                      ? { scale: [1, 1.15, 1.05], backgroundColor: '#EAF3DE', borderColor: '#97C459', color: '#173404' } 
                                      : { scale: 1, backgroundColor: seat.is_booked ? '#f5f5f5' : '#ffffff', borderColor: seat.is_booked ? '#e0e0e0' : '#DCE5CF', color: seat.is_booked ? '#a0a0a0' : '#6B7062' }
                                  }
                                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                  whileTap={!seat.is_booked ? { scale: 0.9 } : {}}
                                  onClick={() => handleSeatClick(seat)}
                                  className={`
                                    relative w-full ${isSleeper ? 'h-10 sm:h-12' : 'aspect-square max-w-[3rem] sm:max-w-[3.5rem] mx-auto'} rounded-lg border-2 flex flex-col items-center justify-center 
                                    font-bold text-[10px] sm:text-xs cursor-pointer overflow-hidden
                                    ${seat.is_booked ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#97C459] hover:shadow-md shadow-sm'}
                                    ${seat.is_female && seat.is_booked ? '!border-pink-300 !bg-pink-50 !text-pink-400' : ''}
                                    ${isSelected ? 'z-10 shadow-lg ring-4 ring-[#97C459]/20' : ''}
                                  `}
                                  disabled={seat.is_booked}
                                >
                                  {/* The pillow/backrest indicator on the right */}
                                  {isSleeper ? (
                                    <div className={`absolute right-0 inset-y-1 w-2 sm:w-2.5 rounded-l-md ${isSelected ? 'bg-[#639922]' : seat.is_booked && seat.is_female ? 'bg-pink-400' : 'bg-[#A4B3C1]'}`} />
                                  ) : (
                                    <div className={`absolute right-1 inset-y-1.5 w-1.5 rounded-full ${isSelected ? 'bg-[#639922]' : seat.is_booked && seat.is_female ? 'bg-pink-400' : 'bg-[#A4B3C1]'}`} />
                                  )}
                                  
                                  {/* Price or checkmark inside */}
                                  <span className="relative z-10 flex items-center justify-center">
                                    {isSelected ? (
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[#3B6D11]"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    ) : (
                                      seat.price ? `₹${seat.price}` : seat.seat_number
                                    )}
                                  </span>
                                </motion.button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                };

                return (
                  <>
                    {hasUpperDeck && renderDeck(true, seats.slice(18))}
                    {renderDeck(false, hasUpperDeck ? seats.slice(0, 18) : seats)}
                  </>
                );
              })()}
            </div>
          </motion.div>

          {/* Booking Sidebar (Boarding & Dropping Points like AbhiBus) */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full lg:w-[350px]"
          >
            <div className="bg-white border border-[#DCE5CF] shadow-sm rounded-2xl p-6 sticky top-24">
              <div className="flex gap-4 border-b border-[#DCE5CF] mb-5">
                <button 
                  onClick={() => setActiveTab('boarding')}
                  className={`pb-3 border-b-2 font-bold text-sm flex-1 text-center transition-colors ${activeTab === 'boarding' ? 'border-[#173404] text-[#173404]' : 'border-transparent text-[#6B7062] hover:text-[#173404]'}`}
                >
                  Boarding Point
                </button>
                <button 
                  onClick={() => setActiveTab('dropping')}
                  className={`pb-3 border-b-2 font-bold text-sm flex-1 text-center transition-colors ${activeTab === 'dropping' ? 'border-[#173404] text-[#173404]' : 'border-transparent text-[#6B7062] hover:text-[#173404]'}`}
                >
                  Dropping Point
                </button>
              </div>
              
              <div className="mb-6 space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {activeTab === 'boarding' && getCityPoints(routeInfo?.origin).map((point, idx) => (
                  <label key={point.id} className={`flex items-start gap-3 cursor-pointer p-3 border rounded-xl transition-colors ${selectedBoarding === point.id || (selectedBoarding === null && idx === 0) ? 'border-[#97C459] bg-[#EAF3DE]' : 'border-[#DCE5CF] hover:border-[#97C459]'}`}>
                    <input 
                      type="radio" 
                      name="boarding" 
                      className="mt-1 accent-[#639922]" 
                      checked={selectedBoarding === point.id || (selectedBoarding === null && idx === 0)}
                      onChange={() => setSelectedBoarding(point.id)}
                    />
                    <div>
                      <p className="text-sm font-bold text-[#173404]">{point.name} • <span className="text-[#639922]">{formatPointTime(routeInfo?.departure_time, point.timeOffset)}</span></p>
                      <p className="text-xs text-[#6B7062] font-medium mt-1">{point.desc}</p>
                    </div>
                  </label>
                ))}

                {activeTab === 'dropping' && getCityPoints(routeInfo?.destination).map((point, idx) => (
                  <label key={point.id} className={`flex items-start gap-3 cursor-pointer p-3 border rounded-xl transition-colors ${selectedDropping === point.id || (selectedDropping === null && idx === 0) ? 'border-[#97C459] bg-[#EAF3DE]' : 'border-[#DCE5CF] hover:border-[#97C459]'}`}>
                    <input 
                      type="radio" 
                      name="dropping" 
                      className="mt-1 accent-[#639922]" 
                      checked={selectedDropping === point.id || (selectedDropping === null && idx === 0)}
                      onChange={() => setSelectedDropping(point.id)}
                    />
                    <div>
                      <p className="text-sm font-bold text-[#173404]">{point.name} • <span className="text-[#639922]">{formatPointTime(routeInfo?.arrival_time || routeInfo?.departure_time, point.timeOffset)}</span></p>
                      <p className="text-xs text-[#6B7062] font-medium mt-1">{point.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {selectedSeats.length > 0 ? (
                <div className="border-t border-[#DCE5CF] pt-5">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <span className="text-[10px] font-bold text-[#6B7062] uppercase tracking-widest block mb-1">Selected Seats</span>
                      <span className="text-xl font-bold text-[#173404] truncate max-w-[150px]">{selectedSeats.map(s => s.seat_number).join(', ')}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-[#6B7062] uppercase tracking-widest block mb-1">Amount</span>
                      <span className="text-xl font-bold text-[#173404]">₹{selectedSeats.reduce((acc, s) => acc + (s.price || routeInfo?.base_fare || 750), 0)}</span>
                    </div>
                  </div>
                  
                  {/* Ghost Lock Timer */}
                  <div className="bg-[#EF9F27]/10 border border-[#EF9F27]/30 rounded-xl p-3 mb-5 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-[#D97706]">
                      <Clock className="w-4 h-4" />
                      <span className="font-bold text-xs uppercase tracking-wider">Reserved</span>
                    </div>
                    <span className="font-mono font-bold text-lg text-[#D97706]">
                      {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  
                  <button onClick={handleContinue} className="bg-gradient-to-r from-[#97C459] to-[#639922] hover:from-[#C0DD97] hover:to-[#97C459] text-[#173404] w-full font-extrabold text-sm rounded-xl px-6 py-3 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2">
                    Continue to Payment
                  </button>
                </div>
              ) : (
                <div className="border-t border-[#DCE5CF] pt-5 text-center py-6">
                  <p className="text-[#6B7062] font-semibold text-sm">Please select a seat to continue</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
