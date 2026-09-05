import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { CameraMap } from '../components/CameraMap';
import { 
  Camera, 
  Search, 
  Plus, 
  MapPin, 
  Eye, 
  Navigation, 
  QrCode, 
  X, 
  Map, 
  Layers, 
  User, 
  Phone, 
  ShieldCheck, 
  Lock, 
  Compass, 
  AlertTriangle,
  LayoutGrid,
  Table as TableIcon,
  ArrowRight,
  Shield,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

export const CameraList = () => {
  const { user, isAdmin, isSurveyor } = useAuth();
  const userRole = typeof user?.role === 'object' ? user?.role?.name : user?.role;
  const isUserSurveyor = isSurveyor || userRole === 'ROLE_SURVEY_PERSON';

  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingCamera, setViewingCamera] = useState(null);
  const [showMapView, setShowMapView] = useState(true);
  const [useMapPicker, setUseMapPicker] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  
  // Default to 'cards' on mobile (< 768px), 'table' on desktop
  const [viewMode, setViewMode] = useState(() => {
    return window.innerWidth < 768 ? 'cards' : 'table';
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentLocation({
            lat: Math.round(pos.coords.latitude * 100000) / 100000,
            lng: Math.round(pos.coords.longitude * 100000) / 100000,
          });
        },
        (err) => console.warn('GPS auto-capture skipped:', err)
      );
    }
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['cameras', searchTerm, selectedType, selectedStatus],
    queryFn: () => {
      let params = new URLSearchParams();
      if (searchTerm) params.append('query', searchTerm);
      if (selectedType) params.append('cameraType', selectedType);
      if (selectedStatus) params.append('cameraStatus', selectedStatus);
      params.append('size', '1000');
      return api.get(`/cameras/search?${params.toString()}`);
    },
    refetchInterval: 3000,
  });

  const [errorMessage, setErrorMessage] = useState('');

  const getInitialForm = () => ({
    cameraCode: `CAM-${Date.now().toString().slice(-5)}${Math.floor(10 + Math.random() * 90)}`,
    cameraName: 'Surveyed CCTV Camera Point',
    cameraType: 'PTZ',
    latitude: 21.1458,
    longitude: 79.0882,
    city: 'Nagpur',
    state: 'Maharashtra',
    area: 'Central Zone',
    fullAddress: 'Main Market Road, Nagpur',
    cardinalDirection: 'EAST',
    directionAngle: 90,
    coverageRadiusMeters: 100,
    fovAngle: 60,
    ownerName: 'Commercial Store Owner',
    ownerContact: '+91 9876543210',
    ownerType: 'COMMERCIAL',
  });

  const [form, setForm] = useState(getInitialForm());

  useEffect(() => {
    if (showAddModal) {
      setForm(getInitialForm());
      setErrorMessage('');
      if (navigator.geolocation) {
        try {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const lat = pos?.coords?.latitude;
              const lng = pos?.coords?.longitude;
              if (typeof lat === 'number' && !isNaN(lat) && typeof lng === 'number' && !isNaN(lng)) {
                setForm((prev) => ({
                  ...prev,
                  latitude: Math.round(lat * 100000) / 100000,
                  longitude: Math.round(lng * 100000) / 100000,
                }));
              }
            },
            (err) => console.warn('GPS auto-capture skipped:', err)
          );
        } catch (e) {}
      }
    }
  }, [showAddModal]);

  const addCameraMutation = useMutation({
    mutationFn: (newCam) => api.post('/cameras', newCam),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      queryClient.invalidateQueries({ queryKey: ['nearby-cameras-all'] });
      queryClient.invalidateQueries({ queryKey: ['pending-cameras'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['my-surveyed-cameras'] });
      setShowAddModal(false);
      setErrorMessage('');
      setForm(getInitialForm());
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to submit camera survey. Please verify fields.';
      setErrorMessage(msg);
    },
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!form.cameraName || !form.latitude || !form.longitude) {
      setErrorMessage('Please fill in Camera Name and valid GPS coordinates.');
      return;
    }
    addCameraMutation.mutate({
      ...form,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      directionAngle: parseFloat(form.directionAngle) || 0,
      coverageRadiusMeters: parseFloat(form.coverageRadiusMeters) || 100,
    });
  };

  const handleGetCurrentGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setForm((prev) => ({
            ...prev,
            latitude: Math.round(position.coords.latitude * 100000) / 100000,
            longitude: Math.round(position.coords.longitude * 100000) / 100000,
          }));
        },
        () => alert('GPS capture timed out.')
      );
    }
  };

  const handleMapLocationSelect = (a, b) => {
    let lat, lng;
    if (typeof a === 'object' && a !== null) {
      lat = a.lat !== undefined ? a.lat : a.latitude;
      lng = a.lng !== undefined ? a.lng : a.longitude;
    } else {
      lat = a;
      lng = b;
    }
    const numLat = parseFloat(lat);
    const numLng = parseFloat(lng);
    if (!isNaN(numLat) && !isNaN(numLng)) {
      const roundedLat = Math.round(numLat * 100000) / 100000;
      const roundedLng = Math.round(numLng * 100000) / 100000;
      setForm((prev) => ({
        ...prev,
        latitude: roundedLat,
        longitude: roundedLng,
      }));
    }
  };

  const cameras = data?.data?.content || [];

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Top Police GIS Registry Banner */}
      <div className="mc-stadium p-5 sm:p-7 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[100px] md:text-[140px] font-bold text-[#E8E2DA]/40 select-none pointer-events-none tracking-[-0.04em] pr-4">
          CCTV GIS
        </div>

        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="mc-eyebrow">
            <span className="mc-eyebrow-dot"></span>
            <span>POLICE SURVEILLANCE INFRASTRUCTURE</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-medium text-[#141413] tracking-[-0.02em] leading-tight">
            Metropolitan CCTV Camera Registry
          </h1>

          <p className="text-sm md:text-base text-[#696969] font-normal leading-relaxed">
            Geocoded surveillance nodes, directional coverage angles, optical specs, and civilian/police camera owners for crime investigation.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => setShowMapView(!showMapView)}
            className={`mc-btn-secondary ${showMapView ? 'bg-[#141413] text-[#FCFBFA]' : ''}`}
          >
            <Map className="w-4 h-4" />
            <span>{showMapView ? 'Hide GIS Radar' : 'Show GIS Radar'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="mc-btn-primary"
          >
            <Plus className="w-4 h-4 text-[#F37338]" />
            <span>Survey New Camera</span>
          </button>
        </div>
      </div>

      {/* Embedded Police GIS Map Radar (Collapsible) */}
      {showMapView && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mc-stadium p-4 sm:p-6 md:p-7 space-y-3"
        >
          <div className="flex items-center justify-between border-b border-[#E5DFD9] pb-3">
            <div className="mc-eyebrow">
              <span className="mc-eyebrow-dot"></span>
              <span>LIVE GEOSPATIAL CCTV RECONNAISSANCE</span>
            </div>
            <span className="text-xs font-mono font-medium text-[#696969]">
              {cameras.length} nodes plotted
            </span>
          </div>

          <div className="h-[320px] sm:h-[420px] md:h-[480px] w-full relative rounded-[24px] sm:rounded-[32px] overflow-hidden border border-[#E5DFD9] bg-[#F3F0EE]">
            <CameraMap
              cameras={cameras}
              selectedLocation={currentLocation}
              selectedCameraId={viewingCamera?.id}
              onSelectCamera={(cam) => setViewingCamera(cam)}
              autoFit={true}
            />
          </div>
        </motion.div>
      )}

      {/* Floating Pill Search & Filter Controls */}
      <div className="bg-white border border-[#E5DFD9] rounded-full p-2 sm:p-2.5 shadow-mc-card flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full flex items-center pl-3">
          <Search className="w-4 h-4 text-[#696969] shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by camera code, area, landmark, owner name..."
            className="w-full bg-transparent text-sm text-[#141413] placeholder-[#696969] px-3 py-1.5 focus:outline-none"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              aria-label="Clear search input"
              className="text-[#696969] hover:text-[#141413] pr-3"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns & View Mode Toggles */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto pr-1">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            aria-label="Filter by Camera Hardware Type"
            className="mc-input text-xs py-1.5 px-3 font-medium border-[#D1CDC7] text-[#141413] bg-[#FCFBFA]"
          >
            <option value="">All Hardware Types</option>
            <option value="PTZ">PTZ (Pan-Tilt-Zoom)</option>
            <option value="DOME">Dome Camera</option>
            <option value="BULLET">Bullet Camera</option>
            <option value="ANPR">ANPR (License Plate)</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            aria-label="Filter by Live Stream Status"
            className="mc-input text-xs py-1.5 px-3 font-medium border-[#D1CDC7] text-[#141413] bg-[#FCFBFA]"
          >
            <option value="">All Stream Statuses</option>
            <option value="ACTIVE">Online Only</option>
            <option value="OFFLINE">Offline Only</option>
          </select>

          {/* Cards vs Table Pill Toggle */}
          <div className="flex items-center bg-[#F3F0EE] p-1 rounded-full border border-[#D1CDC7]">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-full transition-all ${
                viewMode === 'cards' 
                  ? 'bg-white text-[#141413] shadow-xs' 
                  : 'text-[#696969] hover:text-[#141413]'
              }`}
              title="Portrait Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-full transition-all ${
                viewMode === 'table' 
                  ? 'bg-white text-[#141413] shadow-xs' 
                  : 'text-[#696969] hover:text-[#141413]'
              }`}
              title="Registry Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results Header Count */}
      <div className="flex items-center justify-between px-2">
        <p className="text-xs font-medium text-[#696969]">
          Showing <span className="font-bold text-[#141413]">{cameras.length}</span> registered police surveillance nodes
        </p>
      </div>

      {/* Content: Cards View vs Table View */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {isLoading ? (
            <div className="col-span-full mc-stadium p-12 text-center text-[#696969]">
              <div className="animate-pulse space-y-3 max-w-sm mx-auto">
                <div className="h-5 bg-[#E5DFD9] rounded-full w-2/3 mx-auto"></div>
                <div className="h-4 bg-[#E5DFD9] rounded-full w-1/2 mx-auto"></div>
              </div>
            </div>
          ) : cameras.length === 0 ? (
            <div className="col-span-full mc-stadium p-12 text-center space-y-3">
              <Camera className="w-12 h-12 text-[#696969] mx-auto opacity-50" />
              <h3 className="text-lg font-medium text-[#141413]">No CCTV Cameras Found</h3>
              <p className="text-xs text-[#696969] max-w-sm mx-auto">
                No surveillance nodes matched your current filter criteria.
              </p>
            </div>
          ) : (
            cameras.map((cam, idx) => (
              <motion.div
                key={cam.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                className="mc-card p-5 flex flex-col justify-between group hover:border-[#D1CDC7] hover:shadow-mc-elevated transition-all duration-200"
              >
                <div className="space-y-4">
                  {/* Mastercard Circular Portrait with Attached White Satellite Micro-CTA */}
                  <div className="flex items-center justify-center pt-2">
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32">
                      {/* Circular Camera Mask */}
                      <div className="w-full h-full rounded-full bg-[#F3F0EE] border-2 border-[#E5DFD9] flex flex-col items-center justify-center text-center p-3 shadow-inner overflow-hidden group-hover:scale-[1.02] transition-transform">
                        <Camera className="w-7 h-7 text-[#141413] mb-1" />
                        <span className="font-mono text-[10px] font-bold text-[#141413] uppercase tracking-wider">{cam.cameraType}</span>
                        <span className={`text-[9px] font-semibold mt-0.5 ${cam.cameraStatus === 'ACTIVE' ? 'text-[#0A7334]' : 'text-[#CF4500]'}`}>
                          {cam.cameraStatus === 'ACTIVE' ? '● ONLINE' : '● OFFLINE'}
                        </span>
                      </div>

                      {/* Docked White Satellite CTA Button (Moon motif) */}
                      <button
                        onClick={() => setViewingCamera(cam)}
                        className="satellite-cta absolute -bottom-1 -right-1"
                        title="Inspect Camera Specs"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Eyebrow Label with Accent Dot */}
                  <div className="text-center space-y-1">
                    <div className="mc-eyebrow justify-center text-[10px]">
                      <span className="mc-eyebrow-dot"></span>
                      <span>SURVEILLANCE NODE</span>
                    </div>

                    <h3 className="text-base font-medium text-[#141413] tracking-[-0.02em] line-clamp-1">
                      {cam.cameraName}
                    </h3>

                    <p className="text-xs font-mono text-[#696969]">{cam.cameraCode}</p>
                  </div>

                  {/* Location & Specs */}
                  <div className="space-y-2 pt-2 border-t border-[#E5DFD9] text-xs">
                    <div className="flex items-center gap-1.5 text-[#696969]">
                      <MapPin className="w-3.5 h-3.5 text-[#CF4500] shrink-0" />
                      <span className="truncate">{cam.fullAddress || cam.area || 'Nagpur Central'}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-[16px] bg-[#F3F0EE] text-[11px]">
                      <div>
                        <span className="text-[#696969] block text-[9px] uppercase tracking-wider font-semibold">Orientation</span>
                        <strong className="text-[#141413]">{cam.directionAngle}° ({cam.cardinalDirection || 'EAST'})</strong>
                      </div>
                      <div>
                        <span className="text-[#696969] block text-[9px] uppercase tracking-wider font-semibold">Radar Arc</span>
                        <strong className="text-[#141413]">{cam.coverageRadiusMeters}m</strong>
                      </div>
                    </div>

                    {!isUserSurveyor && (
                      <div className="p-2 rounded-[14px] bg-white border border-[#E5DFD9] text-[11px] flex items-center justify-between">
                        <div className="truncate pr-2">
                          <span className="text-[#696969] text-[9px] block uppercase tracking-wider font-medium">Owner</span>
                          <span className="font-semibold text-[#141413] truncate block">
                            {cam.ownerName || 'Govt / Police Dept'}
                          </span>
                        </div>
                        {cam.ownerContact && (
                          <a 
                            href={`tel:${cam.ownerContact}`}
                            className="font-mono text-[#3860BE] font-semibold text-[10px] flex items-center gap-1 shrink-0 hover:underline"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Call</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Verification Status Pill & Action */}
                <div className="pt-3 mt-3 border-t border-[#E5DFD9] flex items-center justify-between">
                  <span className={cam.verificationStatus === 'APPROVED' ? 'badge-approved' : 'badge-pending'}>
                    {cam.verificationStatus === 'APPROVED' ? '✓ Verified' : '◷ Pending'}
                  </span>

                  <button
                    onClick={() => setViewingCamera(cam)}
                    className="mc-btn-secondary text-xs py-1 px-3"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#3860BE]" />
                    <span>Inspect</span>
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      ) : (
        /* Table View */
        <div className="mc-stadium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F3F0EE] text-[#696969] font-bold uppercase tracking-[+0.04em] border-b border-[#E5DFD9]">
                <tr>
                  <th className="p-4">Camera Code</th>
                  <th className="p-4">Name &amp; Location</th>
                  {!isUserSurveyor && <th className="p-4">Owner &amp; Contact</th>}
                  <th className="p-4">Type</th>
                  <th className="p-4">Radius / Angle</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Verification</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DFD9] text-[#141413]">
                {isLoading ? (
                  <tr>
                    <td colSpan={isUserSurveyor ? "7" : "8"} className="p-8 text-center text-[#696969]">
                      Loading surveillance registry...
                    </td>
                  </tr>
                ) : cameras.length === 0 ? (
                  <tr>
                    <td colSpan={isUserSurveyor ? "7" : "8"} className="p-8 text-center text-[#696969]">
                      No cameras match your search parameters.
                    </td>
                  </tr>
                ) : (
                  cameras.map((cam) => (
                    <tr key={cam.id} className="hover:bg-white/80 transition-colors">
                      <td className="p-4 font-mono font-bold text-[#141413]">{cam.cameraCode}</td>
                      <td className="p-4">
                        <div className="font-semibold text-[#141413]">{cam.cameraName}</div>
                        <div className="text-[11px] text-[#696969] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-[#CF4500] shrink-0" />
                          <span className="truncate max-w-xs">{cam.fullAddress || cam.area}</span>
                        </div>
                      </td>
                      {!isUserSurveyor && (
                        <td className="p-4">
                          <div className="font-medium text-[#141413] flex items-center gap-1">
                            <User className="w-3 h-3 text-[#3860BE]" />
                            <span>{cam.ownerName || 'Govt / Police Dept'}</span>
                          </div>
                          {cam.ownerContact && (
                            <div className="text-[11px] text-[#696969] flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3 text-[#696969]" />
                              {cam.ownerContact}
                            </div>
                          )}
                        </td>
                      )}
                      <td className="p-4">
                        <span className="bg-[#F3F0EE] border border-[#D1CDC7] px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold text-[#141413]">
                          {cam.cameraType}
                        </span>
                      </td>
                      <td className="p-4 text-[11px]">
                        <div>{cam.coverageRadiusMeters}m radius</div>
                        <div className="text-[#696969] font-medium">{cam.directionAngle}° ({cam.cardinalDirection})</div>
                      </td>
                      <td className="p-4">
                        <span className={cam.cameraStatus === 'ACTIVE' ? 'badge-active' : 'badge-offline'}>
                          {cam.cameraStatus === 'ACTIVE' ? '● Online' : '● Offline'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={cam.verificationStatus === 'APPROVED' ? 'badge-approved' : 'badge-pending'}>
                          {cam.verificationStatus === 'APPROVED' ? '✓ Approved' : '◷ Pending'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setViewingCamera(cam)}
                          className="mc-btn-secondary text-[11px] py-1 px-3 ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#3860BE]" />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Viewing Camera Drawer / Modal */}
      {viewingCamera && (
        <div className="fixed inset-0 bg-[#141413]/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mc-stadium w-full sm:max-w-lg rounded-b-none sm:rounded-[40px] max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-5 relative shadow-2xl bg-[#FCFBFA]"
          >
            <button
              onClick={() => setViewingCamera(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-[#696969] hover:text-[#141413] hover:bg-[#F3F0EE] transition-colors"
              aria-label="Close details"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 border-b border-[#E5DFD9] pb-4">
              <div className="w-12 h-12 rounded-full bg-[#141413] text-[#FCFBFA] flex items-center justify-center font-bold shrink-0">
                <Camera className="w-6 h-6" />
              </div>
              <div className="pr-6">
                <div className="mc-eyebrow text-[10px]">
                  <span className="mc-eyebrow-dot"></span>
                  <span>CCTV NODE DOSSIER</span>
                </div>
                <h3 className="font-medium text-[#141413] text-lg leading-snug">{viewingCamera.cameraName}</h3>
                <p className="font-mono text-xs text-[#3860BE]">{viewingCamera.cameraCode}</p>
              </div>
            </div>

            {/* Camera Owner Details Card */}
            {isUserSurveyor ? (
              <div className="bg-[#FEF6E9] p-3.5 rounded-[20px] border border-[#FADBA6] text-[#B56708] text-xs flex items-center gap-2 font-medium">
                <Lock className="w-4 h-4 text-[#B56708] shrink-0" />
                <span>Sensitive Camera Owner Info Restricted (Police Officer Access Only)</span>
              </div>
            ) : (
              <div className="bg-[#F3F0EE] p-4 rounded-[24px] border border-[#E5DFD9] space-y-2 text-xs">
                <p className="font-bold text-[#141413] flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-[#3860BE]" />
                  Registered Camera Owner Details
                </p>
                <div className="grid grid-cols-2 gap-3 text-[#141413] pt-1">
                  <div>
                    <p className="text-[#696969] text-[10px] uppercase font-semibold">Owner / Shop</p>
                    <p className="font-medium text-[#141413]">{viewingCamera.ownerName || 'Govt / Police Dept'}</p>
                  </div>
                  <div>
                    <p className="text-[#696969] text-[10px] uppercase font-semibold">Phone Contact</p>
                    <p className="font-mono font-medium text-[#141413]">{viewingCamera.ownerContact || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[#696969] text-[10px] uppercase font-semibold">Ownership Type</p>
                    <p className="font-medium text-[#3860BE] uppercase">{viewingCamera.ownerType || 'COMMERCIAL'}</p>
                  </div>
                  <div>
                    <p className="text-[#696969] text-[10px] uppercase font-semibold">Field Surveyor</p>
                    <p className="font-medium text-[#141413]">{viewingCamera.surveyorName || 'Field Team'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Technical Hardware Specs */}
            <div className="grid grid-cols-2 gap-2.5 text-xs text-[#141413]">
              <div className="bg-white p-3 rounded-[20px] border border-[#E5DFD9]">
                <p className="text-[#696969] text-[10px] uppercase font-semibold">Type &amp; Status</p>
                <p className="font-medium text-[#141413] flex items-center justify-between mt-1">
                  <span>{viewingCamera.cameraType}</span>
                  <span className={viewingCamera.cameraStatus === 'ACTIVE' ? 'badge-active' : 'badge-offline'}>
                    {viewingCamera.cameraStatus}
                  </span>
                </p>
              </div>
              <div className="bg-white p-3 rounded-[20px] border border-[#E5DFD9]">
                <p className="text-[#696969] text-[10px] uppercase font-semibold">Coverage Radius</p>
                <p className="font-medium text-[#141413] mt-1">{viewingCamera.coverageRadiusMeters} meters</p>
              </div>
              <div className="bg-white p-3 rounded-[20px] border border-[#E5DFD9]">
                <p className="text-[#696969] text-[10px] uppercase font-semibold">Lens Direction</p>
                <p className="font-medium text-[#3860BE] mt-1">
                  {viewingCamera.cardinalDirection || 'EAST'} ({viewingCamera.directionAngle || 0}°)
                </p>
              </div>
              <div className="bg-white p-3 rounded-[20px] border border-[#E5DFD9]">
                <p className="text-[#696969] text-[10px] uppercase font-semibold">FOV Spread</p>
                <p className="font-medium text-[#CF4500] mt-1">{viewingCamera.fovAngle || 60}° Angle</p>
              </div>
            </div>

            {/* QR Code Tag */}
            <div className="bg-[#F3F0EE] p-4 rounded-[24px] border border-[#E5DFD9] text-center space-y-2">
              <p className="text-xs font-semibold text-[#141413] flex items-center justify-center gap-1.5">
                <QrCode className="w-4 h-4 text-[#3860BE]" />
                Digital Hardware Tag QR Code
              </p>
              <img
                src={viewingCamera.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${viewingCamera.cameraCode}`}
                alt="QR Code"
                className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-[16px] border border-[#D1CDC7] bg-white p-1.5 shadow-sm"
              />
              <p className="text-[10px] text-[#696969] font-mono">{viewingCamera.cameraCode}</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Camera Survey Registration Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#141413]/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mc-stadium w-full sm:max-w-2xl rounded-b-none sm:rounded-[40px] max-h-[92vh] overflow-y-auto p-6 md:p-8 space-y-5 my-0 sm:my-8 shadow-2xl flex flex-col justify-between bg-[#FCFBFA]"
          >
            <div>
              <div className="flex items-center justify-between border-b border-[#E5DFD9] pb-4">
                <div>
                  <div className="mc-eyebrow text-[10px]">
                    <span className="mc-eyebrow-dot"></span>
                    <span>FIELD SURVEY DISCOVERY</span>
                  </div>
                  <h3 className="text-xl font-medium text-[#141413] tracking-[-0.02em]">Register CCTV Surveillance Node</h3>
                  <p className="text-xs text-[#696969] mt-0.5">Enter camera specifications, owner details, location coordinates, and lens coverage arc.</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-full text-[#696969] hover:text-[#141413] hover:bg-[#F3F0EE]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorMessage && (
                <div className="mt-4 p-3.5 rounded-[20px] bg-[#FDF0EE] border border-[#F8C6BC] text-[#CF4500] text-xs font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form id="cameraSurveyForm" onSubmit={handleCreateSubmit} className="space-y-4 text-xs mt-4">
                {/* Section 1: Camera Basic Details */}
                <div className="space-y-3 p-4 sm:p-5 rounded-[24px] bg-white border border-[#E5DFD9]">
                  <span className="font-bold text-[#141413] flex items-center gap-2 text-xs uppercase tracking-wider">
                    <Camera className="w-4 h-4 text-[#3860BE]" />
                    Section 1 — Camera Basic Information
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#141413] font-medium mb-1">Camera Code <span className="text-[#CF4500]">*</span></label>
                      <input
                        type="text"
                        required
                        value={form.cameraCode}
                        onChange={(e) => setForm({ ...form, cameraCode: e.target.value })}
                        className="mc-input w-full font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[#141413] font-medium mb-1">Camera Type <span className="text-[#CF4500]">*</span></label>
                      <select
                        value={form.cameraType}
                        onChange={(e) => setForm({ ...form, cameraType: e.target.value })}
                        className="mc-input w-full text-xs"
                      >
                        <option value="PTZ">PTZ (Pan-Tilt-Zoom)</option>
                        <option value="DOME">Dome Camera</option>
                        <option value="BULLET">Bullet Camera</option>
                        <option value="ANPR">ANPR (License Plate Reader)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#141413] font-medium mb-1">Camera Landmark / Name <span className="text-[#CF4500]">*</span></label>
                    <input
                      type="text"
                      required
                      value={form.cameraName}
                      onChange={(e) => setForm({ ...form, cameraName: e.target.value })}
                      placeholder="e.g. North Gate Traffic Junction / Apex Retail Front"
                      className="mc-input w-full text-xs"
                    />
                  </div>
                </div>

                {/* Section 2: Owner Information */}
                <div className="space-y-3 p-4 sm:p-5 rounded-[24px] bg-white border border-[#E5DFD9]">
                  <span className="font-bold text-[#141413] flex items-center gap-2 text-xs uppercase tracking-wider">
                    <User className="w-4 h-4 text-[#3860BE]" />
                    Section 2 — Camera Owner Information
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#141413] font-medium mb-1">Owner / Establishment Name <span className="text-[#CF4500]">*</span></label>
                      <input
                        type="text"
                        required
                        value={form.ownerName}
                        onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                        placeholder="e.g. Rajesh Kumar (Store Owner)"
                        className="mc-input w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[#141413] font-medium mb-1">Contact Phone Number <span className="text-[#CF4500]">*</span></label>
                      <input
                        type="text"
                        required
                        value={form.ownerContact}
                        onChange={(e) => setForm({ ...form, ownerContact: e.target.value })}
                        placeholder="e.g. +91 9876543210"
                        className="mc-input w-full font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#141413] font-medium mb-1">Ownership Category <span className="text-[#CF4500]">*</span></label>
                    <select
                      value={form.ownerType}
                      onChange={(e) => setForm({ ...form, ownerType: e.target.value })}
                      className="mc-input w-full text-xs"
                    >
                      <option value="COMMERCIAL">Commercial Business / Shop</option>
                      <option value="RESIDENTIAL">Residential / Apartment RWA</option>
                      <option value="PUBLIC_GOVT">Government / Municipal Police</option>
                      <option value="PRIVATE_INDIVIDUAL">Private Individual</option>
                    </select>
                  </div>
                </div>

                {/* Section 3: Geospatial Location */}
                <div className="space-y-3 p-4 sm:p-5 rounded-[24px] bg-white border border-[#E5DFD9]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#141413] flex items-center gap-2 text-xs uppercase tracking-wider">
                      <MapPin className="w-4 h-4 text-[#CF4500]" />
                      Section 3 — Geospatial Coordinates
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleGetCurrentGPS}
                        className="mc-btn-secondary text-xs py-1 px-3"
                      >
                        <Navigation className="w-3 h-3 text-[#3860BE]" />
                        Auto GPS
                      </button>
                      <button
                        type="button"
                        onClick={() => setUseMapPicker(!useMapPicker)}
                        className={`text-xs py-1 px-3 rounded-[20px] border font-medium transition-all ${
                          useMapPicker 
                            ? 'bg-[#141413] text-white border-[#141413]' 
                            : 'bg-white text-[#141413] border-[#141413]'
                        }`}
                      >
                        {useMapPicker ? 'Close Map Picker' : 'Pick on Map'}
                      </button>
                    </div>
                  </div>

                  {useMapPicker && (
                    <div className="h-64 sm:h-72 w-full rounded-[24px] overflow-hidden my-2 border border-[#D1CDC7] relative">
                      <div className="absolute top-2.5 left-3 right-3 z-[400] pointer-events-none flex justify-center">
                        <div className="bg-[#141413]/90 backdrop-blur-xs text-[#F3F0EE] text-[11px] font-medium px-3.5 py-1 rounded-full shadow-md border border-white/10 flex items-center gap-1.5 pointer-events-auto">
                          <span className="w-2 h-2 rounded-full bg-[#CF4500] animate-ping"></span>
                          <span>Click anywhere on the map to set camera GPS coordinates</span>
                        </div>
                      </div>
                      <CameraMap
                        interactivePicker={true}
                        center={[!isNaN(parseFloat(form.latitude)) ? parseFloat(form.latitude) : 21.1458, !isNaN(parseFloat(form.longitude)) ? parseFloat(form.longitude) : 79.0882]}
                        selectedLocation={{ lat: !isNaN(parseFloat(form.latitude)) ? parseFloat(form.latitude) : 21.1458, lng: !isNaN(parseFloat(form.longitude)) ? parseFloat(form.longitude) : 79.0882 }}
                        onMapClick={handleMapLocationSelect}
                        zoom={15}
                        autoFit={false}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#141413] font-medium mb-1">Latitude <span className="text-[#CF4500]">*</span></label>
                      <input
                        type="number"
                        step="0.00001"
                        required
                        value={form.latitude}
                        onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) || 0 })}
                        className="mc-input w-full font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[#141413] font-medium mb-1">Longitude <span className="text-[#CF4500]">*</span></label>
                      <input
                        type="number"
                        step="0.00001"
                        required
                        value={form.longitude}
                        onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) || 0 })}
                        className="mc-input w-full font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#141413] font-medium mb-1">State / UT <span className="text-[#CF4500]">*</span></label>
                      <input
                        type="text"
                        required
                        value={form.state || 'Maharashtra'}
                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                        placeholder="e.g. Maharashtra"
                        className="mc-input w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[#141413] font-medium mb-1">City / District <span className="text-[#CF4500]">*</span></label>
                      <input
                        type="text"
                        required
                        value={form.city || 'Nagpur'}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        placeholder="e.g. Nagpur"
                        className="mc-input w-full text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#141413] font-medium mb-1">Full Address / Landmark</label>
                    <input
                      type="text"
                      value={form.fullAddress}
                      onChange={(e) => setForm({ ...form, fullAddress: e.target.value })}
                      placeholder="Street name, Sector, Landmark"
                      className="mc-input w-full text-xs"
                    />
                  </div>
                </div>

                {/* Section 4: Lens Orientation & Coverage */}
                <div className="space-y-3 p-4 sm:p-5 rounded-[24px] bg-white border border-[#E5DFD9]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#141413] flex items-center gap-2 text-xs uppercase tracking-wider">
                      <Compass className="w-4 h-4 text-[#3860BE]" />
                      Section 4 — Camera Lens Direction &amp; Coverage
                    </span>
                    <span className="text-xs font-mono font-medium text-[#141413] bg-[#F3F0EE] px-2.5 py-0.5 rounded-full border border-[#D1CDC7]">
                      {form.cardinalDirection || 'EAST'} ({form.directionAngle || 90}°)
                    </span>
                  </div>

                  {/* 8-Point Compass Direction Buttons */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { label: 'NORTH', angle: 0, icon: '⬆️' },
                      { label: 'NORTH-EAST', angle: 45, icon: '↗️' },
                      { label: 'EAST', angle: 90, icon: '➡️' },
                      { label: 'SOUTH-EAST', angle: 135, icon: '↘️' },
                      { label: 'SOUTH', angle: 180, icon: '⬇️' },
                      { label: 'SOUTH-WEST', angle: 225, icon: '↙️' },
                      { label: 'WEST', angle: 270, icon: '⬅️' },
                      { label: 'NORTH-WEST', angle: 315, icon: '↖️' },
                    ].map((dir) => (
                      <button
                        key={dir.label}
                        type="button"
                        onClick={() => setForm({ ...form, cardinalDirection: dir.label, directionAngle: dir.angle })}
                        className={`p-2 rounded-[14px] border text-[10px] font-medium flex flex-col items-center gap-0.5 transition-all ${
                          (form.cardinalDirection === dir.label || form.directionAngle === dir.angle)
                            ? 'bg-[#141413] text-white border-[#141413] shadow-xs'
                            : 'bg-white text-[#141413] border-[#E5DFD9] hover:bg-[#F3F0EE]'
                        }`}
                      >
                        <span>{dir.icon}</span>
                        <span className="text-[9px]">{dir.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Lens Facing Orientation Range Slider */}
                  <div className="pt-2 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-[10px] text-[#696969] mb-1 font-medium">
                        <span>Direction Angle: <strong>{form.directionAngle || 0}°</strong></span>
                        <span>0° to 360°</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        step="5"
                        value={form.directionAngle || 0}
                        onChange={(e) => {
                          const deg = parseFloat(e.target.value);
                          let card = 'NORTH';
                          if (deg >= 22.5 && deg < 67.5) card = 'NORTH-EAST';
                          else if (deg >= 67.5 && deg < 112.5) card = 'EAST';
                          else if (deg >= 112.5 && deg < 157.5) card = 'SOUTH-EAST';
                          else if (deg >= 157.5 && deg < 202.5) card = 'SOUTH';
                          else if (deg >= 202.5 && deg < 247.5) card = 'SOUTH-WEST';
                          else if (deg >= 247.5 && deg < 292.5) card = 'WEST';
                          else if (deg >= 292.5 && deg < 337.5) card = 'NORTH-WEST';
                          setForm({ ...form, directionAngle: deg, cardinalDirection: card });
                        }}
                        className="w-full accent-[#141413] cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-[#696969] text-[10px] mb-1 font-medium uppercase">Radius (m)</label>
                      <input
                        type="number"
                        value={form.coverageRadiusMeters}
                        onChange={(e) => setForm({ ...form, coverageRadiusMeters: parseFloat(e.target.value) || 100 })}
                        className="mc-input w-20 sm:w-24 font-mono text-xs py-1.5"
                      />
                    </div>
                  </div>

                  {/* FOV Spread Angle */}
                  <div className="pt-3 border-t border-[#E5DFD9] space-y-2">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-semibold text-[#141413]">Field of View (FOV) Spread Angle</span>
                      <span className="font-mono font-bold text-[#CF4500]">{form.fovAngle || 60}° Spread</span>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5 text-[10px]">
                      {[
                        { label: '30° Spot', fov: 30 },
                        { label: '60° Std', fov: 60 },
                        { label: '90° Wide', fov: 90 },
                        { label: '120° Ultra', fov: 120 },
                        { label: '360° Pan', fov: 360 },
                      ].map((item) => (
                        <button
                          key={item.fov}
                          type="button"
                          onClick={() => setForm({ ...form, fovAngle: item.fov })}
                          className={`py-1.5 px-1 rounded-[12px] border text-[9px] font-semibold transition-all ${
                            (form.fovAngle === item.fov)
                              ? 'bg-[#CF4500] text-white border-[#CF4500]'
                              : 'bg-white text-[#141413] border-[#E5DFD9] hover:bg-[#F3F0EE]'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Action Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5DFD9] bg-[#FCFBFA] sticky bottom-0 z-10">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="mc-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="cameraSurveyForm"
                disabled={addCameraMutation.isPending}
                className="mc-btn-primary"
              >
                {addCameraMutation.isPending ? 'Registering...' : 'Register Camera Point'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
