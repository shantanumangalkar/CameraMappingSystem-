import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { CameraMap } from '../components/CameraMap';
import { ClipboardList, Plus, CheckCircle2, Clock, XCircle, MapPin, Camera, Navigation, QrCode, X, User, Phone, AlertTriangle, ShieldCheck, Lock, Compass } from 'lucide-react';

export const MyFieldSurveys = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [showAddModal, setShowAddModal] = useState(false);
  const [useMapPicker, setUseMapPicker] = useState(false);
  const [viewingCamera, setViewingCamera] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const getInitialForm = () => ({
    cameraCode: `CAM-${Math.floor(1000 + Math.random() * 9000)}`,
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

  // Query all cameras to filter surveyor's submitted units
  const { data, isLoading } = useQuery({
    queryKey: ['my-surveyed-cameras'],
    queryFn: () => api.get('/cameras/search?size=1000'),
    refetchInterval: 3000,
  });

  const addCameraMutation = useMutation({
    mutationFn: (newCam) => api.post('/cameras', newCam),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-surveyed-cameras'] });
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      queryClient.invalidateQueries({ queryKey: ['pending-cameras'] });
      setShowAddModal(false);
      setErrorMessage('');
      setForm(getInitialForm());
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to submit camera survey. Please check all fields.';
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
        (error) => {
          alert('GPS location capture failed. Please enter coordinates manually.');
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

  const allCameras = data?.data?.content || [];

  // Filter cameras surveyed by current logged-in user or fallback sample
  const myCameras = allCameras.filter(
    (c) => c.surveyorName === user?.fullName || c.surveyorId === user?.id
  );

  const displayList = myCameras.length > 0 ? myCameras : [
    { id: 101, cameraCode: 'CAM-NGP-101', cameraName: 'Nagpur Sitabuldi Main Square Dome', cameraType: 'DOME', latitude: 21.1458, longitude: 79.0882, fullAddress: 'Sitabuldi Main Market Square, Nagpur, Maharashtra', area: 'Nagpur Central', city: 'Nagpur', state: 'Maharashtra', directionAngle: 90, cardinalDirection: 'EAST', coverageRadiusMeters: 120, cameraStatus: 'ACTIVE', verificationStatus: 'APPROVED', surveyDate: '2026-07-24' },
    { id: 102, cameraCode: 'CAM-005', cameraName: 'Commercial Plaza Surveyed Point', cameraType: 'PTZ', latitude: 28.6149, longitude: 77.2130, fullAddress: 'Commercial Plaza, Sector 4, Metro City', area: 'Central Zone', city: 'Delhi', state: 'Delhi NCR', directionAngle: 120, cardinalDirection: 'SOUTH-EAST', coverageRadiusMeters: 100, cameraStatus: 'ACTIVE', verificationStatus: 'PENDING', surveyDate: '2026-07-25' },
    { id: 103, cameraCode: 'CAM-009', cameraName: 'South Gate Parking Bullet Cam', cameraType: 'BULLET', latitude: 28.6110, longitude: 77.2050, fullAddress: 'South Gate Parking Entrance', area: 'South Sector', city: 'Delhi', state: 'Delhi NCR', directionAngle: 180, cardinalDirection: 'SOUTH', coverageRadiusMeters: 75, cameraStatus: 'OFFLINE', verificationStatus: 'REJECTED', rejectionReason: 'Inaccurate GPS coordinates provided during survey.', surveyDate: '2026-07-23' }
  ];

  const pendingCount = displayList.filter(c => c.verificationStatus === 'PENDING').length;
  const approvedCount = displayList.filter(c => c.verificationStatus === 'APPROVED').length;
  const rejectedCount = displayList.filter(c => c.verificationStatus === 'REJECTED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 border-l-4 border-l-police-500">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-police-400" />
            My Field Surveys & Verification Status
          </h2>
          <p className="text-xs text-slate-400 mt-1">Track all CCTV cameras surveyed by you, inspect admin verification status, or submit new camera surveys.</p>
        </div>

        <button
          onClick={() => {
            setErrorMessage('');
            setForm(getInitialForm());
            setShowAddModal(true);
          }}
          className="glass-button-primary shrink-0 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Survey New Camera
        </button>
      </div>

      {/* Verification Status Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Total Surveyed</span>
            <Camera className="w-5 h-5 text-police-400" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-2">{displayList.length}</p>
        </div>

        <div className="glass-card p-4 bg-emerald-950/20 border-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-300 font-semibold">Approved & Live</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-400 mt-2">{approvedCount}</p>
        </div>

        <div className="glass-card p-4 bg-amber-950/20 border-amber-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-300 font-semibold">Pending Admin Review</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-amber-400 mt-2">{pendingCount}</p>
        </div>

        <div className="glass-card p-4 bg-rose-950/20 border-rose-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs text-rose-300 font-semibold">Rejected Surveys</span>
            <XCircle className="w-5 h-5 text-rose-400" />
          </div>
          <p className="text-2xl font-extrabold text-rose-400 mt-2">{rejectedCount}</p>
        </div>
      </div>

      {/* Surveyed Cameras Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full glass-card p-8 text-center text-slate-400">
            Loading your surveyed cameras...
          </div>
        ) : displayList.length === 0 ? (
          <div className="col-span-full glass-card p-12 text-center text-slate-400 space-y-2">
            <ClipboardList className="w-12 h-12 text-slate-500 mx-auto opacity-80" />
            <h3 className="text-base font-bold text-white">No Field Surveys Recorded Yet</h3>
            <p className="text-xs text-slate-500">Click 'Survey New Camera' above to register your first CCTV camera point.</p>
          </div>
        ) : (
          displayList.map((cam) => (
            <div key={cam.id || cam.cameraCode} className="glass-card p-5 space-y-3 flex flex-col justify-between hover:border-police-500/40 transition-all border-slate-800">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-mono font-bold text-police-300 text-sm">{cam.cameraCode}</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-mono">
                    {cam.cameraType}
                  </span>
                </div>

                <h4 className="font-bold text-white text-base leading-tight">{cam.cameraName}</h4>

                <div className="text-xs text-slate-400 space-y-1">
                  <p className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    {cam.fullAddress || `${cam.city || 'Nagpur'}, ${cam.state || 'Maharashtra'}`}
                  </p>
                  <p className="font-mono text-[11px] text-slate-500">
                    Coords: {cam.latitude?.toFixed(5)}, {cam.longitude?.toFixed(5)}
                  </p>
                </div>

                {/* Verification Status Banner */}
                <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                  cam.verificationStatus === 'APPROVED'
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : cam.verificationStatus === 'PENDING'
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5 uppercase font-mono text-[11px]">
                      {cam.verificationStatus === 'APPROVED' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      {cam.verificationStatus === 'PENDING' && <Clock className="w-4 h-4 text-amber-400 animate-pulse" />}
                      {cam.verificationStatus === 'REJECTED' && <XCircle className="w-4 h-4 text-rose-400" />}
                      Status: {cam.verificationStatus}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {cam.surveyDate || 'Recent'}
                    </span>
                  </div>

                  {cam.verificationStatus === 'APPROVED' && (
                    <p className="text-[11px] text-emerald-200">
                      Camera authorized and live on National Police GIS database.
                    </p>
                  )}

                  {cam.verificationStatus === 'PENDING' && (
                    <p className="text-[11px] text-amber-200">
                      Under review by Admin Verification Queue.
                    </p>
                  )}

                  {cam.verificationStatus === 'REJECTED' && (
                    <div className="pt-1 border-t border-rose-500/30 text-[11px] space-y-0.5">
                      <p className="font-bold text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Rejection Reason:
                      </p>
                      <p className="text-rose-200 italic">
                        {cam.rejectionReason || 'Inaccurate GPS coordinates or field of view obstruction.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Technical Specs */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[9px]">Lens Facing Direction:</span>
                    <strong className="text-police-300">{cam.cardinalDirection || 'EAST'} ({cam.directionAngle || 90}°)</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">FOV Capture Width:</span>
                    <strong className="text-amber-400">{cam.fovAngle || 60}° Angle Spread</strong>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-800">
                <button
                  onClick={() => setViewingCamera(cam)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-police-300 font-semibold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <QrCode className="w-4 h-4" />
                  Inspect Hardware Tag QR Code
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* QR Code Details Modal */}
      {viewingCamera && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-4 relative">
            <button onClick={() => setViewingCamera(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <Camera className="w-6 h-6 text-police-400" />
              <div>
                <h3 className="font-bold text-white text-base">{viewingCamera.cameraName}</h3>
                <p className="font-mono text-xs text-police-400">{viewingCamera.cameraCode}</p>
              </div>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center space-y-2">
              <p className="text-xs font-semibold text-slate-300">Hardware Verification Tag</p>
              <img
                src={viewingCamera.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${viewingCamera.cameraCode}`}
                alt="QR Code"
                className="w-36 h-36 mx-auto rounded-lg border border-slate-700 bg-white p-1"
              />
              <p className="text-[10px] text-slate-500 font-mono">{viewingCamera.cameraCode}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add Camera Survey Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-card max-w-xl w-full p-6 space-y-4 my-8 border-l-4 border-l-police-500">
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
                  placeholder="e.g. Sitabuldi Square / North Gate Junction"
                  className="glass-input w-full"
                />
              </div>

              {/* Camera Owner Info */}
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
              </div>

              {/* Location Controls & GPS */}
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
                      center={[form.latitude, form.longitude]}
                      selectedLocation={{ lat: form.latitude, lng: form.longitude }}
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
                    value={form.state}
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
                    value={form.city}
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
                  <span className="font-bold text-police-300 flex items-center gap-1.5 text-xs">
                    <Compass className="w-4 h-4 text-police-400" />
                    Compass Direction & Accurate Lens Angle
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

                {/* Angle Slider & Dial */}
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
                    <label className="block text-slate-400 text-[10px] mb-1">Radius (m)</label>
                    <input
                      type="number"
                      value={form.coverageRadiusMeters}
                      onChange={(e) => setForm({ ...form, coverageRadiusMeters: parseFloat(e.target.value) || 100 })}
                      className="glass-input w-20 font-mono text-xs py-1"
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
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addCameraMutation.isPending}
                  className="glass-button-primary"
                >
                  {addCameraMutation.isPending ? 'Submitting Survey...' : 'Submit Camera Survey'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
