import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CameraList } from './pages/CameraList';
import { InvestigationView } from './pages/InvestigationView';
import { VerificationQueue } from './pages/VerificationQueue';
import { MyFieldSurveys } from './pages/MyFieldSurveys';
import { ShieldAlert } from 'lucide-react';

const ProtectedLayout = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = typeof user?.role === 'object' ? user?.role?.name : user?.role;

  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return (
      <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          <main className="flex-1 p-8 flex items-center justify-center">
            <div className="glass-card max-w-md w-full p-8 text-center space-y-4 border-l-4 border-l-rose-500">
              <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto animate-pulse" />
              <div>
                <h3 className="text-lg font-bold text-white">Access Restricted (403 Forbidden)</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Field Surveyors <span className="font-mono text-rose-300">({userRole || 'ROLE_SURVEY_PERSON'})</span> are authorized strictly for camera surveying. You cannot access police investigation cases or verification queues.
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedLayout allowedRoles={['ROLE_ADMIN', 'ROLE_POLICE_OFFICER', 'ROLE_SURVEY_PERSON']}>
            <Dashboard />
          </ProtectedLayout>
        }
      />
      <Route
        path="/map"
        element={
          <ProtectedLayout allowedRoles={['ROLE_ADMIN', 'ROLE_POLICE_OFFICER', 'ROLE_SURVEY_PERSON']}>
            <Dashboard />
          </ProtectedLayout>
        }
      />
      <Route
        path="/cameras"
        element={
          <ProtectedLayout allowedRoles={['ROLE_ADMIN', 'ROLE_POLICE_OFFICER', 'ROLE_SURVEY_PERSON']}>
            <CameraList />
          </ProtectedLayout>
        }
      />
      <Route
        path="/investigations"
        element={
          <ProtectedLayout allowedRoles={['ROLE_ADMIN', 'ROLE_POLICE_OFFICER']}>
            <InvestigationView />
          </ProtectedLayout>
        }
      />
      <Route
        path="/verification"
        element={
          <ProtectedLayout allowedRoles={['ROLE_ADMIN']}>
            <VerificationQueue />
          </ProtectedLayout>
        }
      />
      <Route
        path="/my-surveys"
        element={
          <ProtectedLayout allowedRoles={['ROLE_SURVEY_PERSON']}>
            <MyFieldSurveys />
          </ProtectedLayout>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
