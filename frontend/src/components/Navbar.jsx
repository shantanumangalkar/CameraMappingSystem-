import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, LogOut, Bell, User, MapPin, Building2 } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const userRole = typeof user?.role === 'object' ? user?.role?.name : user?.role;

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ROLE_ADMIN':
        return <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs px-2.5 py-1 rounded-full font-bold">SYSTEM ADMINISTRATOR</span>;
      case 'ROLE_POLICE_OFFICER':
        return <span className="bg-police-500/20 text-police-300 border border-police-500/30 text-xs px-2.5 py-1 rounded-full font-bold">POLICE OFFICER</span>;
      case 'ROLE_SURVEY_PERSON':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-2.5 py-1 rounded-full font-bold">FIELD SURVEYOR</span>;
      default:
        return null;
    }
  };

  return (
    <header className="h-16 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-police-700 to-police-500 flex items-center justify-center shadow-lg shadow-police-600/30 border border-police-400/40">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-base md:text-lg text-white leading-tight flex items-center gap-2">
            NATIONAL POLICE GIS SURVEILLANCE & CCTV MAPPING
            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">
              🇮🇳 CCTNS DIGITAL PORTAL
            </span>
          </h1>
          <p className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
            <Building2 className="w-3.5 h-3.5 text-police-400" />
            <span>{user?.policeStationName || 'Central Metropolitan Police Command HQ'}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {getRoleBadge(userRole)}

        <button className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors border border-slate-800">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-police-500 animate-pulse"></span>
        </button>

        <div className="h-6 w-px bg-slate-800"></div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-police-950 flex items-center justify-center text-police-300 font-bold border border-police-500/40">
            {user?.fullName?.charAt(0) || <User className="w-4 h-4" />}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-slate-200 leading-none">{user?.fullName || 'Police Official'}</p>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">{user?.username}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all ml-2"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
