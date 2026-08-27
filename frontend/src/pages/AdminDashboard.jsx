import { useState, useEffect } from 'react';
import api from '../utils/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { ShieldAlert, ShieldCheck, Activity, Zap, IndianRupee, Ticket, ScanLine, Server } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total_revenue: 0, total_bookings: 0, total_scans: 0 });
  const [chainValid, setChainValid] = useState(null);
  const [chainTickets, setChainTickets] = useState([]);
  const [simulating, setSimulating] = useState(false);
  const [healthData, setHealthData] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        setStats(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const res = await api.get('/health');
      setHealthData(prev => [...prev.slice(-29), { time: new Date().toLocaleTimeString(), ...res.data }]);
    } catch (err) {}
  };

  useEffect(() => {
    const interval = setInterval(checkHealth, 1000);
    return () => clearInterval(interval);
  }, []);

  const verifyChain = async () => {
    try {
      const res = await api.get('/admin/verify-chain');
      setChainValid(res.data.chain_valid);
      setChainTickets(res.data.tickets);
      if (res.data.chain_valid) toast.success("Hash-chain integrity verified!");
      else toast.error("Tampering detected in chain!");
    } catch (err) {
      toast.error("Failed to verify chain");
    }
  };

  const simulateTraffic = async () => {
    if (simulating) return;
    setSimulating(true);
    toast("Initiating Traffic Spike (200 requests)...", { icon: '⚡' });
    
    const promises = [];
    for (let i = 0; i < 200; i++) {
      promises.push(api.get('/health').catch(() => {}));
    }
    
    await Promise.all(promises);
    setSimulating(false);
    toast.success("Spike complete — auto-scaling handled the load.");
  };

  const latestHealth = healthData[healthData.length - 1] || {};

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-heading font-bold mb-2">Admin Dashboard</h1>
        <p className="text-white/40 text-sm">System health, revenue analytics, and chain integrity</p>
      </motion.div>
      
      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="stat-card accent1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/30 mb-1 font-medium">Total Revenue</p>
              <p className="text-2xl sm:text-3xl font-bold text-accent1">₹{stats.total_revenue.toFixed(0)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-accent1/10 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-accent1" />
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="stat-card accent2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/30 mb-1 font-medium">Total Bookings</p>
              <p className="text-2xl sm:text-3xl font-bold">{stats.total_bookings}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-accent2/10 flex items-center justify-center">
              <Ticket className="w-5 h-5 text-accent2" />
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="stat-card orange">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/30 mb-1 font-medium">Total Scans</p>
              <p className="text-2xl sm:text-3xl font-bold">{stats.total_scans}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <ScanLine className="w-5 h-5 text-orange-400" />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Elasticity Dashboard */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card-static p-5 sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h2 className="text-base font-heading font-bold flex items-center gap-2 text-white/80">
              <Activity className="text-accent2 w-4 h-4" /> Cloud Elasticity
            </h2>
            <button 
              onClick={simulateTraffic} 
              disabled={simulating}
              className="badge bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400 border border-orange-500/20 !py-1.5 !px-3 cursor-pointer hover:from-orange-500/30 hover:to-red-500/30 transition disabled:opacity-40"
            >
              <Zap className="w-3 h-3" /> {simulating ? 'Simulating...' : 'Simulate Spike'}
            </button>
          </div>
          
          {/* Live Metrics */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-black/20 rounded-lg p-3 text-center">
              <p className="text-xs text-white/30">Load</p>
              <p className="font-bold text-lg text-accent1">{latestHealth.requests_per_sec || 0}<span className="text-xs text-white/30 font-normal"> /s</span></p>
            </div>
            <div className="bg-black/20 rounded-lg p-3 text-center">
              <p className="text-xs text-white/30">Latency</p>
              <p className="font-bold text-lg">{latestHealth.latency_ms || 0}<span className="text-xs text-white/30 font-normal"> ms</span></p>
            </div>
            <div className="bg-black/20 rounded-lg p-3 text-center">
              <p className="text-xs text-white/30">Instances</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                {[...Array(latestHealth.simulated_instances || 1)].map((_, i) => (
                  <motion.div 
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-3 h-3 bg-accent1 rounded-sm"
                    style={{ boxShadow: '0 0 8px rgba(0,229,199,0.4)' }}
                  />
                ))}
              </div>
            </div>
          </div>
          
          {/* Chart */}
          <div className="h-48 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={healthData}>
                <defs>
                  <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E5C7" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#00E5C7" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C5CFF" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#7C5CFF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(10,14,26,0.95)', 
                    border: '1px solid rgba(255,255,255,0.08)', 
                    borderRadius: '12px',
                    fontSize: '12px',
                    backdropFilter: 'blur(12px)'
                  }} 
                />
                <Area type="monotone" dataKey="requests_per_sec" stroke="#00E5C7" fill="url(#colorReq)" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Area type="monotone" dataKey="latency_ms" stroke="#7C5CFF" fill="url(#colorLat)" strokeWidth={2} dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex items-center gap-4 mt-3 justify-center">
            <div className="flex items-center gap-1.5 text-xs text-white/30">
              <div className="w-2.5 h-2.5 rounded-full bg-accent1" /> Requests/sec
            </div>
            <div className="flex items-center gap-1.5 text-xs text-white/30">
              <div className="w-2.5 h-2.5 rounded-full bg-accent2" /> Latency (ms)
            </div>
          </div>
        </motion.div>

        {/* Chain Verifier */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card-static p-5 sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h2 className="text-base font-heading font-bold flex items-center gap-2 text-white/80">
              <ShieldCheck className="text-green-400 w-4 h-4" /> Hash-Chain Verifier
            </h2>
            <button onClick={verifyChain} className="btn-ghost !py-1.5 !px-4 !text-xs">
              Audit Database
            </button>
          </div>
          
          {chainValid !== null && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-4 rounded-xl mb-5 flex items-center justify-center gap-2 font-bold text-sm
                ${chainValid 
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}
            >
              {chainValid ? <><ShieldCheck className="w-4 h-4" /> Integrity Verified — No Tampering</> : <><ShieldAlert className="w-4 h-4" /> Integrity Compromised!</>}
            </motion.div>
          )}
          
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
            {chainTickets.map((t) => (
              <div key={t.ticket_id} className="bg-black/20 p-3 rounded-lg border border-white/3">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-semibold text-sm">Ticket #{t.ticket_id}</span>
                  <span className={`badge !text-[10px] ${t.status === 'VALID' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {t.status}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-white/20 space-y-0.5">
                  <p>prev: {t.actual_prev.substring(0, 28)}...</p>
                  <p>hash: {t.stored_hash.substring(0, 28)}...</p>
                </div>
              </div>
            ))}
            {chainTickets.length === 0 && (
              <div className="text-center py-10">
                <ShieldCheck className="w-8 h-8 text-white/10 mx-auto mb-3" />
                <p className="text-white/20 text-sm">Run an audit to verify chain integrity</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
