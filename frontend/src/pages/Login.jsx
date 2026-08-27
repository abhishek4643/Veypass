import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Mail, Lock, Bus } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token) {
      navigate('/routes');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('role', res.data.role);
      toast.success('Login successful');
      navigate('/routes');
      window.location.reload();
    } catch (err) {
      toast.error('Invalid credentials');
      setLoading(false);
    }
  };

  const quickLogin = async (email, password, label) => {
    setEmail(email);
    setPassword(password);
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('role', res.data.role);
      toast.success(`Logged in as ${label}`);
      navigate('/routes');
      window.location.reload();
    } catch (err) {
      toast.error('Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-8rem)] px-4 py-2 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[460px]"
      >
        <div className="bg-[#131A24] border border-[#1E2A3A] rounded-[16px] shadow-2xl px-8 py-5">
          
          <div className="flex flex-col items-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00E5C3] to-[#009b84] flex items-center justify-center shadow-lg shadow-[#00E5C3]/20 mb-2">
              <Bus className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Sign in to Veypass</h2>
            <p className="text-[#8B98A9] text-sm mt-1">Enter your details below to continue.</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <div>
              <label className="text-sm font-medium text-white/80 mb-1.5 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#8B98A9]" />
                <input 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-[#1E2A3A] text-white text-sm rounded-lg py-2 pl-10 pr-4 focus:ring-2 focus:ring-[#00E5C3]/30 focus:border-[#00E5C3] outline-none transition-all placeholder:text-[#8B98A9]/50"
                  required
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-white/80">Password</label>
                <a href="#" className="text-xs text-[#00E5C3] hover:underline font-medium">Forgot password?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#8B98A9]" />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-[#1E2A3A] text-white text-sm rounded-lg py-2 pl-10 pr-4 focus:ring-2 focus:ring-[#00E5C3]/30 focus:border-[#00E5C3] outline-none transition-all placeholder:text-[#8B98A9]/50"
                  required
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-[#00E5C3] hover:bg-[#00d1b2] text-[#0A0E1A] font-semibold text-sm py-2 rounded-lg mt-1 transition-all flex items-center justify-center shadow-lg shadow-[#00E5C3]/10"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-[#0A0E1A]/20 border-t-[#0A0E1A] rounded-full animate-spin" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>
          
          <div className="mt-4 text-center text-sm text-[#8B98A9]">
            Don't have an account? <Link to="/register" className="text-[#00E5C3] hover:underline font-medium ml-1">Sign up</Link>
          </div>
          
        </div>
      </motion.div>
    </div>
  );
}
