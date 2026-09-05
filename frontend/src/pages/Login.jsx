import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, User, AlertCircle, ArrowRight, ShieldCheck, Target, Video } from 'lucide-react';
import { motion } from 'framer-motion';

export const Login = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(username, password);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.message);
    }
  };

  const fillQuickCredentials = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen w-full bg-[#141413] flex flex-col justify-between relative overflow-x-hidden text-[#141413]">
      {/* Top Government Official Strip */}
      <div className="w-full bg-[#141413] text-[#FCFBFA] py-2 px-4 sm:px-8 text-xs flex items-center justify-between border-b border-[#262627] z-20 shrink-0">
        <div className="flex items-center gap-2 max-w-[1800px] mx-auto w-full">
          <span className="font-semibold text-white">🇮🇳 Government of India</span>
          <span className="text-[#696969]">•</span>
          <span className="text-[#D1CDC7]">National Police GIS &amp; CCTNS Command</span>
        </div>
      </div>

      {/* Main 100% Full-Screen Edge-to-Edge Split Layout */}
      <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-68px)]">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: Clean Police Surveillance Visual & Concise Copy */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 xl:col-span-8 relative min-h-[300px] sm:min-h-[380px] lg:min-h-full flex flex-col justify-between p-6 sm:p-10 lg:p-14 xl:p-16 overflow-hidden select-none bg-[#141413]">
          {/* Edge-to-edge high resolution command center photo */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
            style={{ backgroundImage: `url('/police-command-hero.jpg')` }}
          />

          {/* Cinematic Vignettes for Crystal Clear Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#141413] via-[#141413]/55 to-[#141413]/25 pointer-events-none" />
          <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-[#141413]/40 via-transparent to-[#141413]/80 pointer-events-none" />

          {/* Top Status Badge */}
          <div className="relative z-10 flex items-center gap-2">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide bg-black/75 backdrop-blur-md text-white border border-white/20 shadow-md">
              <span className="w-2 h-2 rounded-full bg-[#CF4500] animate-pulse"></span>
              <span>LIVE POLICE GIS RADAR</span>
            </span>
          </div>

          {/* Bottom Concise Editorial Intel Overlay */}
          <div className="relative z-10 max-w-xl space-y-2.5 pt-10 sm:pt-14 lg:pt-0 text-white">
            <div className="mc-eyebrow text-xs">
              <span className="w-2 h-2 rounded-full bg-[#F37338]"></span>
              <span className="text-[#F37338] tracking-[+0.06em]">POLICE SURVEILLANCE &amp; MAPPING</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-medium tracking-[-0.02em] leading-tight text-white drop-shadow-md">
              CCTV Mapping &amp; Crime Reconnaissance
            </h1>

            <p className="text-xs sm:text-sm text-[#D1CDC7] font-normal leading-relaxed max-w-lg drop-shadow-sm">
              Geospatial intelligence platform connecting municipal and private CCTV feeds for police investigations and rapid response.
            </p>

            {/* Feature Telemetry Pills */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <div className="px-3 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/15 text-xs text-white flex items-center gap-1.5 shadow-sm">
                <Target className="w-3.5 h-3.5 text-[#F37338]" />
                <span>GIS Radar</span>
              </div>
              <div className="px-3 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/15 text-xs text-white flex items-center gap-1.5 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Encrypted CCTNS</span>
              </div>
              <div className="hidden sm:flex px-3 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/15 text-xs text-white items-center gap-1.5 shadow-sm">
                <Video className="w-3.5 h-3.5 text-[#3860BE]" />
                <span>Live CCTV Feeds</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Authentication Portal                       */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 xl:col-span-4 bg-[#FCFBFA] border-t lg:border-t-0 lg:border-l border-[#E5DFD9] flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-14 relative z-10">
          
          {/* Subtle Ghost Watermark */}
          <div className="absolute right-6 top-6 text-6xl font-bold text-[#E8E2DA]/30 select-none pointer-events-none tracking-[-0.04em]">
            CCTNS
          </div>

          <div className="my-auto w-full max-w-md mx-auto space-y-5 relative z-10 py-6 lg:py-0">
            {/* Official Police Department Shield Emblem & Header */}
            <div className="flex flex-col items-center text-center">
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-white flex items-center justify-center shadow-mc-card mb-3 border border-[#E5DFD9] p-2 hover:scale-105 transition-transform">
                <img 
                  src="/police-logo.png" 
                  alt="Police Department Emblem" 
                  className="w-full h-full object-contain drop-shadow-xs" 
                />
              </div>

              <div className="mc-eyebrow justify-center text-[11px] mb-1">
                <span className="mc-eyebrow-dot"></span>
                <span>POLICE GIS PORTAL</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-medium text-[#141413] tracking-[-0.02em]">
                Officer Login
              </h2>
              <p className="text-xs text-[#696969] mt-0.5">
                Authorized Police Personnel Access
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="p-3.5 rounded-[20px] bg-[#FDF0EE] border border-[#F8C6BC] text-[#CF4500] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Credentials Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#141413] mb-1.5 uppercase tracking-[+0.04em]">
                  Username / Badge ID
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#696969] absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mc-input w-full pl-10 py-3 text-sm bg-white shadow-xs"
                    placeholder="Enter badge username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#141413] mb-1.5 uppercase tracking-[+0.04em]">
                  Secret Passcode
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#696969] absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mc-input w-full pl-10 py-3 text-sm bg-white shadow-xs"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mc-btn-primary w-full mt-5 py-3.5 text-sm shadow-md"
              >
                {loading ? 'Authenticating Officer...' : 'Sign In to Investigation Command'}
                <ArrowRight className="w-4 h-4 text-[#F37338]" />
              </button>
            </form>

            {/* Quick Demo Access Roles */}
            <div className="border-t border-[#E5DFD9] pt-5">
              <p className="text-[11px] text-[#696969] text-center font-bold mb-3 uppercase tracking-[+0.04em]">
                Quick Demo Access Roles
              </p>
              <div className="grid grid-cols-3 gap-2.5 text-xs">
                <button
                  type="button"
                  onClick={() => fillQuickCredentials('admin', 'admin123')}
                  className="py-2 px-3 rounded-[20px] bg-white hover:bg-[#F3F0EE] border border-[#D1CDC7] text-[#141413] text-center font-medium transition-colors text-xs shadow-xs"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickCredentials('officer1', 'officer123')}
                  className="py-2 px-3 rounded-[20px] bg-white hover:bg-[#F3F0EE] border border-[#D1CDC7] text-[#3860BE] text-center font-medium transition-colors text-xs shadow-xs"
                >
                  Officer
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickCredentials('surveyor1', 'surveyor123')}
                  className="py-2 px-3 rounded-[20px] bg-white hover:bg-[#F3F0EE] border border-[#D1CDC7] text-[#B56708] text-center font-medium transition-colors text-xs shadow-xs"
                >
                  Surveyor
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Security Notice */}
          <div className="pt-4 text-center text-[11px] text-[#696969] font-mono shrink-0">
            Classified Law Enforcement Access • BNS 2023 &amp; IT Act Sec 66
          </div>
        </div>
      </div>

      {/* Dark Warm-Black Editorial Footer */}
      <footer className="w-full py-2.5 px-6 sm:px-8 text-center text-xs text-[#D1CDC7] bg-[#141413] border-t border-[#262627] z-20 shrink-0 space-y-0.5">
        <p className="font-medium text-white text-xs">
          National Crime Records Bureau &amp; Police GIS Infrastructure Network
        </p>
        <p className="text-[11px] text-[#696969]">
          Classified Law Enforcement Portal • Authorized Law Enforcement Personnel Only
        </p>
      </footer>
    </div>
  );
};
