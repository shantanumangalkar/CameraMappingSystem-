import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Animated Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-police-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md glass-card p-8 z-10 relative"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-police-600 to-police-400 flex items-center justify-center shadow-xl shadow-police-600/30 mb-4">
            <Shield className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">POLICE CAMERA MAPPING</h2>
          <p className="text-xs text-slate-400 mt-1">Smart City Law Enforcement GIS Network</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Username / Badge ID</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="glass-input w-full pl-10"
                placeholder="Enter username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input w-full pl-10"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="glass-button-primary w-full mt-6 py-3"
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Accounts Quick Login */}
        <div className="mt-8 border-t border-slate-800 pt-5">
          <p className="text-[11px] text-slate-400 text-center font-medium mb-3">QUICK DEMO ROLES</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              onClick={() => fillQuickCredentials('admin', 'admin123')}
              className="px-2 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-purple-300 text-center font-medium transition-colors"
            >
              Admin
            </button>
            <button
              onClick={() => fillQuickCredentials('officer1', 'officer123')}
              className="px-2 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-police-300 text-center font-medium transition-colors"
            >
              Officer
            </button>
            <button
              onClick={() => fillQuickCredentials('surveyor1', 'surveyor123')}
              className="px-2 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-amber-300 text-center font-medium transition-colors"
            >
              Surveyor
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
