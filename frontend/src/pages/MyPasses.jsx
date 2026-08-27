import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, ChevronDown, CheckCircle2, ArrowRight } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function MyPasses() {
  const navigate = useNavigate();
  const [passes, setPasses] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPasses = async () => {
      try {
        const res = await api.get('/my-passes');
        let data = res.data || [];
        setPasses(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPasses();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBFDF7] flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-8 h-8 border-2 border-[#97C459] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFDF7] font-sans text-[#20241C] pb-20">
      <div className="bg-[#173404] pt-24 pb-12 px-4 relative overflow-hidden">
        <div className="max-w-3xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl sm:text-4xl font-heading font-black text-[#EAF3DE] tracking-tight">My Digital Passes</h1>
            <p className="text-[#C0DD97] text-sm mt-2 font-medium">Your securely stored e-tickets</p>
          </motion.div>
        </div>
        {/* Background Decorative Rings */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#97C459]/5 rounded-full blur-3xl pointer-events-none" />
      </div>
      
      <div className="max-w-3xl mx-auto px-4 -mt-6">
        <div className="space-y-4 relative z-20">
          {passes.map((pass, i) => (
            <motion.div 
              key={pass.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-white rounded-3xl overflow-hidden shadow-xl shadow-[#173404]/5 border ${expandedId === pass.id ? 'border-[#97C459] ring-2 ring-[#97C459]/20' : 'border-[#DCE5CF]'} transition-all duration-300`}
            >
              {/* Pass Header */}
              <div 
                className="p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-[#FBFDF7] transition"
                onClick={() => setExpandedId(expandedId === pass.id ? null : pass.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#EAF3DE] flex items-center justify-center shrink-0">
                    <Ticket className="w-6 h-6 text-[#3B6D11]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 text-[#173404]">
                      <span className="font-heading font-bold text-lg">{pass.route?.origin || 'Unknown'}</span>
                      <ArrowRight className="w-4 h-4 text-[#A4B3C1]" />
                      <span className="font-heading font-bold text-lg">{pass.route?.destination || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className={`text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1 ${pass.status === 'ACTIVE' ? 'bg-[#EAF3DE] text-[#3B6D11]' : 'bg-red-50 text-red-600'}`}>
                        {pass.status === 'ACTIVE' && <CheckCircle2 className="w-3 h-3" />}
                        {pass.status}
                      </span>
                      <span className="text-sm font-bold text-[#6B7062]">₹{pass.final_fare}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                  <div className="text-right flex-1 sm:flex-none">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-[#6B7062]">Seats</p>
                    <p className="font-heading font-black text-xl text-[#3B6D11]">{pass.seat}</p>
                  </div>
                  <div className={`w-8 h-8 rounded-full bg-[#FBFDF7] border border-[#DCE5CF] flex items-center justify-center transition-transform duration-300 ${expandedId === pass.id ? 'rotate-180 bg-[#97C459] border-[#97C459] text-[#173404]' : 'text-[#A4B3C1]'}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Expanded Content (QR Scanner) */}
              <AnimatePresence>
                {expandedId === pass.id && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 sm:px-6 pb-6 pt-0">
                      <div className="bg-[#173404] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-10 text-white relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#97C459] to-[#8CFF4F]" />
                        
                        {/* QR Code Section */}
                        <div className="bg-white p-3 rounded-2xl flex-shrink-0 shadow-lg shadow-black/40 relative flex items-center justify-center" style={{ width: 168, height: 168 }}>
                          {(() => {
                            const dateStr = new Date(pass.created_at || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                            const qrText = `🎟️ VEGPASS E-TICKET
------------------------
Status: Payment Done ✅
Booking ID: ${pass.id}
Date: ${dateStr}
Route: ${pass.route.origin} ➔ ${pass.route.destination}
Bus: ${pass.route.operator}
Passengers: ${pass.passenger_name || 'Passenger'} (Seat: ${pass.seat})
------------------------
Valid & Verified`;
                            
                            return (
                              <QRCodeSVG value={qrText} size={144} bgColor="#ffffff" fgColor="#173404" level="M" />
                            );
                          })()}
                        </div>
                        
                        {/* Information Details */}
                        <div className="flex-1 w-full text-center sm:text-left space-y-4">
                          <h3 className="font-heading font-bold text-xl text-[#EAF3DE]">Scan to Board</h3>
                          <p className="text-sm text-[#C0DD97] leading-relaxed">
                            Show this QR code at the bus entrance. A single scan validates all passengers in this booking.
                          </p>
                          
                          <div className="bg-white/5 border border-white/10 rounded-xl p-3 inline-block w-full text-left mt-2">
                            <p className="text-[10px] uppercase font-bold tracking-widest text-[#97C459] mb-1">Booking ID</p>
                            <p className="font-mono text-sm font-bold text-[#EAF3DE] break-all">
                              {pass.id}
                            </p>
                          </div>
                          
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/ticket', {
                                state: {
                                  routeInfo: {
                                    origin: pass.route.origin,
                                    destination: pass.route.destination,
                                    operator: pass.route.operator,
                                    departure_time: pass.route.departure_time,
                                    arrival_time: pass.route.arrival_time
                                  },
                                  seats: [{ seat_number: pass.seat }],
                                  passengers: { [pass.seat]: { name: pass.passenger_name, age: pass.passenger_age, gender: pass.passenger_gender } },
                                  bookingId: pass.id,
                                  totalAmount: pass.final_fare,
                                  boardingPoint: pass.boarding_point_name ? { name: pass.boarding_point_name, time: pass.boarding_point_time } : null,
                                  droppingPoint: pass.dropping_point_name ? { name: pass.dropping_point_name, time: pass.dropping_point_time } : null
                                }
                              });
                            }}
                            className="w-full mt-2 bg-[#97C459] hover:bg-[#A8CE71] text-[#173404] font-bold text-sm py-3 rounded-xl transition-colors shadow-lg shadow-[#97C459]/20 flex items-center justify-center gap-2"
                          >
                            <span>View Full E-Ticket</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
          
          {passes.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-3xl p-12 text-center border border-[#DCE5CF] shadow-xl shadow-[#173404]/5"
            >
              <div className="w-16 h-16 bg-[#EAF3DE] rounded-full flex items-center justify-center mx-auto mb-4">
                <Ticket className="w-8 h-8 text-[#97C459]" />
              </div>
              <h3 className="font-heading font-bold text-xl text-[#173404] mb-2">No passes yet</h3>
              <p className="text-[#6B7062] text-sm">Book a ticket to see your digital pass here</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
