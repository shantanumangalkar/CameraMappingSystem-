import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { CameraMap } from '../components/CameraMap';
import { Camera, Search, Filter, Plus, CheckCircle, XCircle, MapPin, Eye, Navigation, QrCode, X, Map, Layers, User, Phone, ShieldCheck, Lock, Compass, AlertTriangle } from 'lucide-react';

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

  React.useEffect(() => {
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

  // Form State for new camera survey

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
    ownerName: 'Commercial Store Owner',
    ownerContact: '+91 9876543210',
    ownerType: 'COMMERCIAL',
  });

  const [form, setForm] = useState(getInitialForm());

  React.useEffect(() => {
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
      const msg = err.response?.data?.message || err.message || 'Failed to submit camera survey. Please check all required fields.';
      setErrorMessage(msg);
    },
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    const parsedLat = parseFloat(form.latitude);
    const parsedLng = parseFloat(form.longitude);
    if (!form.cameraName || isNaN(parsedLat) || isNaN(parsedLng)) {
      setErrorMessage('Please fill in Camera Name and valid GPS coordinates.');
      return;
    }
    addCameraMutation.mutate({
      ...form,
      latitude: parsedLat,
      longitude: parsedLng,
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
        (error) => {
          alert('GPS location capture failed. Please enter coordinates manually or use map picker.');
        }
      );
    }
  };

  const handleMapLocationSelect = (lat, lng) => {
    setForm((prev) => ({
      ...prev,
      latitude: Math.round(lat * 100000) / 100000,
      longitude: Math.round(lng * 100000) / 100000,
    }));
  };

  const cameras = data?.data?.content || [];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-police-400" />
            Metropolitan CCTV Camera Directory
          </h2>
          <p className="text-xs text-slate-400 mt-1">Browse, filter, and register physical CCTV surveillance nodes in real time.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowMapView(!showMapView)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all"
          >
            <Map className="w-4 h-4 text-police-400" />
            {showMapView ? 'Hide GIS Map' : 'Show GIS Map'}
          </button>

          {(isAdmin || isUserSurveyor) && (
            <button
              onClick={() => setShowAddModal(true)}
              className="glass-button-primary shrink-0"
            >
              <Plus className="w-4 h-4" />
              Survey New Camera
            </button>
          )}
        </div>
      </div>

      {/* Live Map Toggle View */}
      {showMapView && (
        <div className="glass-card p-4 h-[420px] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-police-400" />
              Live Directory Map (Showing {cameras.length} cameras)
            </span>
            <span className="text-[11px] text-emerald-400 font-mono">● Live Auto-Sync</span>
          </div>
          <div className="flex-1 w-full relative">
            <CameraMap cameras={cameras} autoFit={true} onSelectCamera={(cam) => setViewingCamera(cam)} />
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by Camera Code, Name, Address, or Area..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input w-full pl-10 text-xs"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="glass-input text-xs bg-slate-900"
          >
            <option value="">All Camera Types</option>
            <option value="PTZ">PTZ</option>
            <option value="DOME">Dome</option>
            <option value="BULLET">Bullet</option>
            <option value="ANPR">ANPR</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="glass-input text-xs bg-slate-900"
          >
            <option value="">All Health Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="OFFLINE">Offline</option>
            <option value="UNDER_MAINTENANCE">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Camera Directory Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4">Camera Code</th>
                <th className="p-4">Name & Address</th>
                {!isUserSurveyor && <th className="p-4">Camera Owner & Contact</th>}
                <th className="p-4">Type</th>
                <th className="p-4">Radius / Lens Angle</th>
                <th className="p-4">Status</th>
                <th className="p-4">Verification</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={isUserSurveyor ? "7" : "8"} className="p-8 text-center text-slate-500">Loading cameras...</td>
                </tr>
              ) : cameras.length === 0 ? (
                <tr>
                  <td colSpan={isUserSurveyor ? "7" : "8"} className="p-8 text-center text-slate-500">No cameras match your search parameters.</td>
                </tr>
              ) : (
                cameras.map((cam) => (
                  <tr key={cam.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-police-300">{cam.cameraCode}</td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-100">{cam.cameraName}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {cam.fullAddress || cam.area}
                      </div>
                    </td>
                    {!isUserSurveyor && (
                      <td className="p-4">
                        <div className="font-medium text-slate-200 flex items-center gap-1">
                          <User className="w-3 h-3 text-police-400" />
                          {cam.ownerName || 'Govt / Police Dept'}
                        </div>
                        {cam.ownerContact && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-slate-500" />
                            {cam.ownerContact}
                          </div>
                        )}
                        <span className="text-[9px] bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded uppercase mt-0.5 inline-block">
                          {cam.ownerType || 'COMMERCIAL'}
                        </span>
                      </td>
                    )}
                    <td className="p-4">
                      <span className="bg-slate-800 border border-slate-700 px-2 py-1 rounded text-[10px] font-mono">
                        {cam.cameraType}
                      </span>
                    </td>
                    <td className="p-4 text-[11px]">
                      <div>{cam.coverageRadiusMeters}m radius</div>
                      <div className="text-slate-400 font-bold">{cam.directionAngle}° lens orientation</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        cam.cameraStatus === 'ACTIVE' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {cam.cameraStatus}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        cam.verificationStatus === 'APPROVED' 
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {cam.verificationStatus}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setViewingCamera(cam)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-police-300 font-medium text-[11px] transition-all flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Viewing Camera Drawer / Modal */}
      {viewingCamera && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-4 relative">
            <button
              onClick={() => setViewingCamera(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-xl bg-police-600/20 border border-police-500/30 flex items-center justify-center text-police-300 font-mono font-bold">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">{viewingCamera.cameraName}</h3>
                <p className="font-mono text-xs text-police-400">{viewingCamera.cameraCode}</p>
              </div>
            </div>

            {/* Camera Owner Details Specs Card (Restricted for Surveyors) */}
            {isUserSurveyor ? (
              <div className="bg-amber-950/40 p-3 rounded-xl border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 font-semibold">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Sensitive Camera Owner Info Restricted (Police Access Only)</span>
              </div>
            ) : (
              <div className="bg-police-950/60 p-3 rounded-xl border border-police-500/30 space-y-1.5 text-xs">
                <p className="font-bold text-police-300 flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-4 h-4 text-police-400" />
                  Registered Camera Owner Details
                </p>
                <div className="grid grid-cols-2 gap-2 text-slate-300 pt-1">
                  <div>
                    <p className="text-slate-500 text-[10px]">Owner / Establishment</p>
                    <p className="font-semibold">{viewingCamera.ownerName || 'Govt / Police Dept'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[10px]">Phone Contact</p>
                    <p className="font-mono font-semibold">{viewingCamera.ownerContact || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[10px]">Ownership Type</p>
                    <p className="font-semibold text-police-300 uppercase">{viewingCamera.ownerType || 'COMMERCIAL'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[10px]">Field Surveyor</p>
                    <p className="font-semibold">{viewingCamera.surveyorName || 'Field Team'}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <p className="text-slate-500 text-[10px]">Camera Type & Status</p>
                <p className="font-semibold flex items-center justify-between">
                  <span>{viewingCamera.cameraType}</span>
                  <span className="text-emerald-400 font-mono text-[10px]">{viewingCamera.cameraStatus}</span>
                </p>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <p className="text-slate-500 text-[10px]">Coverage Radius</p>
                <p className="font-semibold">{viewingCamera.coverageRadiusMeters} meters</p>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <p className="text-slate-500 text-[10px]">Lens Facing Direction</p>
                <p className="font-semibold text-police-300">{viewingCamera.cardinalDirection || 'EAST'} ({viewingCamera.directionAngle || 0}° Angle)</p>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <p className="text-slate-500 text-[10px]">FOV Capture Width</p>
                <p className="font-semibold text-amber-400">{viewingCamera.fovAngle || 60}° Angle Spread</p>
              </div>
            </div>

            {/* QR Code */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center space-y-2">
              <p className="text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5">
                <QrCode className="w-4 h-4 text-police-400" />
                Digital Hardware Tag QR Code
              </p>
              <img
                src={viewingCamera.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${viewingCamera.cameraCode}`}
                alt="QR Code"
                className="w-32 h-32 mx-auto rounded-lg border border-slate-700 bg-white p-1"
              />
              <p className="text-[10px] text-slate-500 font-mono">{viewingCamera.cameraCode}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add Camera Modal with Owner Fields */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-card max-w-xl w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Survey & Register New CCTV Camera</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Camera Code *</label>
                  <input
                    type="text"
                    required
                    value={form.cameraCode}
                    onChange={(e) => setForm({ ...form, cameraCode: e.target.value })}
                    className="glass-input w-full font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Camera Type *</label>
                  <select
                    value={form.cameraType}
                    onChange={(e) => setForm({ ...form, cameraType: e.target.value })}
                    className="glass-input w-full bg-slate-900"
                  >
                    <option value="PTZ">PTZ</option>
                    <option value="DOME">Dome</option>
                    <option value="BULLET">Bullet</option>
                    <option value="ANPR">ANPR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Camera Name / Landmark *</label>
                <input
                  type="text"
                  required
                  value={form.cameraName}
                  onChange={(e) => setForm({ ...form, cameraName: e.target.value })}
                  placeholder="e.g. North Gate Traffic Junction / Apex Store Front"
                  className="glass-input w-full"
                />
              </div>

              {/* Camera Owner Details Section */}
              <div className="space-y-2 border border-police-500/30 p-3 rounded-xl bg-police-950/40">
                <span className="font-bold text-police-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-police-400" />
                  Camera Owner Information
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Owner / Establishment Name *</label>
                    <input
                      type="text"
                      required
                      value={form.ownerName}
                      onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                      placeholder="e.g. Rajesh Kumar (Store Owner)"
                      className="glass-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Contact Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={form.ownerContact}
                      onChange={(e) => setForm({ ...form, ownerContact: e.target.value })}
                      placeholder="e.g. +91 9876543210"
                      className="glass-input w-full font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Ownership Category *</label>
                  <select
                    value={form.ownerType}
                    onChange={(e) => setForm({ ...form, ownerType: e.target.value })}
                    className="glass-input w-full bg-slate-900"
                  >
                    <option value="COMMERCIAL">Commercial Business / Shop</option>
                    <option value="RESIDENTIAL">Residential / Apartment RWA</option>
                    <option value="PUBLIC_GOVT">Government / Municipal Police</option>
                    <option value="PRIVATE_INDIVIDUAL">Private Individual</option>
                  </select>
                </div>
              </div>

              {/* Location Controls & GPS Auto-capture */}
              <div className="space-y-2 border border-slate-800 p-3 rounded-xl bg-slate-900/50">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">Geospatial Location</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleGetCurrentGPS}
                      className="px-2.5 py-1 rounded-lg bg-police-600/20 hover:bg-police-600/30 text-police-300 border border-police-500/30 flex items-center gap-1 font-medium transition-all"
                    >
                      <Navigation className="w-3 h-3 text-police-400" />
                      Auto GPS
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseMapPicker(!useMapPicker)}
                      className={`px-2.5 py-1 rounded-lg border font-medium transition-all ${
                        useMapPicker ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {useMapPicker ? 'Close Map Picker' : 'Pick on Map'}
                    </button>
                  </div>
                </div>

                {useMapPicker && (
                  <div className="h-48 w-full rounded-xl overflow-hidden my-2 border border-slate-700">
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
                    <label className="block text-slate-400 mb-1">Latitude *</label>
                    <input
                      type="number"
                      step="0.00001"
                      required
                      value={form.latitude}
                      onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) || 0 })}
                      className="glass-input w-full font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Longitude *</label>
                    <input
                      type="number"
                      step="0.00001"
                      required
                      value={form.longitude}
                      onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) || 0 })}
                      className="glass-input w-full font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* City and State Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">State / UT *</label>
                  <input
                    type="text"
                    required
                    value={form.state || 'Maharashtra'}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    placeholder="e.g. Maharashtra, Delhi NCR"
                    className="glass-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">City / District *</label>
                  <input
                    type="text"
                    required
                    value={form.city || 'Nagpur'}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="e.g. Nagpur, Mumbai, Delhi"
                    className="glass-input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Full Address / Location Remarks</label>
                <input
                  type="text"
                  value={form.fullAddress}
                  onChange={(e) => setForm({ ...form, fullAddress: e.target.value })}
                  placeholder="Street name, Sector, Landmark"
                  className="glass-input w-full"
                />
              </div>

              {/* Accurate Compass Direction Selector & Angle Fine-Tuning */}
              <div className="space-y-2.5 border border-police-500/30 p-3.5 rounded-xl bg-police-950/40">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-police-300 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-police-400" />
                    Camera Lens Facing Direction & Accurate Angle
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
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
                      className={`p-1.5 rounded-lg border text-[10px] font-bold flex flex-col items-center gap-0.5 transition-all ${
                        (form.cardinalDirection === dir.label || form.directionAngle === dir.angle)
                          ? 'bg-police-600 text-white border-police-400 shadow-md'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <span>{dir.icon}</span>
                      <span>{dir.label}</span>
                    </button>
                  ))}
                </div>

                {/* Lens Facing Orientation */}
                <div className="pt-2 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Facing Angle: <strong>{form.directionAngle || 0}°</strong></span>
                      <span>0° (North) to 360°</span>
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
                      className="w-full accent-police-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1">Coverage Radius (m)</label>
                    <input
                      type="number"
                      value={form.coverageRadiusMeters}
                      onChange={(e) => setForm({ ...form, coverageRadiusMeters: parseFloat(e.target.value) || 100 })}
                      className="glass-input w-24 font-mono text-xs py-1"
                    />
                  </div>
                </div>

                {/* Field of View Capture Spread Angle Width */}
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-semibold text-slate-300">Field of View (FOV) Capture Width Angle</span>
                    <span className="font-mono font-bold text-amber-400">{form.fovAngle || 60}° Spread</span>
                  </div>

                  <div className="grid grid-cols-5 gap-1 text-[10px]">
                    {[
                      { label: '30° Spot', fov: 30 },
                      { label: '60° Standard', fov: 60 },
                      { label: '90° Wide', fov: 90 },
                      { label: '120° Ultra', fov: 120 },
                      { label: '360° Panoramic', fov: 360 },
                    ].map((item) => (
                      <button
                        key={item.fov}
                        type="button"
                        onClick={() => setForm({ ...form, fovAngle: item.fov })}
                        className={`py-1 px-1.5 rounded border text-[9px] font-bold transition-all ${
                          (form.fovAngle === item.fov)
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addCameraMutation.isPending}
                  className="glass-button-primary"
                >
                  {addCameraMutation.isPending ? 'Registering Camera...' : 'Register Camera & Save Owner Specs'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
