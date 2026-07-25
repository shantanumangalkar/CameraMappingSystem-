import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { CameraMap } from '../components/CameraMap';
import { Camera, CheckCircle, AlertTriangle, FileSearch, Building2, Eye, Activity, Navigation, Target } from 'lucide-react';
import { motion } from 'framer-motion';

export const Dashboard = () => {
  const { user, isAdmin, isOfficer } = useAuth();
  const navigate = useNavigate();
  const userRole = typeof user?.role === 'object' ? user?.role?.name : user?.role;
  const isUserAdmin = isAdmin || userRole === 'ROLE_ADMIN';
  const isUserOfficer = isOfficer || userRole === 'ROLE_POLICE_OFFICER';

  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedCaseId, setSelectedCaseId] = useState(null);

  // Auto-fetch system GPS location by default on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: Math.round(position.coords.latitude * 100000) / 100000,
            lng: Math.round(position.coords.longitude * 100000) / 100000,
          });
        },
        (error) => {
          console.warn('System GPS auto-capture skipped:', error);
        }
      );
    }
  }, []);

  // Query System KPI Stats for Admin
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats'),
    enabled: isUserAdmin,
    refetchInterval: 3000,
  });

  // Query All CCTV Cameras for Map
  const { data: cameraData } = useQuery({
    queryKey: ['nearby-cameras-all'],
    queryFn: async () => {
      const res = await api.get('/cameras/search?size=1000');
      return res?.data?.content || [];
    },
    refetchInterval: 3000,
  });

  // Query Police Station Headquarters for Map
  const { data: stationsData } = useQuery({
    queryKey: ['police-stations'],
    queryFn: () => api.get('/stations').catch(() => null),
    refetchInterval: 10000,
  });

  // Query Active Investigation Cases to link Crime Scene Target Pin on Dashboard Map
  const { data: casesData } = useQuery({
    queryKey: ['dashboard-investigations'],
    queryFn: async () => {
      const res = await api.get('/investigations?size=100').catch(() => null);
      return res?.data?.content || [];
    },
    refetchInterval: 3000,
  });

  const handleFetchCurrentGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: Math.round(position.coords.latitude * 100000) / 100000,
            lng: Math.round(position.coords.longitude * 100000) / 100000,
          });
        },
        (error) => {
          alert('GPS location capture failed. Map will display overall metropolitan CCTV network.');
        }
      );
    }
  };

  const stats = statsData?.data || {};
  const cameras = cameraData || [];
  const stations = stationsData?.data?.content || stationsData?.data || [];
  const rawCases = casesData || [];

  // Filter investigations: Admin sees all; Officer sees his assigned cases
  const availableCases = rawCases.filter((c) => {
    if (isUserAdmin) return true;
    return (
      c.assignedOfficerId === user?.id ||
      c.assignedOfficerName === user?.fullName ||
      c.createdBy === user?.username
    );
  });

  // Selected Active Investigation Case Object
  const activeCase = availableCases.find((c) => c.id === selectedCaseId) || availableCases[0];

  const crimeLocationProps = activeCase?.latitude && activeCase?.longitude ? {
    lat: activeCase.latitude,
    lng: activeCase.longitude
  } : null;

  const cards = [
    { title: 'Total CCTV Cameras', value: stats.totalCameras || 0, icon: Camera, color: 'text-police-400', bg: 'from-police-600/20 to-police-900/10', path: '/cameras' },
    { title: 'Active Live Stream', value: stats.activeCameras || 0, icon: Eye, color: 'text-emerald-400', bg: 'from-emerald-600/20 to-emerald-900/10', path: '/cameras' },
    { title: 'Offline / Maintenance', value: stats.offlineCameras || 0, icon: AlertTriangle, color: 'text-rose-400', bg: 'from-rose-600/20 to-rose-900/10', path: '/cameras' },
    { title: 'Pending Verification', value: stats.pendingVerificationCameras || 0, icon: CheckCircle, color: 'text-amber-400', bg: 'from-amber-600/20 to-amber-900/10', path: '/verification' },
    { title: 'Active Investigations', value: stats.openCases || availableCases.length, icon: FileSearch, color: 'text-indigo-400', bg: 'from-indigo-600/20 to-indigo-900/10', path: '/investigations' },
    { title: 'Police Stations', value: stats.totalPoliceStations || 0, icon: Building2, color: 'text-sky-400', bg: 'from-sky-600/20 to-sky-900/10', path: '/stations' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 border-l-4 border-l-police-500">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {isUserAdmin ? 'Central Command Center (Administrator)' : 'Police Patrol GIS Live Map'}
            <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isUserAdmin 
              ? 'Real-time geospatial CCTV tracking, police station headquarters, and active case analytics.'
              : 'Real-time CCTV camera mapping, active crime scene targets, and patrol location tracking.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleFetchCurrentGPS}
            className="px-3.5 py-1.5 rounded-xl bg-police-600/20 hover:bg-police-600/30 text-police-300 border border-police-500/30 font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <Navigation className="w-4 h-4 text-police-400" />
            My Current Location GPS
          </button>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-emerald-400 font-bold">REAL-TIME GIS ACTIVE</span>
          </div>
        </div>
      </div>

      {/* KPI Cards: VISIBLE TO ADMIN ONLY */}
      {isUserAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => card.path && navigate(card.path)}
                className={`glass-card p-4 bg-gradient-to-b ${card.bg} border-slate-800/80 cursor-pointer hover:border-police-500/50 transition-all`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">{card.title}</span>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <p className="text-2xl font-extrabold text-white mt-3">{isStatsLoading ? '...' : card.value}</p>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Live Map Section with Cameras, Active Investigations & Police Stations */}
      <div className="glass-card p-5 h-[580px] flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-police-400" />
            Live Police GIS Map (Active Investigations, Cameras & Police Stations)
          </h3>

          {/* Active Investigation Target Selector Dropdown */}
          {availableCases.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-rose-400 font-bold flex items-center gap-1">
                <Target className="w-3.5 h-3.5" /> Investigation Focus:
              </span>
              <select
                value={activeCase?.id || ''}
                onChange={(e) => setSelectedCaseId(Number(e.target.value))}
                className="bg-slate-900 text-slate-200 border border-rose-500/40 text-xs rounded-lg px-2.5 py-1 font-semibold focus:outline-none focus:border-rose-400"
              >
                {availableCases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.caseNumber} - {c.title} ({c.policeStationName || 'Station HQ'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex-1 w-full relative">
          <CameraMap 
            cameras={cameras} 
            stations={stations}
            crimeLocation={crimeLocationProps}
            searchRadius={activeCase?.searchRadiusMeters || 500}
            selectedLocation={currentLocation}
            autoFit={true} 
          />
        </div>
      </div>
    </div>
  );
};
