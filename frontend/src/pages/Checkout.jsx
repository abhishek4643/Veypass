import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { ShieldCheck, Mail, Phone, MapPin, User, ArrowRight, Shield, CreditCard, Ticket, CheckCircle2, Tag, Star, TrendingUp, GraduationCap, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Checkout() {
  const { state } = useLocation();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [routeInfo, setRouteInfo] = useState(state?.routeInfo || null);
  const [seats, setSeats] = useState(state?.seats || []);
  
  // Form State
  const [contact, setContact] = useState({ phone: '', email: '' });
  const [passengers, setPassengers] = useState({});
  const [protectionPlan, setProtectionPlan] = useState(false);
  const [guaranteeOption, setGuaranteeOption] = useState('1.5x'); // '1.5x' or 'none'

  // Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('demo');
  const [paymentStep, setPaymentStep] = useState('select'); // 'select', 'upi', 'card', 'otp'
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);

  // Available Offers
  const availableCoupons = [
    { code: 'FIRST20', discount: 20, desc: 'Flat ₹20 off for your first ride' },
    { code: 'VEGPASS', discount: 50, desc: 'Launch special ₹50 off' },
    { code: 'SAVEMORE', discount: 100, desc: 'Save ₹100 on bulk bookings' }
  ];

  useEffect(() => {
    if (!state?.seats || state.seats.length === 0) {
      navigate(-1);
      return;
    }
    
    // Initialize passenger state
    const initialPassengers = {};
    state.seats.forEach(seat => {
      initialPassengers[seat.seat_number] = { name: '', age: '', gender: '' };
    });
    setPassengers(initialPassengers);
    setLoading(false);
  }, [state, navigate]);

  const handlePassengerChange = (seatNum, field, value) => {
    setPassengers(prev => ({
      ...prev,
      [seatNum]: { ...prev[seatNum], [field]: value }
    }));
  };

  const handlePayment = async () => {
    if (!contact.phone || !contact.email) {
      toast.error("Please provide your contact details.");
      return;
    }
    
    for (const seatNum of Object.keys(passengers)) {
      const p = passengers[seatNum];
      if (!p.name || !p.age || !p.gender) {
        toast.error(`Please complete all details for seat ${seatNum}.`);
        return;
      }
    }

    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setShowPaymentModal(true);
    }, 800);
  };

  const handleProceedPayment = () => {
    if (selectedPayment === 'upi') setPaymentStep('upi');
    else if (selectedPayment === 'card') setPaymentStep('card');
    else processDemoPayment();
  };

  const processDemoPayment = () => {
    setIsSimulatingPayment(true);
    setTimeout(() => {
      setIsSimulatingPayment(false);
      setShowPaymentModal(false);
      setPaymentStep('select');
      setShowConfirmModal(true);
    }, 2000);
  };

  const handleFinalConfirm = async () => {
    if (isConfirming) return;
    setIsConfirming(true);
    try {
      if (!routeInfo?.schedule_id || String(routeInfo.schedule_id).startsWith('demo-')) {
        // Fallback for Demo Flow
        navigate('/ticket', {
          state: {
            routeInfo,
            seats,
            passengers,
            contact,
            totalAmount,
            bookingId: 'VP-' + Math.floor(100000 + Math.random() * 900000)
          }
        });
        return;
      }

      // Loop over seats and generate real tickets via the backend
      const bookingPromises = seats.map(seat => {
        const p = passengers[seat.seat_number] || {};
        return api.post('/bookings', {
          schedule_id: routeInfo.schedule_id,
          seat_id: seat.id,
          boarding_point_id: null,
          dropping_point_id: null,
          boarding_point_name: state.boardingPoint?.name || null,
          boarding_point_time: state.boardingPoint?.time || null,
          dropping_point_name: state.droppingPoint?.name || null,
          dropping_point_time: state.droppingPoint?.time || null,
          passenger_name: p.name,
          passenger_age: parseInt(p.age) || null,
          passenger_gender: p.gender
        });
      });
      
      const responses = await Promise.all(bookingPromises);
      const tickets = responses.map(res => res.data);
      
      // Navigate to ticket page and pass all the booking data!
      navigate('/ticket', {
        state: {
          routeInfo,
          seats,
          passengers,
          contact,
          totalAmount,
          bookingId: 'VP-' + tickets[0].id,
          tickets: tickets, // Pass real tickets to the Ticket page
          boardingPoint: state.boardingPoint,
          droppingPoint: state.droppingPoint
        }
      });
    } catch (err) {
      const errorDetail = err.response?.data?.detail;
      const errorMessage = typeof errorDetail === 'string' 
        ? errorDetail 
        : Array.isArray(errorDetail) 
          ? errorDetail.map(e => `${e.loc?.join('.')}: ${e.msg}`).join(', ') 
          : err.message;
      toast.error('Failed to confirm booking: ' + errorMessage);
    } finally {
      setIsConfirming(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#FBFDF7] flex items-center justify-center">Loading...</div>;
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    if (timeStr.includes('T')) {
      const date = new Date(timeStr);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return timeStr;
  };

  // Calculate pricing
  const totalBaseFare = seats.reduce((acc, s) => acc + (s.price || routeInfo?.base_fare || 850), 0);
  const gst = totalBaseFare * 0.05;
  let totalAmount = totalBaseFare + gst;
  
  if (guaranteeOption === '1.5x') totalAmount += 69 * seats.length;
  if (protectionPlan) totalAmount += (12 * seats.length);
  
  totalAmount -= discount;

  return (
    <div className="min-h-screen bg-[#FBFDF7] py-10 px-4 md:px-8 font-sans text-[#20241C]">
      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row gap-8">
        
        {/* Left Column: Flow */}
        <div className="flex-1 min-w-0 space-y-8">
          
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-heading font-black tracking-tight mb-2">Complete your booking</h1>
            <p className="text-[#6B7062] text-sm font-medium">Almost there! Provide your details to secure your seats.</p>
          </motion.div>

          {/* Premium Trip Summary Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-[#173404] text-white rounded-[32px] p-8 relative overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#97C459]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-[#97C459]/20 text-[#97C459] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Trip Summary</span>
                  <span className="text-[#C0DD97] text-xs font-bold flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    {routeInfo?.departure_time?.includes('T') ? new Date(routeInfo.departure_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight mb-1">{routeInfo?.origin || 'Hyderabad'} <ArrowRight className="w-5 h-5 inline mx-2 text-[#97C459]" /> {routeInfo?.destination || 'Bengaluru'}</h2>
                <p className="text-[#DCE5CF] text-sm font-medium">{routeInfo?.operator || 'Premium Travels'} • {routeInfo?.bus_type || 'AC Seater/Sleeper'}</p>
              </div>
              
              <div className="flex flex-col items-start md:items-end bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10 w-full md:w-auto">
                <div className="flex items-center gap-4 w-full">
                  <div>
                    <p className="text-[10px] text-[#97C459] uppercase font-bold tracking-wider">Departure</p>
                    <p className="font-bold text-lg">{formatTime(routeInfo?.departure_time) || '17:00'}</p>
                  </div>
                  <div className="flex-1 border-t border-white/20 border-dashed relative mx-2">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] text-[#DCE5CF] font-medium bg-[#173404] px-2">{routeInfo?.duration || '13h 10m'}</div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-[#97C459] uppercase font-bold tracking-wider">Arrival</p>
                    <p className="font-bold text-lg">{formatTime(routeInfo?.arrival_time) || '06:10'}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Details */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-8 border border-[#DCE5CF] shadow-sm relative overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#EAF3DE] text-[#3B6D11] flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#173404]">Contact Details</h2>
                <p className="text-xs text-[#6B7062] font-medium mt-0.5">Your tickets will be sent here.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="group">
                <label className="text-[10px] font-bold text-[#6B7062] uppercase tracking-wider mb-2 block">Phone Number</label>
                <div className="flex items-center border border-[#DCE5CF] rounded-xl px-4 py-3 bg-[#FBFDF7] group-focus-within:border-[#97C459] group-focus-within:ring-2 ring-[#97C459]/20 transition-all">
                  <Phone className="w-4 h-4 text-[#A4B3C1] mr-3" />
                  <input 
                    type="tel" 
                    placeholder="Enter mobile number" 
                    className="w-full bg-transparent outline-none text-sm font-medium text-[#20241C] placeholder:text-[#A4B3C1]"
                    value={contact.phone}
                    onChange={e => setContact({...contact, phone: e.target.value})}
                  />
                </div>
              </div>
              <div className="group">
                <label className="text-[10px] font-bold text-[#6B7062] uppercase tracking-wider mb-2 block">Email Address</label>
                <div className="flex items-center border border-[#DCE5CF] rounded-xl px-4 py-3 bg-[#FBFDF7] group-focus-within:border-[#97C459] group-focus-within:ring-2 ring-[#97C459]/20 transition-all">
                  <Mail className="w-4 h-4 text-[#A4B3C1] mr-3" />
                  <input 
                    type="email" 
                    placeholder="Enter email address" 
                    className="w-full bg-transparent outline-none text-sm font-medium text-[#20241C] placeholder:text-[#A4B3C1]"
                    value={contact.email}
                    onChange={e => setContact({...contact, email: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Passenger Details */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl p-8 border border-[#DCE5CF] shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#EAF3DE] text-[#3B6D11] flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#173404]">Passenger Information</h2>
                <p className="text-xs text-[#6B7062] font-medium mt-0.5">Please fill details exactly as per Govt. ID</p>
              </div>
            </div>

            <div className="space-y-6">
              {seats.map((seat) => (
                <div key={seat.id} className="p-5 rounded-2xl bg-[#FBFDF7] border border-[#DCE5CF] flex flex-col lg:flex-row gap-5 lg:items-center relative overflow-hidden group hover:border-[#97C459] transition-colors">
                  {/* Seat Badge */}
                  <div className="bg-[#173404] text-white px-4 py-2 rounded-xl flex items-center gap-2 shrink-0 self-start lg:self-auto shadow-md">
                    <Ticket className="w-4 h-4 text-[#97C459]" />
                    <span className="font-bold text-sm tracking-widest">{seat.seat_number}</span>
                  </div>
                  
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-6">
                      <input 
                        type="text" 
                        placeholder="Full Name" 
                        className="w-full border-b border-[#DCE5CF] bg-transparent py-2 outline-none text-sm font-bold text-[#20241C] placeholder:text-[#A4B3C1] focus:border-[#97C459] transition-colors"
                        value={passengers[seat.seat_number]?.name || ''}
                        onChange={e => handlePassengerChange(seat.seat_number, 'name', e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <input 
                        type="number" 
                        placeholder="Age" 
                        className="w-full border-b border-[#DCE5CF] bg-transparent py-2 outline-none text-sm font-bold text-[#20241C] placeholder:text-[#A4B3C1] focus:border-[#97C459] transition-colors"
                        value={passengers[seat.seat_number]?.age || ''}
                        onChange={e => handlePassengerChange(seat.seat_number, 'age', e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-4 flex bg-white rounded-lg border border-[#DCE5CF] p-1 overflow-hidden shrink-0">
                      <button 
                        onClick={() => handlePassengerChange(seat.seat_number, 'gender', 'Male')}
                        className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all ${passengers[seat.seat_number]?.gender === 'Male' ? 'bg-[#173404] text-[#97C459] shadow' : 'text-[#6B7062] hover:bg-[#FBFDF7]'}`}
                      >
                        Male
                      </button>
                      <button 
                        onClick={() => handlePassengerChange(seat.seat_number, 'gender', 'Female')}
                        className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all ${passengers[seat.seat_number]?.gender === 'Female' ? 'bg-[#173404] text-[#97C459] shadow' : 'text-[#6B7062] hover:bg-[#FBFDF7]'}`}
                      >
                        Female
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Vegpass Assured Widget */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="bg-white rounded-3xl border border-[#DCE5CF] shadow-sm relative overflow-hidden"
          >
            {/* Header / Info Section */}
            <div className="p-8 pb-4">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#97C459] to-[#639922] text-[#173404] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-3 shadow-md">
                  <ShieldCheck className="w-4 h-4" /> Vegpass Assured
                </div>
                <h3 className="text-[#20241C] font-bold">Secure your trip <span className="text-[#6B7062] font-medium">only at ₹69</span></h3>
              </div>

              <div className="flex flex-col sm:flex-row justify-between mb-4 relative">
                <div className="hidden sm:block absolute top-1/2 bottom-0 left-1/2 w-px bg-[#DCE5CF] -translate-x-1/2" />
                
                <div className="flex-1 text-center py-4 sm:pr-4">
                  <h2 className="text-3xl font-black text-[#173404] tracking-tight mb-1">1.5x</h2>
                  <p className="text-[10px] font-bold text-[#6B7062] uppercase tracking-widest bg-[#EAF3DE] inline-block px-2 py-0.5 rounded mb-3">Refund</p>
                  <p className="text-sm font-bold text-[#20241C]">Travel Guarantee or 1.5x Refund</p>
                  <p className="text-xs text-[#6B7062] font-medium mt-1">if cancelled by operator</p>
                  
                  <div className="mt-4 pt-4 border-t border-[#DCE5CF]">
                    <p className="text-base font-black text-[#639922]">₹{Math.round(totalBaseFare * 1.5)}</p>
                    <p className="text-[10px] text-[#6B7062] font-bold uppercase tracking-wider">1.5x Refund</p>
                  </div>
                </div>

                <div className="flex-1 text-center py-4 sm:pl-4 border-t sm:border-t-0 border-[#DCE5CF]">
                  <h2 className="text-3xl font-black text-[#173404] tracking-tight mb-1">100%</h2>
                  <p className="text-[10px] font-bold text-[#6B7062] uppercase tracking-widest bg-[#EAF3DE] inline-block px-2 py-0.5 rounded mb-3">Money back</p>
                  <p className="text-sm font-bold text-[#20241C]">Money back Guarantee</p>
                  <p className="text-xs text-[#6B7062] font-medium mt-1">for delays or quality issues</p>
                  
                  <div className="mt-4 pt-4 border-t border-[#DCE5CF]">
                    <p className="text-base font-black text-[#639922]">₹{totalBaseFare}</p>
                    <p className="text-[10px] text-[#6B7062] font-bold uppercase tracking-wider">100% Refund</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Selection Options */}
            <div className="bg-[#FBFDF7] border-t border-[#DCE5CF]">
              <label 
                onClick={() => setGuaranteeOption('1.5x')}
                className={`flex items-center justify-between p-5 border-b border-[#DCE5CF] cursor-pointer transition-colors ${guaranteeOption === '1.5x' ? 'bg-[#EAF3DE]' : 'hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${guaranteeOption === '1.5x' ? 'border-[#639922]' : 'border-[#A4B3C1]'}`}>
                    {guaranteeOption === '1.5x' && <div className="w-2.5 h-2.5 rounded-full bg-[#639922]" />}
                  </div>
                  <span className="font-bold text-[#20241C] text-sm">Secure this booking only</span>
                </div>
                <span className="text-[10px] font-bold bg-[#639922] text-white px-2 py-0.5 rounded-full uppercase tracking-widest">Most Popular</span>
              </label>

              <label 
                onClick={() => setGuaranteeOption('none')}
                className={`flex items-center gap-4 p-5 cursor-pointer transition-colors ${guaranteeOption === 'none' ? 'bg-[#EAF3DE]' : 'hover:bg-gray-50'}`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${guaranteeOption === 'none' ? 'border-[#639922]' : 'border-[#A4B3C1]'}`}>
                  {guaranteeOption === 'none' && <div className="w-2.5 h-2.5 rounded-full bg-[#639922]" />}
                </div>
                <div>
                  <span className="font-bold text-[#20241C] text-sm block">No, I don't want this</span>
                  <span className="text-[11px] text-[#6B7062] font-medium block mt-0.5">Pay ₹{(totalBaseFare - 100).toFixed(2)} if you cancel or reschedule</span>
                </div>
              </label>
            </div>
          </motion.div>

          {/* Travel Protection Plan */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className={`rounded-3xl p-1 transition-all ${protectionPlan ? 'bg-gradient-to-r from-[#97C459] to-[#639922]' : 'bg-[#DCE5CF]'}`}
          >
            <div className="bg-white rounded-[22px] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer" onClick={() => setProtectionPlan(!protectionPlan)}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${protectionPlan ? 'bg-[#EAF3DE] text-[#3B6D11]' : 'bg-[#FBFDF7] text-[#A4B3C1] border border-[#DCE5CF]'}`}>
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-[#173404] text-lg">Travel Protection</h3>
                  <p className="text-xs text-[#6B7062] font-medium mt-0.5">Secure your trip for just <span className="font-bold text-[#173404]">₹12</span> per passenger</p>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#97C459]">{protectionPlan ? 'Added' : 'Recommended'}</span>
                <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${protectionPlan ? 'bg-[#173404] border-[#173404]' : 'bg-white border-[#A4B3C1]'}`}>
                  {protectionPlan && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Exclusive Offers (Horizontal Scroll) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="mt-8 relative z-10"
          >
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#639922]" />
                <h2 className="text-xl font-bold text-[#173404]">Exclusive Offers</h2>
              </div>
              <button 
                onClick={() => setShowOffersModal(true)}
                className="text-sm font-bold text-[#639922] hover:text-[#3B6D11] transition-colors"
              >
                View All
              </button>
            </div>
            
            <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <style dangerouslySetInnerHTML={{__html: `
                .hide-scrollbar::-webkit-scrollbar { display: none; }
              `}} />
              
              <div className="shrink-0 w-72 snap-start bg-white border border-[#DCE5CF] rounded-3xl p-5 shadow-sm hover:border-[#97C459] transition-colors relative cursor-pointer" onClick={() => { setCouponCode('FIRST20'); setDiscount(Math.min(totalBaseFare * 0.2, 100)); toast.success("Awesome! Coupon applied for 20% off."); }}>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-bold text-[#639922] uppercase tracking-widest">First Booking</span>
                  <div className="w-8 h-8 rounded-full bg-[#EAF3DE] flex items-center justify-center text-[#639922]">
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                </div>
                <h3 className="font-bold text-[#173404] text-lg mb-4 leading-tight">Save 20% on your first ride</h3>
                <div className="flex items-center justify-between pt-4 border-t border-[#DCE5CF] border-dashed">
                  <span className="text-xs text-[#6B7062] font-medium">Use code</span>
                  <span className="text-xs font-bold text-[#3B6D11] bg-[#EAF3DE] px-3 py-1 rounded-lg uppercase">FIRST20</span>
                </div>
              </div>
              
              <div className="shrink-0 w-72 snap-start bg-white border border-[#DCE5CF] rounded-3xl p-5 shadow-sm hover:border-[#97C459] transition-colors relative cursor-pointer" onClick={() => { setCouponCode('RETURN150'); setDiscount(150); toast.success("Awesome! Coupon applied for ₹150 off."); }}>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-bold text-[#639922] uppercase tracking-widest">Return Trip</span>
                  <div className="w-8 h-8 rounded-full bg-[#EAF3DE] flex items-center justify-center text-[#639922]">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="font-bold text-[#173404] text-lg mb-4 leading-tight">₹150 Cashback on return tickets</h3>
                <div className="flex items-center justify-between pt-4 border-t border-[#DCE5CF] border-dashed">
                  <span className="text-xs text-[#6B7062] font-medium">Use code</span>
                  <span className="text-xs font-bold text-[#3B6D11] bg-[#EAF3DE] px-3 py-1 rounded-lg uppercase">RETURN150</span>
                </div>
              </div>
              
              <div className="shrink-0 w-72 snap-start bg-white border border-[#DCE5CF] rounded-3xl p-5 shadow-sm hover:border-[#97C459] transition-colors relative cursor-pointer" onClick={() => { setCouponCode('FREE_AC'); toast.success("Awesome! Premium Perk auto-applied."); }}>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-bold text-[#639922] uppercase tracking-widest">Premium Perks</span>
                  <div className="w-8 h-8 rounded-full bg-[#EAF3DE] flex items-center justify-center text-[#639922]">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="font-bold text-[#173404] text-lg mb-4 leading-tight">Free Cancellation on AC Buses</h3>
                <div className="flex items-center justify-between pt-4 border-t border-[#DCE5CF] border-dashed">
                  <span className="text-xs text-[#6B7062] font-medium">Status</span>
                  <span className="text-xs font-bold text-[#3B6D11] bg-[#EAF3DE] px-3 py-1 rounded-lg">Auto-applied</span>
                </div>
              </div>
              
              <div className="shrink-0 w-72 snap-start bg-white border border-[#DCE5CF] rounded-3xl p-5 shadow-sm hover:border-[#97C459] transition-colors relative cursor-pointer" onClick={() => { setCouponCode('EDU10'); setDiscount(totalBaseFare * 0.1); toast.success("Awesome! Student discount applied for 10% off."); }}>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-bold text-[#639922] uppercase tracking-widest">Student</span>
                  <div className="w-8 h-8 rounded-full bg-[#EAF3DE] flex items-center justify-center text-[#639922]">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="font-bold text-[#173404] text-lg mb-4 leading-tight">Get 10% off with student ID</h3>
                <div className="flex items-center justify-between pt-4 border-t border-[#DCE5CF] border-dashed">
                  <span className="text-xs text-[#6B7062] font-medium">Use code</span>
                  <span className="text-xs font-bold text-[#3B6D11] bg-[#EAF3DE] px-3 py-1 rounded-lg uppercase">EDU10</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Fare Details Sidebar */}
        <div className="w-full xl:w-[380px] shrink-0">
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
            className="bg-white rounded-3xl shadow-xl shadow-[#173404]/5 border border-[#DCE5CF] sticky top-24 overflow-hidden"
          >
            <div className="p-8">
              <h2 className="text-xl font-bold text-[#173404] mb-6 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#97C459]" /> Fare Breakdown
              </h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-[#6B7062]">Base Fare ({seats.length} Seat{seats.length > 1 ? 's' : ''})</span>
                  <span className="text-sm font-black text-[#20241C]">₹{totalBaseFare.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-[#6B7062]">Taxes (GST)</span>
                  <span className="text-sm font-black text-[#20241C]">₹{gst.toFixed(2)}</span>
                </div>
                
                <AnimatePresence>
                  {guaranteeOption === '1.5x' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }} 
                      exit={{ opacity: 0, height: 0 }}
                      className="flex justify-between items-center overflow-hidden"
                    >
                      <span className="text-sm font-bold text-[#3B6D11] flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Vegpass Assured
                      </span>
                      <span className="text-sm font-black text-[#3B6D11]">₹{(69 * seats.length).toFixed(2)}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {protectionPlan && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }} 
                      exit={{ opacity: 0, height: 0 }}
                      className="flex justify-between items-center overflow-hidden"
                    >
                      <span className="text-sm font-bold text-[#3B6D11] flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Protection Plan
                      </span>
                      <span className="text-sm font-black text-[#3B6D11]">₹{(12 * seats.length).toFixed(2)}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mb-6 pt-6 border-t border-[#DCE5CF]">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Enter Coupon Code" 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 px-4 py-3 bg-[#FBFDF7] border border-[#DCE5CF] rounded-xl text-sm font-bold placeholder-[#A4B3C1] focus:outline-none focus:border-[#97C459]"
                  />
                  <button 
                    onClick={() => {
                      if (!couponCode) {
                        toast.error("Please enter a coupon code");
                        return;
                      }
                      
                      const offer = availableCoupons.find(c => c.code === couponCode);
                      if (offer) {
                        setDiscount(offer.discount);
                        toast.success(`Awesome! Coupon applied for ₹${offer.discount} off.`);
                      } else {
                        setDiscount(0);
                        toast.error("Coupon not applicable");
                      }
                    }}
                    className="px-5 bg-[#EAF3DE] text-[#3B6D11] hover:bg-[#97C459] hover:text-[#173404] font-bold text-sm rounded-xl transition-all"
                  >
                    Apply
                  </button>
                </div>
                
                {/* Removed vertical offers list in favor of new horizontal section */}
                <AnimatePresence>
                  {discount > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex justify-between items-center mt-4">
                      <span className="text-sm font-bold text-[#3B6D11] flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                        Coupon Discount
                      </span>
                      <span className="text-sm font-black text-[#3B6D11]">-₹{discount.toFixed(2)}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="border-t border-[#DCE5CF] pt-6 mb-8 flex justify-between items-end">
                <div>
                  <span className="text-[10px] font-bold text-[#6B7062] uppercase tracking-widest block mb-1">Total Amount</span>
                  <span className="text-xs text-[#A4B3C1] font-medium">Inclusive of all taxes</span>
                </div>
                <span className="text-3xl font-heading font-black text-[#173404] tracking-tight">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-[#173404] p-6 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
              
              <button 
                onClick={handlePayment}
                disabled={processing}
                className="w-full bg-gradient-to-r from-[#97C459] to-[#639922] hover:from-[#C0DD97] hover:to-[#97C459] text-[#173404] py-4 rounded-2xl font-black tracking-wide shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 relative z-10"
              >
                {processing ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-[#173404] border-t-transparent rounded-full" />
                ) : (
                  <>Secure Payment <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
              
              <p className="text-[10px] text-[#DCE5CF] mt-4 font-medium opacity-80 relative z-10">
                By clicking proceed, you agree to our Terms & Conditions
              </p>
            </div>
          </motion.div>
        </div>

      </div>

      {/* Payment Selection Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#173404]/60 backdrop-blur-sm"
              onClick={() => !isSimulatingPayment && setShowPaymentModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full relative z-10 shadow-2xl border border-[#DCE5CF]"
            >
              
              {paymentStep === 'select' && (
                <>
                  <h2 className="text-2xl font-bold text-[#173404] mb-2">Select Payment Method</h2>
                  <p className="text-[#6B7062] text-sm mb-6">Choose how you want to pay ₹{totalAmount.toFixed(2)}</p>

                  <div className="space-y-3 mb-8">
                    <label 
                      onClick={(e) => { e.preventDefault(); setSelectedPayment('upi'); }}
                      className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${selectedPayment === 'upi' ? 'border-[#97C459] bg-[#EAF3DE]' : 'border-[#DCE5CF] hover:border-[#97C459]'}`}
                    >
                      <input type="radio" name="payment" checked={selectedPayment === 'upi'} readOnly className="w-5 h-5 accent-[#639922]" />
                      <span className="font-bold text-[#20241C]">UPI (GPay, PhonePe, Paytm)</span>
                    </label>
                    <label 
                      onClick={(e) => { e.preventDefault(); setSelectedPayment('card'); }}
                      className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${selectedPayment === 'card' ? 'border-[#97C459] bg-[#EAF3DE]' : 'border-[#DCE5CF] hover:border-[#97C459]'}`}
                    >
                      <input type="radio" name="payment" checked={selectedPayment === 'card'} readOnly className="w-5 h-5 accent-[#639922]" />
                      <span className="font-bold text-[#20241C]">Credit / Debit Card</span>
                    </label>
                    <label 
                      onClick={(e) => { e.preventDefault(); setSelectedPayment('demo'); }}
                      className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${selectedPayment === 'demo' ? 'border-[#97C459] bg-[#EAF3DE]' : 'border-[#DCE5CF] hover:border-[#97C459]'}`}
                    >
                      <input type="radio" name="payment" checked={selectedPayment === 'demo'} readOnly className="w-5 h-5 accent-[#639922]" />
                      <span className="font-bold text-[#20241C]">Demo Payment (Test Mode)</span>
                    </label>
                  </div>

                  <button 
                    onClick={handleProceedPayment}
                    className="w-full bg-[#173404] text-[#97C459] font-black py-4 rounded-xl shadow-lg hover:shadow-xl transition-all"
                  >
                    Proceed with {selectedPayment.toUpperCase()}
                  </button>
                </>
              )}

              {paymentStep === 'upi' && (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => !isSimulatingPayment && setPaymentStep('select')} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200">
                      <ArrowRight className="w-4 h-4 rotate-180" />
                    </button>
                    <h2 className="text-xl font-bold text-[#173404]">Pay by UPI</h2>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {['GPay', 'PhonePe', 'Paytm'].map(app => (
                      <div key={app} className="border border-[#DCE5CF] rounded-xl p-3 flex flex-col items-center gap-2 cursor-pointer hover:bg-[#EAF3DE] hover:border-[#97C459]">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                          {app.substring(0,2)}
                        </div>
                        <span className="text-xs font-bold text-[#20241C]">{app}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mb-8">
                    <label className="text-xs font-bold text-[#6B7062] uppercase tracking-wider mb-2 block">Or Enter UPI ID</label>
                    <input type="text" placeholder="example@okhdfcbank" className="w-full px-4 py-3 bg-[#FBFDF7] border border-[#DCE5CF] rounded-xl font-bold focus:outline-none focus:border-[#97C459]" />
                  </div>

                  <button 
                    onClick={processDemoPayment}
                    disabled={isSimulatingPayment}
                    className="w-full bg-[#173404] text-[#97C459] font-black py-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    {isSimulatingPayment ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-[#97C459] border-t-transparent rounded-full" /> : `Pay ₹${totalAmount.toFixed(2)}`}
                  </button>
                </>
              )}

              {paymentStep === 'card' && (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => !isSimulatingPayment && setPaymentStep('select')} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200">
                      <ArrowRight className="w-4 h-4 rotate-180" />
                    </button>
                    <h2 className="text-xl font-bold text-[#173404]">Enter Card Details</h2>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div>
                      <label className="text-xs font-bold text-[#6B7062] uppercase tracking-wider mb-1 block">Card Number</label>
                      <input type="text" placeholder="4000 1234 5678 9010" maxLength="19" className="w-full px-4 py-3 bg-[#FBFDF7] border border-[#DCE5CF] rounded-xl font-mono focus:outline-none focus:border-[#97C459]" />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="text-xs font-bold text-[#6B7062] uppercase tracking-wider mb-1 block">Valid Thru</label>
                        <input type="text" placeholder="MM/YY" maxLength="5" className="w-full px-4 py-3 bg-[#FBFDF7] border border-[#DCE5CF] rounded-xl font-mono focus:outline-none focus:border-[#97C459]" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-bold text-[#6B7062] uppercase tracking-wider mb-1 block">CVV</label>
                        <input type="password" placeholder="***" maxLength="3" className="w-full px-4 py-3 bg-[#FBFDF7] border border-[#DCE5CF] rounded-xl font-mono focus:outline-none focus:border-[#97C459]" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#6B7062] uppercase tracking-wider mb-1 block">Name on Card</label>
                      <input type="text" placeholder="John Doe" className="w-full px-4 py-3 bg-[#FBFDF7] border border-[#DCE5CF] rounded-xl font-bold focus:outline-none focus:border-[#97C459]" />
                    </div>
                  </div>

                  <button 
                    onClick={() => setPaymentStep('otp')}
                    className="w-full bg-[#173404] text-[#97C459] font-black py-4 rounded-xl shadow-lg hover:shadow-xl transition-all"
                  >
                    Generate OTP
                  </button>
                </>
              )}

              {paymentStep === 'otp' && (
                <>
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-[#173404] mb-2">Verify Payment</h2>
                    <p className="text-[#6B7062] text-sm">We've sent a 6-digit OTP to your registered mobile number ending in **42</p>
                  </div>

                  <div className="flex justify-center gap-2 mb-8">
                    {[1,2,3,4,5,6].map((i) => (
                      <input key={i} type="text" maxLength="1" className="w-12 h-12 text-center text-xl font-bold bg-[#FBFDF7] border border-[#DCE5CF] rounded-xl focus:outline-none focus:border-[#97C459] focus:bg-[#EAF3DE]" />
                    ))}
                  </div>

                  <button 
                    onClick={processDemoPayment}
                    disabled={isSimulatingPayment}
                    className="w-full bg-[#173404] text-[#97C459] font-black py-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    {isSimulatingPayment ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-[#97C459] border-t-transparent rounded-full" /> : "Verify & Pay"}
                  </button>
                  <p className="text-center text-xs font-bold text-[#6B7062] mt-4 cursor-pointer hover:text-[#97C459]">Resend OTP</p>
                </>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#173404]/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] p-8 max-w-lg w-full relative z-10 shadow-2xl border border-[#DCE5CF] overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#EAF3DE] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              
              <div className="w-16 h-16 rounded-2xl bg-[#EAF3DE] text-[#3B6D11] flex items-center justify-center mb-6 mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              
              <h2 className="text-3xl font-heading font-black text-[#173404] text-center mb-2">Payment Successful!</h2>
              <p className="text-[#6B7062] text-center font-medium mb-8">Your tickets have been confirmed.</p>

              <div className="bg-[#FBFDF7] border border-[#DCE5CF] rounded-2xl p-6 mb-8 relative">
                <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-[#DCE5CF] -translate-y-1/2" />
                <div className="absolute left-[-8px] top-1/2 w-4 h-4 rounded-full bg-white border border-[#DCE5CF] -translate-y-1/2" />
                <div className="absolute right-[-8px] top-1/2 w-4 h-4 rounded-full bg-white border border-[#DCE5CF] -translate-y-1/2" />
                
                <div className="relative z-10 grid grid-cols-2 gap-y-6">
                  <div>
                    <p className="text-[10px] text-[#A4B3C1] font-bold uppercase tracking-wider mb-1">From</p>
                    <p className="font-bold text-[#173404]">{routeInfo?.origin}</p>
                    <p className="text-xs text-[#6B7062]">{formatTime(routeInfo?.departure_time)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-[#A4B3C1] font-bold uppercase tracking-wider mb-1">To</p>
                    <p className="font-bold text-[#173404]">{routeInfo?.destination}</p>
                    <p className="text-xs text-[#6B7062]">{formatTime(routeInfo?.arrival_time)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#A4B3C1] font-bold uppercase tracking-wider mb-1">Travels</p>
                    <p className="font-bold text-[#173404]">{routeInfo?.operator}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-[#A4B3C1] font-bold uppercase tracking-wider mb-1">Seats</p>
                    <p className="font-bold text-[#173404]">{seats.map(s => s.seat_number).join(', ')}</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleFinalConfirm}
                disabled={isConfirming}
                className={`w-full ${isConfirming ? 'bg-[#3B6D11] opacity-75' : 'bg-[#173404]'} text-[#97C459] font-black py-4 rounded-xl shadow-lg hover:shadow-xl transition-all`}
              >
                {isConfirming ? 'Generating E-Ticket...' : 'View E-Ticket'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Offers Modal */}
      <AnimatePresence>
        {showOffersModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowOffersModal(false)}
              className="absolute inset-0 bg-[#173404]/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#FBFDF7] rounded-[32px] p-6 sm:p-8 max-w-2xl w-full relative z-10 shadow-2xl border border-[#DCE5CF] max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#EAF3DE] flex items-center justify-center text-[#639922]">
                    <Tag className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-black text-[#173404]">All Available Offers</h2>
                </div>
                <button 
                  onClick={() => setShowOffersModal(false)}
                  className="w-10 h-10 rounded-full bg-white border border-[#DCE5CF] flex items-center justify-center text-[#6B7062] hover:bg-[#EAF3DE] hover:text-[#3B6D11] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto pr-2 space-y-4">
                {availableCoupons.map((offer) => (
                  <div key={offer.code} className="bg-white border border-[#DCE5CF] rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row gap-4 sm:items-center justify-between hover:border-[#97C459] transition-colors group">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#EAF3DE] text-[#639922] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Tag className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-[#173404] text-xs uppercase tracking-wide bg-[#EAF3DE] px-2 py-0.5 rounded">{offer.code}</span>
                        </div>
                        <h3 className="font-bold text-[#20241C] text-base">{offer.desc}</h3>
                        <p className="text-xs text-[#6B7062] mt-1 font-medium">Valid on {routeInfo?.operator || 'all'} buses</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setCouponCode(offer.code);
                        setDiscount(offer.discount);
                        setShowOffersModal(false);
                        toast.success(`Awesome! Coupon ${offer.code} applied successfully.`);
                      }}
                      className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-[#97C459] to-[#639922] text-[#173404] hover:from-[#C0DD97] hover:to-[#97C459] font-black text-sm rounded-xl transition-all shadow-md active:scale-95 whitespace-nowrap"
                    >
                      Apply Code
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
