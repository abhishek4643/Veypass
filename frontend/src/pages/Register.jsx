import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Bus, Check, Flag, ArrowRight, ShieldCheck, Leaf, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const location = useLocation();
  const [isLoginView, setIsLoginView] = useState(location.pathname === '/login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoginView(location.pathname === '/login');
  }, [location.pathname]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token) {
      navigate('/routes');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLoginView) {
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', res.data.access_token);
        localStorage.setItem('role', res.data.role);
        toast.success('Login successful!');
        navigate('/routes');
        window.location.reload();
      } else {
        await api.post('/auth/register', { name, email, password, role: 'passenger' });
        toast.success('Account created successfully! Please log in.');
        setPassword(''); // Clear password for security
        navigate('/login');
      }
    } catch (err) {
      toast.error((isLoginView ? 'Login failed: ' : 'Registration failed: ') + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (email, password, label) => {
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
    <div className="fixed inset-0 z-[100] grid grid-cols-1 lg:grid-cols-2 min-h-screen font-sans bg-[#FBFDF7] text-[#20241C] overflow-y-auto">
      <style>{`
        @keyframes cruise {
          from { transform: translateX(-160px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      
      {/* LEFT : brand hero */}
      <aside className="bg-[#173404] text-[#EAF3DE] flex flex-col justify-between relative overflow-hidden pt-12 px-8 lg:px-14 min-h-[500px] lg:min-h-screen">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-[46px] h-[46px] rounded-xl bg-[#97C459] flex items-center justify-center">
              <Bus className="w-7 h-7 text-[#173404]" />
            </div>
            <div>
              <div className="font-heading text-[26px] font-bold tracking-wide">Vey<span className="text-[#97C459]">pass</span></div>
              <div className="text-[10.5px] tracking-[2.5px] uppercase text-[#C0DD97]">Bus ticket booking</div>
            </div>
          </div>

          <div className="max-w-[440px] mt-[8vh]">
            <h1 className="font-heading text-[clamp(30px,3.4vw,46px)] font-bold leading-[1.2]">
              Every great trip begins at <em className="not-italic text-[#97C459]">Stop 1</em>
            </h1>
            <p className="mt-4 text-[15px] leading-[1.7] text-[#C0DD97]">
              Book bus tickets across 2,400+ routes. Live tracking, seat selection, and instant refunds — all on one green pass.
            </p>
            <div className="flex gap-9 mt-8">
              <div>
                <p className="font-heading text-2xl font-semibold text-[#EAF3DE]">2,400+</p>
                <p className="text-xs text-[#C0DD97] mt-1">Routes covered</p>
              </div>
              <div>
                <p className="font-heading text-2xl font-semibold text-[#EAF3DE]">1.2M</p>
                <p className="text-xs text-[#C0DD97] mt-1">Happy passengers</p>
              </div>
              <div>
                <p className="font-heading text-2xl font-semibold text-[#EAF3DE]">4.8★</p>
                <p className="text-xs text-[#C0DD97] mt-1">App rating</p>
              </div>
            </div>
          </div>
        </div>

        {/* animated road scene */}
        <div className="relative h-[220px] -mx-8 lg:-mx-14 mt-12" aria-hidden="true">
          <svg viewBox="0 0 800 220" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-0 left-0 w-full h-full">
            <path d="M0 150 L140 70 L280 150 Z" fill="#27500A"/>
            <path d="M200 150 L380 40 L560 150 Z" fill="#1E4207"/>
            <path d="M480 150 L640 80 L800 150 Z" fill="#27500A"/>
            <circle cx="690" cy="42" r="24" fill="#EF9F27"/>
            <rect x="0" y="150" width="800" height="70" fill="#3B6D11"/>
            <rect x="0" y="176" width="800" height="30" fill="#27500A"/>
            <line x1="0" y1="191" x2="800" y2="191" stroke="#C0DD97" strokeWidth="4" strokeDasharray="26 24"/>
          </svg>
          <svg className="absolute bottom-[34px] left-[8%] animate-[cruise_1.2s_ease-out_both]" width="190" height="86" viewBox="0 0 190 86" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="6" width="182" height="60" rx="14" fill="#97C459"/>
            <rect x="18" y="18" width="28" height="22" rx="4" fill="#173404"/>
            <rect x="54" y="18" width="28" height="22" rx="4" fill="#173404"/>
            <rect x="90" y="18" width="28" height="22" rx="4" fill="#173404"/>
            <rect x="128" y="18" width="34" height="40" rx="4" fill="#EAF3DE"/>
            <rect x="4" y="50" width="182" height="8" fill="#EAF3DE"/>
            <rect x="168" y="30" width="14" height="8" rx="3" fill="#EF9F27"/>
            <circle cx="46" cy="70" r="14" fill="#0B0B0B"/>
            <circle cx="144" cy="70" r="14" fill="#0B0B0B"/>
            <circle cx="46" cy="70" r="5.5" fill="#B4B2A9"/>
            <circle cx="144" cy="70" r="5.5" fill="#B4B2A9"/>
          </svg>
        </div>
      </aside>

      {/* RIGHT : form panel */}
      <main className="flex items-center justify-center p-8 lg:p-12 pb-24 lg:pb-12 bg-[#FBFDF7]">
        <div className="w-full max-w-[430px]">
          <p className="text-[11px] tracking-[2.5px] uppercase text-[#639922] font-semibold">
            {isLoginView ? 'Welcome back, passenger' : 'New passenger'}
          </p>
          <h2 className="font-heading text-[32px] font-bold mt-2 mb-1">
            {isLoginView ? 'Board your account' : 'Create an account'}
          </h2>
          <p className="text-[14px] text-[#6B7062] mb-8">
            {isLoginView ? '2 stops between you and your seat.' : '3 stops between you and your seat.'}
          </p>

          <form onSubmit={handleSubmit} className="relative">
            {/* Vertical Line */}
            <div className="absolute left-[15px] top-[14px] bottom-[26px] w-[3px] bg-[#C0DD97] rounded-full" />

            {/* Stop 1: Name */}
            {!isLoginView && (
              <div className="flex gap-5 mb-6 relative">
                <div className={`shrink-0 w-[33px] h-[33px] border-[3px] rounded-full flex items-center justify-center font-heading text-[13px] font-bold mt-5 z-10 transition-colors ${name ? 'bg-[#3B6D11] text-[#EAF3DE] border-[#3B6D11]' : 'bg-[#EAF3DE] text-[#3B6D11] border-[#639922]'}`}>
                  {name ? <Check className="w-4 h-4" /> : '1'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 border-[1.5px] border-[#DCE5CF] rounded-[13px] bg-white px-4 transition-all focus-within:border-[#639922] focus-within:ring-4 focus-within:ring-[#97C459]/20">
                    <User className="w-[18px] h-[18px] text-[#639922]" />
                    <input 
                      type="text" 
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Full Name" 
                      required={!isLoginView}
                      className="flex-1 border-none outline-none bg-transparent font-sans text-[14.5px] text-[#20241C] py-[15px] placeholder:text-[#A9AE9F]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Stop 2: Email */}
            <div className="flex gap-5 mb-6 relative">
              <div className={`shrink-0 w-[33px] h-[33px] border-[3px] rounded-full flex items-center justify-center font-heading text-[13px] font-bold mt-5 z-10 transition-colors ${email ? 'bg-[#3B6D11] text-[#EAF3DE] border-[#3B6D11]' : 'bg-[#EAF3DE] text-[#3B6D11] border-[#639922]'}`}>
                {email ? <Check className="w-4 h-4" /> : (isLoginView ? '1' : '2')}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 border-[1.5px] border-[#DCE5CF] rounded-[13px] bg-white px-4 transition-all focus-within:border-[#639922] focus-within:ring-4 focus-within:ring-[#97C459]/20">
                  <Mail className="w-[18px] h-[18px] text-[#639922]" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email Address" 
                    required
                    className="flex-1 border-none outline-none bg-transparent font-sans text-[14.5px] text-[#20241C] py-[15px] placeholder:text-[#A9AE9F]"
                  />
                </div>
              </div>
            </div>

            {/* Stop 3: Password */}
            <div className="flex gap-5 mb-6 relative">
              <div className={`shrink-0 w-[33px] h-[33px] border-[3px] rounded-full flex items-center justify-center font-heading text-[13px] font-bold mt-5 z-10 transition-colors ${password ? 'bg-[#3B6D11] text-[#EAF3DE] border-[#3B6D11]' : 'bg-[#EAF3DE] text-[#3B6D11] border-[#639922]'}`}>
                {password ? <Check className="w-4 h-4" /> : (isLoginView ? '2' : '3')}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 border-[1.5px] border-[#DCE5CF] rounded-[13px] bg-white px-4 transition-all focus-within:border-[#639922] focus-within:ring-4 focus-within:ring-[#97C459]/20">
                  <Lock className="w-[18px] h-[18px] text-[#639922]" />
                  <input 
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password" 
                    required
                    className="flex-1 border-none outline-none bg-transparent font-sans text-[14.5px] text-[#20241C] py-[15px] placeholder:text-[#A9AE9F]"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="text-[#6B7062] hover:text-[#20241C] outline-none focus-visible:ring-2 focus-visible:ring-[#97C459] rounded">
                    {showPw ? <EyeOff className="w-[17px] h-[17px]" /> : <Eye className="w-[17px] h-[17px]" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Stop 4: Action */}
            <div className="flex gap-5 relative">
              <div className="shrink-0 w-[33px] h-[33px] border-[3px] rounded-full flex items-center justify-center font-heading text-[13px] font-bold mt-0.5 z-10 bg-[#3B6D11] border-[#3B6D11] text-[#EAF3DE]">
                <Flag className="w-[15px] h-[15px]" fill="currentColor" />
              </div>
              <div className="flex-1">
                <button type="submit" disabled={loading} className="w-full bg-[#3B6D11] hover:bg-[#27500A] active:scale-[0.985] text-[#EAF3DE] border-none rounded-[13px] font-heading text-[15.5px] font-semibold py-[15px] flex items-center justify-center gap-[9px] transition-all outline-none focus-visible:ring-4 focus-visible:ring-[#97C459]">
                  {loading ? 'Boarding...' : (
                    <>Board Veypass <ArrowRight className="w-5 h-5" /></>
                  )}
                </button>
                <div className="text-center text-[14px] text-[#6B7062] mt-[22px]">
                  {isLoginView ? (
                    <>New passenger? <Link to="/register" className="text-[#3B6D11] font-medium hover:underline outline-none focus-visible:ring-2 focus-visible:ring-[#97C459] rounded">Get your Vegpass</Link></>
                  ) : (
                    <>Already boarding? <Link to="/login" className="text-[#3B6D11] font-medium hover:underline outline-none focus-visible:ring-2 focus-visible:ring-[#97C459] rounded">Sign in here</Link></>
                  )}
                </div>
              </div>
            </div>

          </form>

        </div>
      </main>
    </div>
  );
}
