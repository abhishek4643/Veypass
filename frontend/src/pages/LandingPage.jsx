import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, Smartphone, Zap, TrendingUp, Link as LinkIcon, ArrowRight, Bus, ChevronRight } from 'lucide-react';

export default function LandingPage() {
  const features = [
    { icon: <LinkIcon className="w-5 h-5" />, title: "Hash-Chain Tickets", desc: "Immutable tickets linked cryptographically — altering one breaks the entire chain.", color: "from-accent1/20 to-accent1/5", iconBg: "bg-accent1/10 text-accent1" },
    { icon: <Smartphone className="w-5 h-5" />, title: "Offline Verification", desc: "RS256 signed QR codes verified by conductors without internet.", color: "from-accent2/20 to-accent2/5", iconBg: "bg-accent2/10 text-accent2" },
    { icon: <Shield className="w-5 h-5" />, title: "Ghost Seat Protection", desc: "Smart 5-minute concurrency locks prevent double-booking.", color: "from-green-500/20 to-green-500/5", iconBg: "bg-green-500/10 text-green-400" },
    { icon: <TrendingUp className="w-5 h-5" />, title: "AI Dynamic Pricing", desc: "Real-time demand forecasting adjusts fares using scikit-learn ML.", color: "from-orange-500/20 to-orange-500/5", iconBg: "bg-orange-500/10 text-orange-400" },
  ];

  const stats = [
    { value: "RS256", label: "Cryptographic Signing" },
    { value: "SHA-256", label: "Hash-Chain Integrity" },
    { value: "<50ms", label: "Offline Verify Time" },
    { value: "200+", label: "Concurrent Users" },
  ];

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center min-h-[85vh] text-center relative">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent1/5 border border-accent1/15 text-accent1 text-sm mb-8 backdrop-blur-sm"
          >
            <div className="pulse-dot bg-accent1" />
            CodeAlpha Cloud Computing — Task 3
          </motion.div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-white">The Future of</span>
            <br />
            <span className="bg-gradient-to-r from-accent1 via-teal-300 to-accent2 bg-clip-text text-transparent">
              Bus Booking
            </span>
          </h1>
          
          <p className="text-base sm:text-lg text-white/50 mb-12 leading-relaxed max-w-2xl mx-auto">
            Veypass is a cloud-native platform with cryptographically tamper-proof tickets, 
            offline QR validation, AI-driven dynamic pricing, and auto-scaling architecture.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="btn-primary !px-8 !py-4 !text-base">
              <Bus className="w-5 h-5" />
              Book Your Pass
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login" className="btn-ghost !px-8 !py-4">
              Sign In
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        {/* Floating decorative elements */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-accent1/5 rounded-full blur-3xl animate-float pointer-events-none hidden lg:block" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent2/5 rounded-full blur-3xl animate-float pointer-events-none hidden lg:block" style={{ animationDelay: '3s' }} />
      </section>

      {/* Stats Row */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="w-full max-w-4xl mb-20"
      >
        <div className="glass-card-static p-1">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {stats.map((stat, i) => (
              <div key={i} className={`text-center py-6 px-4 ${i < stats.length - 1 ? 'border-r border-white/5' : ''}`}>
                <p className="text-xl sm:text-2xl font-bold font-heading text-accent1">{stat.value}</p>
                <p className="text-xs sm:text-sm text-white/40 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Features Grid */}
      <section className="w-full max-w-5xl mb-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why Veypass?</h2>
          <p className="text-white/40 max-w-lg mx-auto">Every feature is built to solve a real problem in traditional bus booking systems.</p>
        </motion.div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {features.map((f, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 sm:p-8 group"
            >
              <div className={`w-11 h-11 rounded-xl ${f.iconBg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                {f.icon}
              </div>
              <h3 className="font-heading font-bold text-lg mb-2 text-white">{f.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="w-full max-w-3xl mb-20"
      >
        <div className="glass-card-static p-8 sm:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent1/5 via-transparent to-accent2/5 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to experience the future?</h2>
            <p className="text-white/40 mb-8 max-w-md mx-auto">Create your account and book your first tamper-proof digital bus pass in under 60 seconds.</p>
            <Link to="/register" className="btn-primary !px-10 !py-4">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-8 text-center">
        <p className="text-white/20 text-sm">
          Built for CodeAlpha Cloud Computing Internship — Task 3 &nbsp;·&nbsp; Veypass © 2026
        </p>
      </footer>
    </div>
  );
}
