import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

export default function Ticket() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [timeStr, setTimeStr] = useState('--:--');

  useEffect(() => {
    if (!state?.routeInfo) {
      navigate('/');
      return;
    }

    const tick = () => {
      setTimeStr(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    tick();
    const interval = setInterval(tick, 15000);
    return () => clearInterval(interval);
  }, [state, navigate]);

  if (!state?.routeInfo) return null;

  const { routeInfo, seats, passengers, bookingId, boardingPoint, droppingPoint } = state;
  const numSeats = seats.length;
  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const seatsStr = seats.map(s => s.seat_number).join(' · ');
  
  const getInitials = (name) => name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  const paxDetails = seats.map(s => `${passengers[s.seat_number]?.name || 'Passenger'} (Seat: ${s.seat_number})`).join('\n');
  const busType = routeInfo.bus_type?.includes('Sleeper') ? 'Sleeper' : 'Seater';
  
  const qrPayload = `🎟️ VEGPASS E-TICKET
------------------------
Status: Payment Done ✅
Booking ID: ${bookingId}
Date: ${dateStr}
Route: ${routeInfo.origin} ➔ ${routeInfo.destination}
Bus: ${routeInfo.operator}
Passengers: ${paxDetails}
------------------------
Valid & Verified`;

  const formatTime = (isoTime) => {
    if (!isoTime) return '';
    if (isoTime.includes('T')) {
      return new Date(isoTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return isoTime;
  };

  const formatLocation = (city, isDropping) => {
    if (!city) return '';
    const c = city.toLowerCase();
    
    // Real locations for major cities
    if (c === 'hyderabad') return isDropping ? 'Ameerpet, Hyderabad' : 'Kukatpally, Hyderabad';
    if (c === 'bangalore' || c === 'bengaluru') return isDropping ? 'Madiwala, Bangalore' : 'Majestic, Bangalore';
    if (c === 'mumbai') return isDropping ? 'Andheri East, Mumbai' : 'Borivali, Mumbai';
    if (c === 'chennai') return isDropping ? 'Koyambedu, Chennai' : 'Guindy, Chennai';
    if (c === 'delhi') return isDropping ? 'Kashmere Gate, Delhi' : 'Anand Vihar, Delhi';
    if (c === 'pune') return isDropping ? 'Swargate, Pune' : 'Shivajinagar, Pune';
    
    // For Tirupati, Goa and other cities, append 'Bus Stand'
    if (c === 'tirupati') return 'Tirupati RTC Bus Stand';
    if (c === 'goa') return 'Panjim KTC Bus Stand';
    
    return `${city} Bus Stand`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4 font-sans selection:bg-[#97C459] selection:text-[#173404]" style={{ 
      backgroundColor: '#173404', 
      backgroundImage: `radial-gradient(ellipse 700px 420px at 85% -10%, rgba(151,196,89,.16), transparent 60%), radial-gradient(ellipse 600px 400px at 0% 110%, rgba(39,80,10,.95), transparent 65%)`,
      color: '#20241C'
    }}>
      
      {/* Top Bar */}
      <header className="w-full max-w-[430px] flex items-center justify-between mb-6 text-[#EAF3DE]">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#97C459] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#173404" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v-9h-8v9"></path><path d="M8 7v-4h8v4"></path><path d="M6 16h12v4h-12z"></path><path d="M9 20v2"></path><path d="M15 20v2"></path><path d="M6 16l-2 -2v-3h16v3l-2 2"></path></svg>
          </div>
          <div>
            <div className="font-heading font-bold text-xl tracking-tight">Veg<span className="text-[#97C459]">pass</span></div>
            <div className="text-[9px] tracking-[2.2px] uppercase text-[#C0DD97]">E-Ticket</div>
          </div>
        </div>
        <div className="font-mono text-xs text-[#C0DD97] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#8CFF4F] shadow-[0_0_0_0_rgba(140,255,79,0.5)] animate-[pulse_1.6s_infinite]" /> 
          {timeStr}
        </div>
      </header>

      {/* Ticket Wrapper */}
      <article className="w-full max-w-[430px] drop-shadow-2xl animate-[arrive_0.55s_cubic-bezier(0.2,0.9,0.3,1.1)_both]">
        
        {/* Upper Slab (Trip Details) */}
        <div className="bg-[#FBFDF7] rounded-t-[24px] p-6 pb-5 relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between mb-4.5 gap-2 relative z-10">
            <div className="flex gap-2">
              <span className="bg-[#EAF3DE] border border-[#DCE5CF] text-[#3B6D11] text-[10px] font-bold uppercase tracking-[2.2px] px-3 py-1.5 rounded-full flex items-center gap-1.5">
                {routeInfo.bus_type?.includes('Sleeper') ? 'Sleeper' : 'Seater'}
              </span>
              <span className="bg-[#3B6D11] border border-[#3B6D11] text-[#EAF3DE] text-[10px] font-bold uppercase tracking-[2.2px] px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <span className="text-[#97C459]">{numSeats}</span> Members
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-[#6B7062] tracking-wider">{bookingId}</span>
          </div>

          <div className="grid grid-cols-[auto_1fr_auto] gap-3.5 items-center relative z-10">
            <div className="text-left">
              <p className="font-heading text-4xl font-extrabold text-[#173404] tracking-tight">{routeInfo.origin.substring(0, 3).toUpperCase()}</p>
              <p className="text-[11.5px] text-[#6B7062] font-medium mt-1">{routeInfo.origin}</p>
              <p className="font-mono text-[13px] font-bold text-[#3B6D11] mt-1.5">{formatTime(routeInfo.departure_time)}</p>
            </div>
            <div className="relative h-12 flex items-center justify-center">
              <svg viewBox="0 0 220 50" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                <line x1="8" y1="25" x2="212" y2="25" stroke="#DCE5CF" strokeWidth="4" strokeLinecap="round"/>
                <line x1="8" y1="25" x2="212" y2="25" stroke="#97C459" strokeWidth="4" strokeLinecap="round" strokeDasharray="9 11"/>
                <circle cx="8" cy="25" r="5.5" fill="#3B6D11"/>
                <circle cx="212" cy="25" r="5.5" fill="#3B6D11"/>
              </svg>
              <div className="absolute top-[8px] animate-[drive_6s_ease-in-out_infinite]">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B6D11" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v-9h-8v9"></path><path d="M8 7v-4h8v4"></path><path d="M6 16h12v4h-12z"></path><path d="M9 20v2"></path><path d="M15 20v2"></path><path d="M6 16l-2 -2v-3h16v3l-2 2"></path></svg>
              </div>
              <span className="absolute bottom-0 text-[10px] tracking-[1.4px] uppercase text-[#6B7062] font-medium bg-[#FBFDF7] px-2">{routeInfo.duration || '9h 30m'}</span>
            </div>
            <div className="text-right">
              <p className="font-heading text-4xl font-extrabold text-[#173404] tracking-tight">{routeInfo.destination.substring(0, 3).toUpperCase()}</p>
              <p className="text-[11.5px] text-[#6B7062] font-medium mt-1">{routeInfo.destination}</p>
              <p className="font-mono text-[13px] font-bold text-[#3B6D11] mt-1.5">{formatTime(routeInfo.arrival_time)}</p>
            </div>
          </div>

          <div className="border-t-[1.5px] border-[#DCE5CF] mt-4 pt-3.5 relative z-10">
            <p className="text-[9px] tracking-[1.8px] uppercase text-[#6B7062] font-bold mb-2.5">Passengers on this ticket</p>
            <div className="space-y-2">
              {seats.map(s => {
                const p = passengers[s.seat_number];
                return (
                  <div key={s.seat_number} className="flex items-center gap-3 bg-[#EAF3DE] border border-[#DCE5CF] rounded-xl p-2.5 px-3">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-[#3B6D11] text-[#EAF3DE] font-heading font-bold text-xs flex items-center justify-center">
                      {getInitials(p?.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-bold text-sm truncate">{p?.name}</p>
                      <p className="text-[11px] text-[#6B7062] mt-0.5">{p?.age} yrs · {p?.gender}</p>
                    </div>
                    <span className="font-heading font-bold text-[#3B6D11] bg-white border-[1.5px] border-[#97C459] rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
                      {s.seat_number}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-4 gap-x-4 border-t-[1.5px] border-[#DCE5CF] mt-4 pt-4 relative z-10">
            <div>
              <label className="block text-[9px] tracking-[1.8px] uppercase text-[#6B7062] font-bold mb-1">Boarding</label>
              <p className="font-heading font-bold text-sm truncate" title={boardingPoint?.name || formatLocation(routeInfo.origin, false)}>
                {boardingPoint?.name || formatLocation(routeInfo.origin, false)}
              </p>
              <p className="text-[11px] text-[#6B7062] mt-0.5">{boardingPoint?.time || formatTime(routeInfo.departure_time)}</p>
            </div>
            <div>
              <label className="block text-[9px] tracking-[1.8px] uppercase text-[#6B7062] font-bold mb-1">Dropping</label>
              <p className="font-heading font-bold text-sm truncate" title={droppingPoint?.name || formatLocation(routeInfo.destination, true)}>
                {droppingPoint?.name || formatLocation(routeInfo.destination, true)}
              </p>
              <p className="text-[11px] text-[#6B7062] mt-0.5">{droppingPoint?.time || formatTime(routeInfo.arrival_time)}</p>
            </div>
            <div>
              <label className="block text-[9px] tracking-[1.8px] uppercase text-[#6B7062] font-bold mb-1">Date</label>
              <p className="font-heading font-bold text-sm">{dateStr}</p>
            </div>
            <div>
              <label className="block text-[9px] tracking-[1.8px] uppercase text-[#6B7062] font-bold mb-1">Bus Operator</label>
              <p className="font-heading font-bold text-sm truncate">{routeInfo.operator}</p>
            </div>
            <div>
              <label className="block text-[9px] tracking-[1.8px] uppercase text-[#6B7062] font-bold mb-1">Seats</label>
              <p className="font-heading font-bold text-sm truncate">{seatsStr}</p>
            </div>
            <div>
              <label className="block text-[9px] tracking-[1.8px] uppercase text-[#6B7062] font-bold mb-1">Total Fare</label>
              <p className="font-heading font-bold text-sm flex items-center gap-2">
                ₹{state.totalAmount?.toFixed(0) || '0'}
                <span className="text-[10px] text-[#3B6D11] uppercase tracking-wider bg-[#EAF3DE] px-1.5 py-0.5 rounded">Confirmed</span>
              </p>
            </div>
          </div>
        </div>

        {/* Perforation Line */}
        <div className="relative h-0 border-t-[3px] border-dashed border-[#3B6D11]/40 bg-[#FBFDF7]">
          <div className="absolute -top-3.5 -left-3.5 w-7 h-7 rounded-full bg-[#173404]" />
          <div className="absolute -top-3.5 -right-3.5 w-7 h-7 rounded-full bg-[#173404]" />
        </div>

        {/* Lower Slab (Scanner) */}
        <div className="bg-[#EAF3DE] rounded-b-[24px] p-6 pb-6 flex flex-col items-center text-center">
          <p className="font-heading text-lg font-bold text-[#173404] flex items-center gap-2">
            Scan near the driver
          </p>
          <p className="text-[12.5px] text-[#6B7062] mt-1.5 leading-[1.55]">
            One code for the whole group — show it at the front door.<br/>The driver scans <b className="text-[#3B6D11]">once</b> and you all board.
          </p>

          <div className="relative my-4.5 bg-white rounded-[18px] p-[15px] border-[1.5px] border-[#DCE5CF] w-[198px] h-[198px] flex items-center justify-center">
            <QRCodeSVG value={qrPayload} size={168} bgColor="#ffffff" fgColor="#173404" level="M" />
            <div className="absolute inset-1.5 pointer-events-none">
              <b className="absolute w-6 h-6 border-4 border-[#639922] top-0 left-0 border-r-0 border-b-0 rounded-tl-lg" />
              <b className="absolute w-6 h-6 border-4 border-[#639922] top-0 right-0 border-l-0 border-b-0 rounded-tr-lg" />
              <b className="absolute w-6 h-6 border-4 border-[#639922] bottom-0 left-0 border-r-0 border-t-0 rounded-bl-lg" />
              <b className="absolute w-6 h-6 border-4 border-[#639922] bottom-0 right-0 border-l-0 border-t-0 rounded-br-lg" />
            </div>
            <div className="absolute left-2.5 right-2.5 top-3 h-[3px] rounded-full bg-gradient-to-r from-transparent via-[#8CFF4F] to-transparent shadow-[0_0_14px_3px_rgba(140,255,79,0.5)] animate-[sweep_2.4s_ease-in-out_infinite]" />
          </div>

          <p className="font-mono text-[11.5px] font-bold text-[#6B7062] tracking-[1.6px]">{bookingId}</p>
          <p className="mt-1.5 text-[11.5px] font-bold text-[#3B6D11] flex items-center gap-1.5">
            Valid for {numSeats} passenger{numSeats > 1 ? 's' : ''} · {seatsStr}
          </p>

          <div className="mt-3.5 w-full bg-[#173404] text-[#EAF3DE] rounded-2xl p-3.5 flex items-center gap-3 text-left">
            <div className="shrink-0 w-9 h-9 rounded-xl bg-[#3B6D11] flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#97C459" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="3"></circle><line x1="12" y1="3" x2="12" y2="9"></line><line x1="12" y1="15" x2="12" y2="21"></line><line x1="3" y1="12" x2="9" y2="12"></line><line x1="15" y1="12" x2="21" y2="12"></line></svg>
            </div>
            <div>
              <p className="font-heading text-[13.5px] font-bold">Board together from the front door</p>
              <p className="text-[11.5px] text-[#C0DD97] mt-0.5">Hold your screen 15 cm from the scanner</p>
            </div>
          </div>

          <span className="mt-3 flex items-center gap-1.5 text-[11.5px] text-[#3B6D11] font-bold">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#639922" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-6"></path><path d="M12 8l4 -4"></path><path d="M12 8v8"></path><path d="M8 4l4 4"></path><path d="M16 12a4 4 0 0 0 -4 -4a4 4 0 0 0 -4 4c0 3 4 10 4 10s4 -7 4 -10z"></path></svg>
            This ride plants {numSeats} tree{numSeats > 1 ? 's — one per member' : ''}
          </span>
        </div>

      </article>

      {/* Action Buttons */}
      <div className="w-full max-w-[430px] mt-6 flex gap-3 animate-[arrive_0.55s_cubic-bezier(0.2,0.9,0.3,1.1)_both]" style={{ animationDelay: '0.15s' }}>
        <button 
          onClick={() => {
            const shareUrl = `https://veypass.in/verify/${bookingId}`;
            if (navigator.share) {
              navigator.share({
                title: 'My Vegpass E-Ticket',
                text: `I'm travelling from ${routeInfo.origin} to ${routeInfo.destination} on ${dateStr}. My booking ID is ${bookingId}.`,
                url: shareUrl,
              }).catch(console.error);
            } else {
              alert("Sharing is not supported on this device. You can screenshot the ticket!");
            }
          }}
          className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-[#EAF3DE] rounded-2xl py-3.5 flex flex-col items-center gap-1.5 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#97C459]"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
          <span className="text-[11px] font-bold tracking-wide uppercase">Share</span>
        </button>

        <button 
          onClick={() => {
            const trackUrl = `https://www.google.com/maps/dir/${routeInfo.origin}/${routeInfo.destination}`;
            if (navigator.share) {
              navigator.share({
                title: 'Live Bus Tracking',
                text: `Track my bus from ${routeInfo.origin} to ${routeInfo.destination} live here:`,
                url: trackUrl
              }).catch(console.error);
            } else {
              window.open(trackUrl, '_blank');
            }
          }}
          className="flex-1 bg-[#97C459] hover:bg-[#A8CE71] text-[#173404] rounded-2xl py-3.5 flex flex-col items-center gap-1.5 transition-all shadow-lg shadow-[#97C459]/20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          <span className="text-[11px] font-bold tracking-wide uppercase">Track Live</span>
        </button>

        <button 
          onClick={() => {
            const demoPass = {
              id: bookingId,
              route: { origin: routeInfo.origin, destination: routeInfo.destination },
              status: 'ACTIVE',
              final_fare: state.totalAmount?.toFixed(0) || 850,
              seat: seats.map(s => s.seat_number).join(', '),
              qr_code_base64: qrPayload
            };
            localStorage.setItem('demo_pass', JSON.stringify(demoPass));
            navigate('/my-passes');
          }}
          className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-[#EAF3DE] rounded-2xl py-3.5 flex flex-col items-center gap-1.5 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#97C459]"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
          <span className="text-[11px] font-bold tracking-wide uppercase">Save Pass</span>
        </button>
      </div>
      
      <style>{`
        @keyframes arrive { from { transform: translateY(26px) scale(0.97); opacity: 0; } to { transform: none; opacity: 1; } }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(140,255,79,0.5); } 70% { box-shadow: 0 0 0 9px rgba(140,255,79,0); } 100% { box-shadow: 0 0 0 0 rgba(140,255,79,0); } }
        @keyframes drive { 0% { left: 4%; } 50% { left: calc(96% - 22px); } 100% { left: 4%; } }
        @keyframes sweep { 0% { top: 12px; } 50% { top: calc(100% - 16px); } 100% { top: 12px; } }
      `}</style>
    </div>
  );
}
