import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Camera, 
  FileSearch, 
  CheckCircle2, 
  ClipboardList, 
  Menu
} from 'lucide-react';

export const BottomNav = ({ onOpenMobileMenu }) => {
  const { user } = useAuth();
  const userRole = typeof user?.role === 'object' ? user?.role?.name : user?.role;

  const getNavItems = () => {
    if (userRole === 'ROLE_SURVEY_PERSON') {
      return [
        { label: 'GIS Map', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Directory', path: '/cameras', icon: Camera },
        { label: 'Surveys', path: '/my-surveys', icon: ClipboardList },
      ];
    }
    if (userRole === 'ROLE_ADMIN') {
      return [
        { label: 'Command', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Cases', path: '/investigations', icon: FileSearch },
        { label: 'Cameras', path: '/cameras', icon: Camera },
        { label: 'Verify', path: '/verification', icon: CheckCircle2 },
      ];
    }
    // Default Police Officer: Focus on Cases & Map
    return [
      { label: 'Live Map', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Cases', path: '/investigations', icon: FileSearch },
      { label: 'Cameras', path: '/cameras', icon: Camera },
    ];
  };

  const items = getNavItems();

  return (
    <div className="md:hidden fixed bottom-3 left-4 right-4 z-40 pointer-events-none">
      <nav 
        className="h-16 bg-white/95 backdrop-blur-md rounded-full border border-[#E5DFD9] px-3 flex items-center justify-around shadow-mc-card pointer-events-auto max-w-md mx-auto"
        aria-label="Mobile Navigation Bar"
      >
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-w-[54px] py-1 px-2 rounded-full transition-all duration-150 ${
                  isActive
                    ? 'text-[#141413] font-bold'
                    : 'text-[#696969] hover:text-[#141413] font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-full transition-colors ${isActive ? 'bg-[#141413] text-[#F3F0EE]' : ''}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}

        {/* Menu Drawer Trigger */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="flex flex-col items-center justify-center min-w-[54px] py-1 px-2 rounded-full text-[#696969] hover:text-[#141413] transition-colors font-medium"
          aria-label="Open Full Navigation Menu"
        >
          <div className="p-1.5 rounded-full hover:bg-[#F3F0EE]">
            <Menu className="w-4 h-4" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">More</span>
        </button>
      </nav>
    </div>
  );
};
