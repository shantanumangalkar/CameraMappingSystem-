import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Camera, 
  FileSearch, 
  CheckCircle2, 
  Building2, 
  ClipboardList,
  Shield
} from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuth();
  const userRole = typeof user?.role === 'object' ? user?.role?.name : user?.role;

  // Single unified main entry for Live Map & Command Dashboard (User Management removed as requested)
  const navItems = [
    { label: 'Live GIS Map & Command', path: '/dashboard', icon: LayoutDashboard, roles: ['ROLE_ADMIN', 'ROLE_POLICE_OFFICER', 'ROLE_SURVEY_PERSON'] },
    { label: 'CCTV Camera Directory', path: '/cameras', icon: Camera, roles: ['ROLE_ADMIN', 'ROLE_POLICE_OFFICER', 'ROLE_SURVEY_PERSON'] },
    { label: 'Police Investigations', path: '/investigations', icon: FileSearch, roles: ['ROLE_ADMIN', 'ROLE_POLICE_OFFICER'] },
    { label: 'Field Verification Queue', path: '/verification', icon: CheckCircle2, roles: ['ROLE_ADMIN'] },
    { label: 'Police Stations Registry', path: '/stations', icon: Building2, roles: ['ROLE_ADMIN'] },
    { label: 'My Field Surveys', path: '/my-surveys', icon: ClipboardList, roles: ['ROLE_SURVEY_PERSON'] },
  ];

  const visibleItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <aside className="w-64 bg-slate-950/90 backdrop-blur-xl border-r border-slate-800 p-4 flex flex-col justify-between shrink-0 hidden md:flex">
      <div className="space-y-4">
        {/* Government Badge Header */}
        <div className="px-3 py-2 rounded-xl bg-police-950/60 border border-police-500/30 text-xs">
          <div className="flex items-center justify-between text-police-300 font-bold">
            <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
              <Shield className="w-3.5 h-3.5 text-police-400" />
              MHA Command Engine
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-police-600/30 font-mono text-police-200">
              {userRole ? userRole.replace('ROLE_', '') : 'GUEST'}
            </span>
          </div>
        </div>

        <nav className="flex flex-col gap-1.5">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 ${
                    isActive
                      ? 'bg-police-600/20 text-police-300 border border-police-500/40 shadow-lg shadow-police-950/50 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Official Seal */}
      <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-500 px-3 space-y-1">
        <p className="font-bold text-slate-400 uppercase tracking-wider">CCTNS Digital Portal</p>
        <p className="text-[9px] font-mono text-slate-600">Govt of India • MHA Encrypted</p>
      </div>
    </aside>
  );
};
