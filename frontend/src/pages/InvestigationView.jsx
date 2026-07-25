import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { CameraMap } from '../components/CameraMap';
import { useAuth } from '../context/AuthContext';
import { FileSearch, Plus, MapPin, ShieldAlert, CheckCircle2, Video, Compass, Navigation, Crosshair, Trash2, AlertTriangle, AlertCircle, Building2, User, History, Layers } from 'lucide-react';

export const InvestigationView = () => {
  const { user } = useAuth();
  const userRole = typeof user?.role === 'object' ? user?.role?.name : user?.role;
  const isPoliceOfficer = userRole === 'ROLE_POLICE_OFFICER';

  const queryClient = useQueryClient();
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [placeMode, setPlaceMode] = useState(true);
  const [modalMapPicker, setModalMapPicker] = useState(false);
  const [isCaseRemoved, setIsCaseRemoved] = useState(false);
  const [caseFilterStatus, setCaseFilterStatus] = useState('ALL');

  const [localCases, setLocalCases] = useState([]);
  const [userGpsLocation, setUserGpsLocation] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-fetch user live GPS location on mount for live blue GPS circle on map
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserGpsLocation({
            lat: Math.round(pos.coords.latitude * 100000) / 100000,
            lng: Math.round(pos.coords.longitude * 100000) / 100000,
          });
        },
        (err) => console.warn('User GPS capture skipped:', err)
      );
    }
  }, []);

  const getInitialCaseForm = () => ({
    caseNumber: `CAS-${Math.floor(1000 + Math.random() * 9000)}`,
    firNumber: `FIR-2026-${Math.floor(100 + Math.random() * 900)}`,
    title: 'Commercial District Theft Incident',
    crimeType: 'BURGLARY',
    crimeLocationName: 'Central Incident Point',
    latitude: 28.6139,
    longitude: 77.2090,
    incidentDate: new Date().toISOString().slice(0, 16),
    description: 'Reported snatching near traffic signal. Requires immediate CCTV footage check.',
    searchRadiusMeters: 500,
  });

  // Form State for creating new case
  const [form, setForm] = useState(getInitialCaseForm());

  // Query All Officer Investigation Cases Across Police Stations
  const { data: rawCasesData, isLoading: isAllCasesLoading } = useQuery({
    queryKey: ['investigations-all'],
    queryFn: async () => {
      const res = await api.get('/investigations?size=100').catch(() => null);
      return res?.data?.content || [];
    },
    refetchInterval: 3000,
  });

  // Filter cases strictly for police officer if ROLE_POLICE_OFFICER: ONLY cases added by or assigned to him!
  const allCasesData = (rawCasesData || []).filter((c) => {
    if (!isPoliceOfficer) return true; // Admin sees all pan-India cases
    return (
      c.assignedOfficerId === user?.id ||
      c.assignedOfficerName === user?.fullName ||
      c.createdBy === user?.username
    );
  });

  // Auto-fetch officer live GPS location when opening the Add Investigation Modal
  React.useEffect(() => {
    if (showCaseModal && navigator.geolocation) {
      setErrorMessage('');
      try {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (position?.coords?.latitude && position?.coords?.longitude) {
              setForm((prev) => ({
                ...prev,
                latitude: Math.round(position.coords.latitude * 100000) / 100000,
                longitude: Math.round(position.coords.longitude * 100000) / 100000,
              }));
            }
          },
          (error) => {
            console.warn('GPS auto-capture skipped:', error);
          }
        );
      } catch (err) {
        console.warn('GPS execution handled:', err);
      }
    }
  }, [showCaseModal]);

  const createCaseMutation = useMutation({
    mutationFn: (newCase) => api.post('/investigations', newCase),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['investigations-all']);
      queryClient.invalidateQueries(['dashboard-stats']);
      queryClient.invalidateQueries(['nearby-cameras-all']);
      setShowCaseModal(false);
      setIsCaseRemoved(false);
      setErrorMessage('');
      const createdObj = res?.data || {
        id: Date.now(),
        caseNumber: form.caseNumber,
        firNumber: form.firNumber,
        title: form.title,
        crimeType: form.crimeType,
        crimeLocationName: form.crimeLocationName || 'Incident Location',
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        searchRadiusMeters: parseFloat(form.searchRadiusMeters),
        description: form.description,
        assignedOfficerName: user?.fullName || 'Inspector Police Officer',
        policeStationName: user?.policeStationName || 'Central District HQ',
        status: 'ACTIVE',
        createdBy: user?.username
      };
      setLocalCases((prev) => [createdObj, ...prev]);
      setSelectedCaseId(createdObj.id);
      setForm(getInitialCaseForm());
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to open investigation case. Please check all fields.';
      setErrorMessage(msg);
    },
  });

  const handleCreateCase = (e) => {
    e.preventDefault();
    setErrorMessage('');
    let formattedDate = null;
    if (form.incidentDate) {
      formattedDate = form.incidentDate.length === 16 ? `${form.incidentDate}:00` : form.incidentDate;
    }
    createCaseMutation.mutate({
      ...form,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      searchRadiusMeters: parseFloat(form.searchRadiusMeters),
      incidentDate: formattedDate,
    });
  };

  const handleConfirmRemoveCase = async () => {
    if (activeCase?.id) {
      try {
        await api.delete(`/investigations/${activeCase.id}`);
      } catch (err) {
        console.warn('API case removal silently handled:', err);
      }
    }
    queryClient.invalidateQueries(['investigations-all']);
    queryClient.invalidateQueries(['crime-nearby-cameras']);
    setIsCaseRemoved(true);
    setSelectedCaseId(null);
    setShowDeleteModal(false);
  };

  const handleMapClickToPlaceCrime = (lat, lng) => {
    const roundedLat = Math.round(lat * 100000) / 100000;
    const roundedLng = Math.round(lng * 100000) / 100000;
    setIsCaseRemoved(false);
    setForm((prev) => ({
      ...prev,
      latitude: roundedLat,
      longitude: roundedLng,
      crimeLocationName: `Incident Pin (${roundedLat}, ${roundedLng})`
    }));
  };

  const handleGetCurrentGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsCaseRemoved(false);
          setForm((prev) => ({
            ...prev,
            latitude: Math.round(position.coords.latitude * 100000) / 100000,
            longitude: Math.round(position.coords.longitude * 100000) / 100000,
          }));
        },
        (error) => {
          alert('GPS location capture failed. Click directly on the map to place crime pin.');
        }
      );
    }
  };

  const fetchedCasesList = allCasesData || [];
  
  // Fallback demo cases if database list is empty
  const caseList = fetchedCasesList.length > 0 ? fetchedCasesList : [
    { id: 1, caseNumber: 'CAS-8492', firNumber: 'FIR-2026-104', title: 'Commercial Plaza Burglary Incident', crimeType: 'BURGLARY', crimeLocationName: 'North Market Junction', latitude: 28.6139, longitude: 77.2090, searchRadiusMeters: 500, assignedOfficerName: 'Inspector Rajesh Kumar', policeStationName: 'Central District HQ', status: 'ACTIVE', description: 'Reported snatching near traffic signal.' },
    { id: 2, caseNumber: 'CAS-9104', firNumber: 'FIR-2026-089', title: 'Vehicle Theft at Metro Gate 3', crimeType: 'VEHICLE_THEFT', crimeLocationName: 'Metro Sector 4', latitude: 28.6189, longitude: 77.2150, searchRadiusMeters: 800, assignedOfficerName: 'Sub-Inspector Vikram Singh', policeStationName: 'West Sector Station', status: 'IN_PROGRESS', description: 'Vehicle stolen between 2 PM and 4 PM.' }
  ];

  // Selected or active case object
  const selectedFoundCase = caseList.find(c => c.id === selectedCaseId);
  const activeCase = isCaseRemoved ? null : (selectedFoundCase || caseList[0]);

  const safeActiveLat = activeCase && !isNaN(parseFloat(activeCase.latitude)) ? parseFloat(activeCase.latitude) : 28.6139;
  const safeActiveLng = activeCase && !isNaN(parseFloat(activeCase.longitude)) ? parseFloat(activeCase.longitude) : 77.2090;

  const { data: nearbyData, isLoading: isNearbyLoading } = useQuery({
    queryKey: ['crime-nearby-cameras', safeActiveLat, safeActiveLng, activeCase?.searchRadiusMeters],
    queryFn: () => api.get(`/cameras/nearby?latitude=${safeActiveLat}&longitude=${safeActiveLng}&radiusMeters=${activeCase?.searchRadiusMeters || 500}`),
    enabled: !!activeCase,
    refetchInterval: 3000,
  });

  const rawNearby = nearbyData?.data?.content || nearbyData?.data || nearbyData || [];
  const nearbyCameras = activeCase ? (Array.isArray(rawNearby) ? rawNearby : []) : [];

  const filteredCaseList = caseFilterStatus === 'ALL' 
    ? caseList 
    : caseList.filter(c => c.status === caseFilterStatus);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 border-l-4 border-l-rose-500">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-rose-400" />
            Police Investigation Hub & Station Case Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">Inspect active & historical police cases across all stations, track assigned station details and case statuses.</p>
        </div>

        <div className="flex gap-2">
          {activeCase && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              Remove / Close Investigation
            </button>
          )}

          <button
            onClick={() => setShowCaseModal(true)}
            className="glass-button-primary shrink-0 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600"
          >
            <Plus className="w-4 h-4" />
            Create New Case
          </button>
        </div>
      </div>

      {/* Police Station Investigation Feed & Status Tracker Table */}
      <div className="glass-card p-5 space-y-4 border-l-4 border-l-indigo-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white text-base">Police Stations Active & Historical Cases Feed</h3>
            <span className="text-xs font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              {caseList.length} Station Cases
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Filter Status:</span>
            <select
              value={caseFilterStatus}
              onChange={(e) => setCaseFilterStatus(e.target.value)}
              className="glass-input text-xs bg-slate-900 font-semibold py-1 px-2.5 rounded-lg border-slate-700 text-slate-200"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Cases</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="CLOSED">Closed / Resolved</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Case & FIR</th>
                <th className="p-3">Title & Location</th>
                <th className="p-3">Handling Police Station</th>
                <th className="p-3">Assigned Police Officer</th>
                <th className="p-3">Investigation Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredCaseList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-slate-500">No police investigation cases found.</td>
                </tr>
              ) : (
                filteredCaseList.map((c) => {
                  const isSelected = activeCase?.id === c.id;
                  return (
                    <tr 
                      key={c.id || c.caseNumber} 
                      className={`transition-colors cursor-pointer ${
                        isSelected ? 'bg-police-600/20 border-l-2 border-l-police-400' : 'hover:bg-slate-800/40'
                      }`}
                      onClick={() => {
                        setSelectedCaseId(c.id);
                        setIsCaseRemoved(false);
                      }}
                    >
                      <td className="p-3">
                        <div className="font-mono font-bold text-indigo-300">{c.caseNumber}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{c.firNumber || 'N/A'}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-100">{c.title}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-rose-400" />
                          {c.crimeLocationName}
                        </div>
                      </td>
                      <td className="p-3 font-semibold text-blue-300 flex items-center gap-1.5 mt-2">
                        <Building2 className="w-3.5 h-3.5 text-blue-400" />
                        {c.policeStationName || 'Central District HQ'}
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-slate-200 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-indigo-400" />
                          {c.assignedOfficerName || 'Inspector Rajesh Kumar'}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          c.status === 'ACTIVE' || !c.status
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                            : c.status === 'IN_PROGRESS'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {c.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCaseId(c.id);
                            setIsCaseRemoved(false);
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            isSelected 
                              ? 'bg-police-600 text-white shadow-lg' 
                              : 'bg-slate-800 hover:bg-slate-700 text-police-300'
                          }`}
                        >
                          {isSelected ? 'Active on Map' : 'Select Case'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Map Controls Bar */}
      <div className="glass-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPlaceMode(!placeMode)}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 border transition-all ${
              placeMode
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-lg shadow-rose-950/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Crosshair className={`w-4 h-4 ${placeMode ? 'text-rose-400 animate-spin' : ''}`} />
            {placeMode ? '📍 Map Click Placement Mode ACTIVE' : 'Enable Map Click Placement'}
          </button>

          <button
            onClick={handleGetCurrentGPS}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-police-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all"
          >
            <Navigation className="w-3.5 h-3.5 text-police-400" />
            Current GPS Pin
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>Search Radius:</span>
          <select
            value={form.searchRadiusMeters}
            onChange={(e) => setForm({ ...form, searchRadiusMeters: parseFloat(e.target.value) })}
            className="glass-input text-xs bg-slate-950 font-mono py-1 px-2.5 rounded-lg border-slate-700"
          >
            <option value="250">250 Meters</option>
            <option value="500">500 Meters</option>
            <option value="1000">1,000 Meters (1 km)</option>
            <option value="2000">2,000 Meters (2 km)</option>
            <option value="5000">5,000 Meters (5 km)</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Active Case Details & Proximity Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Crime Scene Pin Details & Matched Cameras List */}
        <div className="space-y-4">
          {activeCase ? (
            <div className="glass-card p-5 space-y-3 border-l-2 border-l-rose-400">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-mono font-bold text-rose-400 text-sm">{activeCase.caseNumber}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {activeCase.firNumber}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-white text-base">{activeCase.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{activeCase.description}</p>
              </div>

              {/* Station & Officer Info */}
              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs space-y-1">
                <p className="font-bold text-blue-300 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  Handling Station: {activeCase.policeStationName || 'Central District HQ'}
                </p>
                <p className="text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  Officer: <strong>{activeCase.assignedOfficerName || 'Inspector Rajesh Kumar'}</strong>
                </p>
                <p className="text-[10px] text-slate-400 pt-0.5">
                  Investigation Status: <strong className="text-rose-400 uppercase">{activeCase.status || 'ACTIVE'}</strong>
                </p>
              </div>

              <div className="text-xs text-slate-400 space-y-1.5 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-200">
                  <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Crime Scene: <strong>{activeCase.crimeLocationName}</strong></span>
                </div>
                <div className="flex items-center justify-between font-mono text-[11px] bg-slate-900 p-2 rounded border border-slate-800 text-rose-300">
                  <span>Lat: {activeCase.latitude}</span>
                  <span>Lng: {activeCase.longitude}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-8 text-center space-y-3 border-l-4 border-l-slate-600">
              <AlertCircle className="w-10 h-10 text-slate-500 mx-auto" />
              <div>
                <h4 className="font-bold text-slate-200 text-sm">No Active Investigation Case Selected</h4>
                <p className="text-xs text-slate-500 mt-1">Select a case from the table above or click anywhere on the map to start an investigation.</p>
              </div>
            </div>
          )}

          {/* Matched Cameras List */}
          <div className="glass-card p-5 space-y-3">
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center justify-between">
              <span>Matched CCTV Units ({nearbyCameras.length})</span>
              <span className="text-[10px] text-emerald-400 font-mono">Sorted by Distance</span>
            </h4>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {!activeCase ? (
                <div className="p-4 text-center text-slate-500 text-xs">No active crime scene pin placed on map.</div>
              ) : isNearbyLoading ? (
                <div className="p-4 text-center text-slate-500 text-xs">Querying PostGIS radius...</div>
              ) : nearbyCameras.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-xs">No CCTV cameras registered within {activeCase.searchRadiusMeters}m radius.</div>
              ) : (
                nearbyCameras.map((cam) => (
                  <div key={cam.id || cam.cameraCode} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-police-500/40 transition-all space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-police-300 text-xs">{cam.cameraCode}</span>
                      <span className="text-[10px] font-bold text-rose-400 font-mono bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                        {cam.distanceMeters !== undefined ? `${cam.distanceMeters}m away` : 'Nearby'}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-200">{cam.cameraName}</p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                      <span className="flex items-center gap-1 text-slate-300">
                        <Compass className="w-3 h-3 text-police-400" />
                        Facing Angle: <strong>{cam.directionAngle || 0}°</strong>
                      </span>
                      <span>Type: {cam.cameraType}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Map with Crime Location Placement */}
        <div className="lg:col-span-2 glass-card p-5 min-h-[580px] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Interactive Crime Location Placement & Proximity View
            </h3>
            <span className="text-xs text-rose-400 font-mono font-bold flex items-center gap-1">
              <Crosshair className="w-3.5 h-3.5 text-rose-400" />
              Click Map to Drop Pin
            </span>
          </div>

          <div className="flex-1 w-full relative">
            <CameraMap
              cameras={nearbyCameras}
              center={activeCase ? [safeActiveLat, safeActiveLng] : (userGpsLocation ? [userGpsLocation.lat, userGpsLocation.lng] : [28.6139, 77.2090])}
              zoom={15}
              crimeLocation={activeCase ? { lat: safeActiveLat, lng: safeActiveLng, name: activeCase.crimeLocationName } : null}
              searchRadius={activeCase?.searchRadiusMeters || 500}
              selectedLocation={userGpsLocation}
              interactivePicker={placeMode}
              onMapClick={handleMapClickToPlaceCrime}
              autoFit={true}
            />
          </div>
        </div>
      </div>

      {/* Delete / Remove Investigation Confirmation Modal */}
      {showDeleteModal && activeCase && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-4 border-l-4 border-l-rose-500">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-rose-400 shrink-0" />
              <div>
                <h3 className="text-base font-bold text-white">Remove Investigation Case?</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Are you sure you want to close and remove <strong>{activeCase?.caseNumber || 'Selected Case'} ({activeCase?.title || ''})</strong>?
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveCase}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all"
              >
                Confirm Remove Case
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Case Modal */}
      {showCaseModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-card max-w-xl w-full p-6 space-y-4 my-8">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-2">Open Police Investigation Case</h3>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}
            <form onSubmit={handleCreateCase} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Case Number *</label>
                  <input
                    type="text"
                    required
                    value={form.caseNumber}
                    onChange={(e) => setForm({ ...form, caseNumber: e.target.value })}
                    className="glass-input w-full font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">FIR Number</label>
                  <input
                    type="text"
                    value={form.firNumber}
                    onChange={(e) => setForm({ ...form, firNumber: e.target.value })}
                    className="glass-input w-full font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Investigation Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="glass-input w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Crime Type *</label>
                  <input
                    type="text"
                    required
                    value={form.crimeType}
                    onChange={(e) => setForm({ ...form, crimeType: e.target.value })}
                    className="glass-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Search Radius (Meters) *</label>
                  <input
                    type="number"
                    required
                    value={form.searchRadiusMeters}
                    onChange={(e) => setForm({ ...form, searchRadiusMeters: parseFloat(e.target.value) || 500 })}
                    className="glass-input w-full font-mono"
                  />
                </div>
              </div>

              {/* Crime Location Controls */}
              <div className="space-y-2 border border-slate-800 p-3 rounded-xl bg-slate-900/50">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">Crime Scene Coordinates</span>
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
                      onClick={() => setModalMapPicker(!modalMapPicker)}
                      className={`px-2.5 py-1 rounded-lg border font-medium transition-all ${
                        modalMapPicker ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {modalMapPicker ? 'Close Map Picker' : 'Pick on Map'}
                    </button>
                  </div>
                </div>

                {modalMapPicker && (
                  <div className="h-48 w-full rounded-xl overflow-hidden my-2 border border-slate-700">
                    <CameraMap
                      interactivePicker={true}
                      center={[form.latitude, form.longitude]}
                      selectedLocation={{ lat: form.latitude, lng: form.longitude }}
                      onMapClick={handleMapClickToPlaceCrime}
                      zoom={15}
                      autoFit={false}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Crime Latitude *</label>
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
                    <label className="block text-slate-400 mb-1">Crime Longitude *</label>
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

              <div>
                <label className="block text-slate-400 mb-1">Incident Description</label>
                <textarea
                  rows="2"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="glass-input w-full"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCaseModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createCaseMutation.isPending}
                  className="glass-button-primary"
                >
                  {createCaseMutation.isPending ? 'Discovering Cameras...' : 'Open Case & Auto-Match Cameras'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
