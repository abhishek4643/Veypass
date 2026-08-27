import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import * as jose from 'jose';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Wifi, WifiOff, RefreshCw, CheckCircle, XCircle, ScanLine, Signal } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ConductorScanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [scanResult, setScanResult] = useState(null);
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [publicKey, setPublicKey] = useState(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const fetchPubKey = async () => {
      try {
        const res = await api.get('/public-key');
        const pubKey = await jose.importSPKI(res.data.public_key, 'RS256');
        setPublicKey(pubKey);
      } catch (err) {
        console.error("Failed to load public key", err);
      }
    };
    fetchPubKey();

    const q = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
    setOfflineQueue(q);

    const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: {width: 250, height: 250} }, false);
    
    scanner.render(async (decodedText) => {
      scanner.pause();
      
      try {
        if (!publicKey) throw new Error("Public key not loaded");
        
        const { payload } = await jose.jwtVerify(decodedText, publicKey);
        
        const localSeen = JSON.parse(localStorage.getItem('localSeen') || '{}');
        if (localSeen[payload.chain_hash]) {
          setScanResult({ status: 'INVALID', msg: 'ALREADY SCANNED LOCALLY' });
          setTimeout(() => { setScanResult(null); scanner.resume(); }, 3000);
          return;
        }

        if (navigator.onLine) {
          try {
            await api.post('/tickets/scan', { jwt_token: decodedText });
            setScanResult({ status: 'VALID', payload });
          } catch (err) {
            setScanResult({ status: 'INVALID', msg: err.response?.data?.detail || 'Scan failed' });
          }
        } else {
          const newQueue = [...offlineQueue, decodedText];
          setOfflineQueue(newQueue);
          localStorage.setItem('offlineQueue', JSON.stringify(newQueue));
          
          localSeen[payload.chain_hash] = true;
          localStorage.setItem('localSeen', JSON.stringify(localSeen));
          
          setScanResult({ status: 'VALID', payload, offline: true });
        }
      } catch (err) {
        setScanResult({ status: 'INVALID', msg: 'INVALID SIGNATURE OR EXPIRED' });
      }

      setTimeout(() => {
        setScanResult(null);
        scanner.resume();
      }, 3000);

    }, (error) => {});

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      scanner.clear().catch(e => console.error(e));
    };
  }, [publicKey, offlineQueue]);

  const syncQueue = async () => {
    if (offlineQueue.length === 0) return;
    try {
      const res = await api.post('/tickets/scan/batch', { jwt_tokens: offlineQueue });
      toast.success(`Synced ${res.data.results.length} tickets`);
      setOfflineQueue([]);
      localStorage.setItem('offlineQueue', '[]');
      localStorage.setItem('localSeen', '{}');
    } catch (err) {
      toast.error("Sync failed");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-heading font-bold mb-2">Conductor Scanner</h1>
        <p className="text-white/40 text-sm">Verify passenger passes using offline-first RS256 QR scanning</p>
      </motion.div>

      {/* Status Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card-static p-4 mb-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <span className="badge bg-green-500/10 text-green-400 border border-green-500/20 !py-1.5 !px-3">
                <div className="pulse-dot bg-green-400" />
                <Wifi className="w-3.5 h-3.5" /> Online
              </span>
            ) : (
              <span className="badge bg-orange-500/10 text-orange-400 border border-orange-500/20 !py-1.5 !px-3">
                <div className="pulse-dot bg-orange-400" />
                <WifiOff className="w-3.5 h-3.5" /> Offline Mode
              </span>
            )}
            <span className="text-xs text-white/30">
              <Signal className="w-3 h-3 inline mr-1" />
              Verification runs locally in browser
            </span>
          </div>
          
          <button 
            onClick={syncQueue} 
            disabled={!isOnline || offlineQueue.length === 0}
            className="btn-ghost !py-2 !px-4 !text-xs disabled:opacity-30"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Sync Queue ({offlineQueue.length})
          </button>
        </div>
      </motion.div>

      {/* Scanner */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card-static overflow-hidden mb-6 relative"
      >
        <div className="p-4">
          <div id="reader" className="w-full rounded-xl overflow-hidden text-black" style={{ background: 'white' }}></div>
        </div>
        
        {/* Scan Result Overlay */}
        {scanResult && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`absolute inset-0 flex flex-col items-center justify-center p-6 backdrop-blur-xl z-10 
              ${scanResult.status === 'VALID' ? 'bg-green-500/80' : 'bg-red-500/80'}
            `}
          >
            {scanResult.status === 'VALID' ? (
              <>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                  <CheckCircle className="w-20 h-20 text-white mb-4" />
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-2">VALID PASS</h2>
                <p className="text-white/80 text-lg font-semibold">{scanResult.payload?.seat} • {scanResult.payload?.user_name}</p>
                {scanResult.offline && <p className="text-white/60 mt-3 text-sm font-medium badge bg-white/10 !py-1 !px-3">📡 Saved for Offline Sync</p>}
              </>
            ) : (
              <>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                  <XCircle className="w-20 h-20 text-white mb-4" />
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-2">INVALID</h2>
                <p className="text-white/80 text-lg font-semibold">{scanResult.msg}</p>
              </>
            )}
          </motion.div>
        )}
      </motion.div>
      
      <p className="text-center text-white/20 text-xs">Point camera at passenger's QR Code • RS256 signature verified client-side</p>
    </div>
  );
}
