import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { CameraMap } from '../components/CameraMap';
import { 
  ClipboardList, 
  Plus, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  MapPin, 
  Camera, 
  Navigation, 
  QrCode, 
  X, 
  User, 
  Phone, 
  AlertTriangle, 
  Compass,
  Eye,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';

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
    fovAngle: 60,
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
        () => alert('GPS location capture failed. Please enter coordinates manually.')
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

  const allCameras = data?.data?.content || [];

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
    <div className="space-y-6 md:space-y-8">
      {/* Top Banner */}
      <div className="mc-stadium p-5 sm:p-7 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[100px] md:text-[140px] font-bold text-[#E8E2DA]/40 select-none pointer-events-none tracking-[-0.04em] pr-4">
          SURVEY
        </div>

        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="mc-eyebrow">
            <span className="mc-eyebrow-dot"></span>
            <span>FIELD PATROL INTELLIGENCE</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-medium text-[#141413] tracking-[-0.02em] leading-tight">
            My Field Surveys &amp; Verification Dossier
          </h1>

          <p className="text-sm md:text-base text-[#696969] font-normal leading-relaxed">
            Monitor all CCTV points surveyed by your field unit, inspect approval status, or register new camera surveillance nodes.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMessage('');
            setForm(getInitialForm());
            setShowAddModal(true);
          }}
          className="mc-btn-primary relative z-10 shrink-0 self-start md:self-auto"
        >
          <Plus className="w-4 h-4 text-[#F37338]" />
          <span>Survey New Camera</span>
        </button>
      </div>

      {/* Verification Status Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="mc-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#696969]">Total Surveyed</span>
            <div className="w-8 h-8 rounded-full bg-[#F3F0EE] text-[#141413] flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-medium text-[#141413] mt-3 tracking-[-0.02em]">{displayList.length}</p>
          <p className="text-[11px] text-[#696969] mt-1">Total points submitted</p>
        </div>

        <div className="mc-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#0A7334]">Approved &amp; Live</span>
            <div className="w-8 h-8 rounded-full bg-[#EAF7EE] text-[#0A7334] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-medium text-[#0A7334] mt-3 tracking-[-0.02em]">{approvedCount}</p>
          <p className="text-[11px] text-[#0A7334] mt-1">Active on police GIS map</p>
        </div>

        <div className="mc-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#B56708]">Pending Review</span>
            <div className="w-8 h-8 rounded-full bg-[#FEF6E9] text-[#B56708] flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-medium text-[#B56708] mt-3 tracking-[-0.02em]">{pendingCount}</p>
          <p className="text-[11px] text-[#B56708] mt-1">Awaiting police review</p>
        </div>

        <div className="mc-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#CF4500]">Rejected</span>
            <div className="w-8 h-8 rounded-full bg-[#FDF0EE] text-[#CF4500] flex items-center justify-center shrink-0">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-medium text-[#CF4500] mt-3 tracking-[-0.02em]">{rejectedCount}</p>
          <p className="text-[11px] text-[#CF4500] mt-1">Correction required</p>
        </div>
      </div>

      {/* Surveyed Cameras Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full mc-stadium p-12 text-center text-[#696969]">
            Loading your surveyed cameras...
          </div>
        ) : displayList.length === 0 ? (
          <div className="col-span-full mc-stadium p-12 text-center text-[#696969] space-y-2">
            <ClipboardList className="w-12 h-12 text-[#696969] mx-auto opacity-50" />
            <h3 className="text-lg font-medium text-[#141413]">No Field Surveys Recorded Yet</h3>
            <p className="text-xs text-[#696969]">Click 'Survey New Camera' above to register your first CCTV point.</p>
          </div>
        ) : (
          displayList.map((cam, idx) => (
            <motion.div 
              key={cam.id || cam.cameraCode} 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="mc-card p-5 sm:p-6 flex flex-col justify-between hover:border-[#D1CDC7] hover:shadow-mc-elevated transition-all duration-200"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-[#E5DFD9] pb-3">
                  <span className="font-mono font-bold text-[#141413] text-sm">{cam.cameraCode}</span>
                  <span className="text-[10px] bg-[#F3F0EE] text-[#141413] border border-[#D1CDC7] px-2.5 py-0.5 rounded-full font-mono font-medium">
                    {cam.cameraType}
                  </span>
                </div>

                <div>
                  <div className="mc-eyebrow text-[10px] mb-1">
                    <span className="mc-eyebrow-dot"></span>
                    <span>SURVEY RECORD</span>
                  </div>
                  <h4 className="font-medium text-[#141413] text-base leading-snug">{cam.cameraName}</h4>
                </div>

                <div className="text-xs text-[#696969] space-y-1">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#CF4500] shrink-0" />
                    <span className="truncate">{cam.fullAddress || cam.area}</span>
                  </p>
                  <p className="font-mono text-[11px] text-[#696969]">
                    Coords: {cam.latitude?.toFixed(5)}, {cam.longitude?.toFixed(5)}
                  </p>
                </div>

                {/* Status Badges */}
                <div className="flex items-center justify-between pt-1">
                  <span className={cam.cameraStatus === 'ACTIVE' ? 'badge-active' : 'badge-offline'}>
                    {cam.cameraStatus === 'ACTIVE' ? '● Online' : '● Offline'}
                  </span>
                  <span className={
                    cam.verificationStatus === 'APPROVED' 
                      ? 'badge-approved' 
                      : cam.verificationStatus === 'REJECTED' 
                      ? 'badge-rejected' 
                      : 'badge-pending'
                  }>
                    {cam.verificationStatus === 'APPROVED' 
                      ? '✓ Approved' 
                      : cam.verificationStatus === 'REJECTED' 
                      ? '× Rejected' 
                      : '◷ Pending'}
                  </span>
                </div>

                {/* Rejection Alert if Rejected */}
                {cam.verificationStatus === 'REJECTED' && cam.rejectionReason && (
                  <div className="p-3 rounded-[16px] bg-[#FDF0EE] border border-[#F8C6BC] text-[#CF4500] text-xs space-y-1">
                    <span className="font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#CF4500]" />
                      Rejection Reason:
                    </span>
                    <p className="text-[11px]">{cam.rejectionReason}</p>
                  </div>
                )}

                {/* Technical Specs */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#F3F0EE] p-3 rounded-[18px] text-[#141413]">
                  <div>
                    <span className="text-[#696969] block text-[9px] uppercase font-semibold">Direction</span>
                    <strong className="text-[#3860BE] mt-0.5 block">{cam.directionAngle || 0}° ({cam.cardinalDirection || 'EAST'})</strong>
                  </div>
                  <div>
                    <span className="text-[#696969] block text-[9px] uppercase font-semibold">Coverage Arc</span>
                    <strong className="text-[#141413] mt-0.5 block">{cam.coverageRadiusMeters || 80}m</strong>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[#E5DFD9] flex justify-end">
                <button
                  onClick={() => setViewingCamera(cam)}
                  className="mc-btn-secondary text-xs py-1.5 px-3"
                >
                  <Eye className="w-3.5 h-3.5 text-[#3860BE]" />
                  <span>Inspect Details &amp; QR</span>
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Inspect Camera Modal */}
      {viewingCamera && (
        <div className="fixed inset-0 bg-[#141413]/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mc-stadium w-full sm:max-w-md rounded-b-none sm:rounded-[40px] p-6 md:p-8 space-y-5 relative shadow-2xl bg-[#FCFBFA]"
          >
            <button
              onClick={() => setViewingCamera(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-[#696969] hover:text-[#141413] hover:bg-[#F3F0EE]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 border-b border-[#E5DFD9] pb-4">
              <div className="w-12 h-12 rounded-full bg-[#141413] text-[#FCFBFA] flex items-center justify-center font-bold">
                <Camera className="w-6 h-6" />
              </div>
              <div className="pr-6">
                <div className="mc-eyebrow text-[10px]">
                  <span className="mc-eyebrow-dot"></span>
                  <span>SURVEYED POINT</span>
                </div>
                <h3 className="font-medium text-[#141413] text-base leading-snug">{viewingCamera.cameraName}</h3>
                <p className="font-mono text-xs text-[#3860BE]">{viewingCamera.cameraCode}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs text-[#141413]">
              <div className="bg-white p-3 rounded-[18px] border border-[#E5DFD9]">
                <span className="text-[#696969] text-[10px] uppercase font-semibold block">Status</span>
                <span className={`mt-1 inline-block ${viewingCamera.verificationStatus === 'APPROVED' ? 'badge-approved' : 'badge-pending'}`}>
                  {viewingCamera.verificationStatus}
                </span>
              </div>
              <div className="bg-white p-3 rounded-[18px] border border-[#E5DFD9]">
                <span className="text-[#696969] text-[10px] uppercase font-semibold block">Coverage</span>
                <strong className="text-[#141413] mt-1 block">{viewingCamera.coverageRadiusMeters}m</strong>
              </div>
            </div>

            {/* Hardware QR Code */}
            <div className="bg-[#F3F0EE] p-4 rounded-[24px] border border-[#E5DFD9] text-center space-y-2">
              <p className="text-xs font-semibold text-[#141413] flex items-center justify-center gap-1.5">
                <QrCode className="w-4 h-4 text-[#3860BE]" />
                Digital Hardware Tag QR
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

      {/* Survey New Camera Registration Modal */}
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
                    <span>FIELD DISCOVERY</span>
                  </div>
                  <h3 className="text-xl font-medium text-[#141413] tracking-[-0.02em]">Survey New CCTV Camera Point</h3>
                  <p className="text-xs text-[#696969] mt-0.5">Capture field hardware parameters, landmark location, and owner details.</p>
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

              <form id="surveyModalForm" onSubmit={handleCreateSubmit} className="space-y-4 text-xs mt-4">
                <div className="grid grid-cols-2 gap-3">
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
                      <option value="PTZ">PTZ</option>
                      <option value="DOME">Dome</option>
                      <option value="BULLET">Bullet</option>
                      <option value="ANPR">ANPR</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[#141413] font-medium mb-1">Camera Name / Landmark <span className="text-[#CF4500]">*</span></label>
                  <input
                    type="text"
                    required
                    value={form.cameraName}
                    onChange={(e) => setForm({ ...form, cameraName: e.target.value })}
                    placeholder="e.g. North Market Main Entrance"
                    className="mc-input w-full text-xs"
                  />
                </div>

                {/* Owner Info */}
                <div className="p-4 sm:p-5 rounded-[24px] bg-white border border-[#E5DFD9] space-y-3">
                  <span className="font-bold text-[#141413] flex items-center gap-2 text-xs uppercase tracking-wider">
                    <User className="w-4 h-4 text-[#3860BE]" />
                    Camera Owner Information
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#141413] font-medium mb-1">Owner Name</label>
                      <input
                        type="text"
                        value={form.ownerName}
                        onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                        className="mc-input w-full text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[#141413] font-medium mb-1">Owner Phone Contact</label>
                      <input
                        type="text"
                        value={form.ownerContact}
                        onChange={(e) => setForm({ ...form, ownerContact: e.target.value })}
                        className="mc-input w-full font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Location Controls */}
                <div className="p-4 sm:p-5 rounded-[24px] bg-white border border-[#E5DFD9] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#141413] flex items-center gap-2 text-xs uppercase tracking-wider">
                      <MapPin className="w-4 h-4 text-[#CF4500]" />
                      Geospatial Coordinates
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
                        className={`text-xs py-1 px-3 rounded-[20px] border font-medium ${
                          useMapPicker ? 'bg-[#141413] text-white border-[#141413]' : 'bg-white text-[#141413] border-[#141413]'
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
                        center={[parseFloat(form.latitude) || 21.1458, parseFloat(form.longitude) || 79.0882]}
                        selectedLocation={{ lat: parseFloat(form.latitude) || 21.1458, lng: parseFloat(form.longitude) || 79.0882 }}
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
                </div>

                {/* Compass Direction Section */}
                <div className="p-4 sm:p-5 rounded-[24px] bg-white border border-[#E5DFD9] space-y-3">
                  <span className="font-bold text-[#141413] flex items-center gap-2 text-xs uppercase tracking-wider">
                    <Compass className="w-4 h-4 text-[#3860BE]" />
                    Lens Facing Direction ({form.directionAngle || 90}°)
                  </span>

                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'NORTH', angle: 0 },
                      { label: 'EAST', angle: 90 },
                      { label: 'SOUTH', angle: 180 },
                      { label: 'WEST', angle: 270 },
                    ].map((dir) => (
                      <button
                        key={dir.label}
                        type="button"
                        onClick={() => setForm({ ...form, cardinalDirection: dir.label, directionAngle: dir.angle })}
                        className={`p-2 rounded-[14px] border text-[10px] font-medium transition-all ${
                          form.directionAngle === dir.angle 
                            ? 'bg-[#141413] text-white border-[#141413] shadow-xs' 
                            : 'bg-white text-[#141413] border-[#E5DFD9] hover:bg-[#F3F0EE]'
                        }`}
                      >
                        {dir.label}
                      </button>
                    ))}
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
                form="surveyModalForm"
                disabled={addCameraMutation.isPending}
                className="mc-btn-primary"
              >
                {addCameraMutation.isPending ? 'Submitting...' : 'Submit Field Survey'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
