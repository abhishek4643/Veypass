import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function SharedTicket() {
  const [searchParams] = useSearchParams();
  const encodedData = searchParams.get('d');
  
  if (!encodedData) {
    return <div className="p-8 text-center text-white">Invalid Ticket Link</div>;
  }

  let ticket;
  try {
    ticket = JSON.parse(atob(encodedData));
  } catch (err) {
    return <div className="p-8 text-center text-white">Corrupted Ticket Data</div>;
  }

  const handleDownload = () => {
    window.print();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: '#173404' }}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
      
      <motion.div 
        id="print-area"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-[#FBFDF7] rounded-3xl p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-[#97C459]" />
        
        <div className="text-center mb-6">
          <h1 className="font-heading font-black text-3xl text-[#173404] tracking-tight">Veg<span className="text-[#97C459]">pass</span></h1>
          <p className="text-[10px] tracking-[2px] uppercase text-[#6B7062] mt-1 font-bold">E-Ticket Confirmed</p>
        </div>

        <div className="space-y-5">
          <div className="bg-[#EAF3DE] rounded-2xl p-4 text-center border border-[#DCE5CF]">
            <p className="text-xs font-bold text-[#6B7062] uppercase tracking-wider mb-1">Booking ID</p>
            <p className="font-mono text-xl font-black text-[#173404]">{ticket.id}</p>
          </div>

          <div className="flex items-center justify-between px-2">
            <div>
              <p className="text-[10px] font-bold text-[#6B7062] uppercase tracking-wider">From</p>
              <p className="font-bold text-lg text-[#20241C]">{ticket.org}</p>
            </div>
            <div className="flex flex-col items-center px-4">
              <div className="w-1 h-1 rounded-full bg-[#97C459] mb-1" />
              <div className="w-1 h-1 rounded-full bg-[#97C459] mb-1" />
              <div className="w-1 h-1 rounded-full bg-[#97C459]" />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-[#6B7062] uppercase tracking-wider">To</p>
              <p className="font-bold text-lg text-[#20241C]">{ticket.dst}</p>
            </div>
          </div>

          <div className="h-[1px] w-full bg-dashed bg-[#DCE5CF]" />

          <div className="grid grid-cols-2 gap-4 px-2">
            <div>
              <p className="text-[10px] font-bold text-[#6B7062] uppercase tracking-wider">Date</p>
              <p className="font-bold text-sm text-[#20241C]">{ticket.date}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#6B7062] uppercase tracking-wider">Time</p>
              <p className="font-bold text-sm text-[#20241C]">{ticket.time}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] font-bold text-[#6B7062] uppercase tracking-wider">Operator</p>
              <p className="font-bold text-sm text-[#20241C]">{ticket.bus}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] font-bold text-[#6B7062] uppercase tracking-wider">Passengers & Seats</p>
              <p className="font-bold text-sm text-[#20241C]">{ticket.pax}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-xs font-bold text-[#97C459]">
          Payment Completed ✅
        </div>
      </motion.div>

      <button 
        onClick={handleDownload}
        className="no-print mt-8 w-full max-w-sm bg-[#97C459] text-[#173404] font-black py-4 rounded-2xl shadow-[0_8px_30px_rgb(151,196,89,0.3)] hover:shadow-[0_8px_30px_rgb(151,196,89,0.5)] transition-all flex justify-center items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        DOWNLOAD AS PDF
      </button>
    </div>
  );
}
