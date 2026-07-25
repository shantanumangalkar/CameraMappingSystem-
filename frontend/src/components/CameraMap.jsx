import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import { Camera, Shield, Eye, AlertTriangle, QrCode, MapPin, Navigation, Compass, User, Phone, Lock, Building2 } from 'lucide-react';

// Helper to generate coordinates for a Field-of-View (FOV) sector wedge
const getFovPolygonCoordinates = (lat, lon, directionAngle = 0, radiusMeters = 80, fovAngleDegrees = 60) => {
  if (!lat || !lon) return [];
  const points = [[lat, lon]];
  const startAngle = directionAngle - fovAngleDegrees / 2;
  const endAngle = directionAngle + fovAngleDegrees / 2;
  const step = (endAngle - startAngle) / 8;

  const metersPerLatDegree = 111320;
  const metersPerLonDegree = 111320 * Math.cos((lat * Math.PI) / 180);

  for (let a = startAngle; a <= endAngle; a += step) {
    const rad = ((90 - a) * Math.PI) / 180;
    const ptLat = lat + (radiusMeters * Math.sin(rad)) / metersPerLatDegree;
    const ptLon = lon + (radiusMeters * Math.cos(rad)) / metersPerLonDegree;
    points.push([ptLat, ptLon]);
  }

  points.push([lat, lon]);
  return points;
};

// Custom SVG Marker for Police Station Headquarters
const createPoliceStationIcon = () => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="44" height="44">
      <circle cx="20" cy="20" r="18" fill="#1e40af" fill-opacity="0.3" stroke="#2563eb" stroke-width="2.5"/>
      <rect x="11" y="14" width="18" height="14" rx="2" fill="#1d4ed8" stroke="#ffffff" stroke-width="1.5"/>
      <polygon points="20,7 31,14 9,14" fill="#1e40af"/>
      <path d="M20 17L22.5 21L27 21.5L23.5 24.5L24.5 29L20 26.5L15.5 29L16.5 24.5L13 21.5L17.5 21Z" fill="#fbbf24"/>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'police-station-icon',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
};

// Custom SVG Markers for Camera Status with Orientation Arrow
const createCameraIcon = (status, verificationStatus, directionAngle = 0) => {
  let color = '#10b981'; // Green for Active & Approved
  if (status === 'OFFLINE') color = '#ef4444'; // Red
  if (status === 'UNDER_MAINTENANCE' || verificationStatus === 'PENDING') color = '#f59e0b'; // Amber for Pending

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="40" height="40">
      <!-- Outer Direction Ring with Arrow -->
      <g transform="rotate(${directionAngle}, 18, 18)">
        <polygon points="18,2 23,10 13,10" fill="${color}"/>
        <circle cx="18" cy="18" r="14" fill="none" stroke="${color}" stroke-width="1.5" stroke-dasharray="3 2"/>
      </g>
      <!-- Center Camera Node -->
      <circle cx="18" cy="18" r="9" fill="${color}" fill-opacity="0.3" stroke="${color}" stroke-width="2.5"/>
      <circle cx="18" cy="18" r="5" fill="${color}"/>
      ${verificationStatus === 'PENDING' ? '<circle cx="25" cy="11" r="4" fill="#f59e0b" stroke="#ffffff" stroke-width="1"/>' : ''}
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'custom-camera-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const createCrimeSceneIcon = () => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="48" height="48">
      <circle cx="20" cy="20" r="18" fill="#dc2626" fill-opacity="0.25" stroke="#dc2626" stroke-width="3"/>
      <circle cx="20" cy="20" r="10" fill="#dc2626" fill-opacity="0.4"/>
      <path d="M20 6L24 14L32 15L26 21L27 29L20 25L13 29L14 21L8 15L16 14L20 6Z" fill="#ef4444"/>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'crime-scene-icon',
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
};

const createLiveGpsIcon = () => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="44" height="44">
      <circle cx="20" cy="20" r="18" fill="#3b82f6" fill-opacity="0.3" stroke="#2563eb" stroke-width="2.5"/>
      <circle cx="20" cy="20" r="10" fill="#2563eb"/>
      <circle cx="20" cy="20" r="4" fill="#ffffff"/>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'live-gps-icon',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
};

// Auto-adjust map viewport bounds smoothly to crimeLocation, target GPS, or cameras
const AutoBounds = ({ cameras, stations, crimeLocation, selectedLocation, autoFit }) => {
  const map = useMap();

  useEffect(() => {
    if (!autoFit) return;
    if (crimeLocation?.lat && crimeLocation?.lng) {
      map.setView([crimeLocation.lat, crimeLocation.lng], 15);
      return;
    }
    if (selectedLocation?.lat && selectedLocation?.lng) {
      map.setView([selectedLocation.lat, selectedLocation.lng], 15);
      return;
    }
  }, [crimeLocation, selectedLocation, autoFit, map]);

  return null;
};

// Map click listener for setting coordinates in Add Camera modal
const MapClickListener = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

export const CameraMap = ({ 
  cameras = [], 
  stations = [],
  center = [28.6139, 77.2090], 
  zoom = 14, 
  crimeLocation = null,
  searchRadius = 500,
  onSelectCamera,
  onMapClick,
  selectedLocation = null,
  interactivePicker = false,
  autoFit = true
}) => {
  const { user } = useAuth();
  const userRole = typeof user?.role === 'object' ? user?.role?.name : user?.role;
  const isSurveyor = userRole === 'ROLE_SURVEY_PERSON';

  // Pan-India Police Stations across major metropolitan cities
  const defaultStations = stations.length > 0 ? stations : [
    { id: 101, stationCode: 'PS-DEL-01', stationName: 'Delhi Police Central HQ (ITO)', latitude: 28.6280, longitude: 77.2410, address: 'ITO, New Delhi', contactNumber: '+91-11-23490000', jurisdictionZone: 'Central Delhi' },
    { id: 102, stationCode: 'PS-DEL-02', stationName: 'Connaught Place Police Station', latitude: 28.6328, longitude: 77.2197, address: 'Parliament Street, New Delhi', contactNumber: '+91-11-23340000', jurisdictionZone: 'NDMC Zone' },
    { id: 103, stationCode: 'PS-MUM-01', stationName: 'Mumbai City Police Commissionerate HQ', latitude: 18.9452, longitude: 72.8336, address: 'Crawford Market, Fort, Mumbai', contactNumber: '+91-22-22620111', jurisdictionZone: 'Greater Mumbai' },
    { id: 104, stationCode: 'PS-MUM-02', stationName: 'Bandra Police Station HQ', latitude: 19.0596, longitude: 72.8295, address: 'Bandra West, Mumbai', contactNumber: '+91-22-26422000', jurisdictionZone: 'Western Suburbs' },
    { id: 105, stationCode: 'PS-BLR-01', stationName: 'Bengaluru City Police Commissionerate', latitude: 12.9818, longitude: 77.5975, address: 'Infantry Road, Bengaluru', contactNumber: '+91-80-22942222', jurisdictionZone: 'Bengaluru Urban' },
    { id: 106, stationCode: 'PS-BLR-02', stationName: 'Electronic City Police Station', latitude: 12.8452, longitude: 77.6602, address: 'Electronic City, Bengaluru', contactNumber: '+91-80-22943300', jurisdictionZone: 'Tech Corridor' },
    { id: 107, stationCode: 'PS-HYD-01', stationName: 'Hyderabad City Police Commissionerate', latitude: 17.3985, longitude: 78.4746, address: 'Basheerbagh, Hyderabad', contactNumber: '+91-40-27852435', jurisdictionZone: 'Hyderabad Urban' },
    { id: 108, stationCode: 'PS-HYD-02', stationName: 'Cyberabad Police HQ', latitude: 17.4401, longitude: 78.3489, address: 'Gachibowli, Hyderabad', contactNumber: '+91-40-27853400', jurisdictionZone: 'Cyberabad IT Zone' },
    { id: 109, stationCode: 'PS-KOL-01', stationName: 'Lalbazar Kolkata Police HQ', latitude: 22.5726, longitude: 88.3512, address: 'BBD Bagh, Kolkata', contactNumber: '+91-33-22143000', jurisdictionZone: 'Kolkata Metro' },
    { id: 110, stationCode: 'PS-CHE-01', stationName: 'Greater Chennai Police Commissionerate', latitude: 13.0878, longitude: 80.2642, address: 'Vepery, Chennai', contactNumber: '+91-44-23452320', jurisdictionZone: 'Chennai Central' },
    { id: 111, stationCode: 'PS-AMD-01', stationName: 'Ahmedabad City Police HQ', latitude: 23.0524, longitude: 72.5935, address: 'Shahibaug, Ahmedabad', contactNumber: '+91-79-25630100', jurisdictionZone: 'Ahmedabad Metro' },
    { id: 112, stationCode: 'PS-JAI-01', stationName: 'Jaipur Police Commissionerate HQ', latitude: 26.9157, longitude: 75.8110, address: 'MI Road, Jaipur', contactNumber: '+91-141-2373000', jurisdictionZone: 'Jaipur Urban' },
    { id: 113, stationCode: 'PS-NGP-01', stationName: 'Nagpur Police Commissionerate HQ', latitude: 21.1524, longitude: 79.0801, address: 'Civil Lines, Nagpur', contactNumber: '+91-712-2560300', jurisdictionZone: 'Nagpur City HQ' },
    { id: 114, stationCode: 'PS-NGP-02', stationName: 'Sitabuldi Police Station', latitude: 21.1458, longitude: 79.0882, address: 'Main Road, Sitabuldi, Nagpur', contactNumber: '+91-712-2522000', jurisdictionZone: 'Central Nagpur' },
    { id: 115, stationCode: 'PS-NGP-03', stationName: 'Sadar Police Station', latitude: 21.1620, longitude: 79.0780, address: 'Sadar Bazaar, Nagpur', contactNumber: '+91-712-2531000', jurisdictionZone: 'North Nagpur' },
    { id: 116, stationCode: 'PS-NGP-04', stationName: 'Ambazari Police Station', latitude: 21.1350, longitude: 79.0550, address: 'Ambazari, Nagpur', contactNumber: '+91-712-2542000', jurisdictionZone: 'West Nagpur' },
    { id: 117, stationCode: 'PS-NGP-05', stationName: 'Dharampeth Police Station', latitude: 21.1410, longitude: 79.0680, address: 'Dharampeth, Nagpur', contactNumber: '+91-712-2553000', jurisdictionZone: 'Dharampeth Hub' }
  ];

  const isValidLat = (val) => typeof val === 'number' && !isNaN(val) && val >= -90 && val <= 90;
  const isValidLng = (val) => typeof val === 'number' && !isNaN(val) && val >= -180 && val <= 180;

  const safeCenterLat = isValidLat(center?.[0]) ? center[0] : 28.6139;
  const safeCenterLng = isValidLng(center?.[1]) ? center[1] : 77.2090;
  const safeCenter = [safeCenterLat, safeCenterLng];

  const validSelectedLoc = selectedLocation && isValidLat(selectedLocation.lat) && isValidLng(selectedLocation.lng) ? selectedLocation : null;
  const validCrimeLoc = crimeLocation && isValidLat(crimeLocation.lat) && isValidLng(crimeLocation.lng) ? crimeLocation : null;

  return (
    <div className="w-full h-full min-h-[450px] relative rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
      <MapContainer 
        center={safeCenter} 
        zoom={zoom} 
        scrollWheelZoom={true} 
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <AutoBounds 
          cameras={cameras} 
          stations={defaultStations}
          crimeLocation={crimeLocation} 
          selectedLocation={selectedLocation} 
          autoFit={autoFit} 
        />

        {interactivePicker && <MapClickListener onMapClick={onMapClick} />}

        {/* Live GPS Patrol Location Marker & Blue Pulsing Proximity Circle */}
        {validSelectedLoc && (
          <>
            <Marker position={[validSelectedLoc.lat, validSelectedLoc.lng]} icon={createLiveGpsIcon()}>
              <Popup>
                <div className="p-1.5 text-blue-950 text-xs font-bold space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-700 font-mono text-[11px] border-b pb-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                    📡 LIVE GPS PATROL LOCATION
                  </div>
                  <p>Coords: {validSelectedLoc.lat.toFixed(5)}, {validSelectedLoc.lng.toFixed(5)}</p>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={[validSelectedLoc.lat, validSelectedLoc.lng]}
              radius={250}
              pathOptions={{
                color: '#2563eb',
                fillColor: '#3b82f6',
                fillOpacity: 0.2,
                weight: 2.5,
                dashArray: '6, 6'
              }}
            />
          </>
        )}

        {/* Police Station Headquarters Markers */}
        {defaultStations.map((st) => {
          if (!st.latitude || !st.longitude) return null;

          return (
            <Marker
              key={`station-${st.id || st.stationCode}`}
              position={[st.latitude, st.longitude]}
              icon={createPoliceStationIcon()}
            >
              <Popup>
                <div className="p-2.5 text-slate-900 min-w-[250px]">
                  <div className="flex items-center justify-between border-b pb-1.5 mb-2">
                    <span className="font-bold text-blue-900 font-mono text-xs flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-blue-700" />
                      {st.stationCode}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono">
                      🇮🇳 CCTNS VERIFIED
                    </span>
                  </div>

                  <p className="font-bold text-sm leading-tight text-blue-950">{st.stationName}</p>
                  <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {st.address || st.jurisdictionZone || 'Metropolitan Station'}
                  </p>

                  <div className="mt-2 p-2 rounded-lg bg-blue-50 border border-blue-200 text-xs space-y-1">
                    <p className="text-[10px] text-blue-900 font-semibold flex justify-between">
                      <span>CCTNS ID:</span>
                      <span className="font-mono font-bold">{st.cctnsStationId || `CCTNS-${st.stationCode}`}</span>
                    </p>
                    <p className="text-[10px] text-slate-700 flex justify-between">
                      <span>State Bureau:</span>
                      <strong>{st.stateBureau || 'State Police Bureau'}</strong>
                    </p>
                    <p className="font-semibold text-blue-900 flex items-center gap-1 font-mono pt-1 border-t border-blue-200">
                      <Phone className="w-3.5 h-3.5 text-blue-700" />
                      Helpline: <strong>{st.contactNumber || '+91 11 100'}</strong>
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Crime Scene Location & Proximity Search Radius Circle */}
        {validCrimeLoc && (
          <>
            <Marker position={[validCrimeLoc.lat, validCrimeLoc.lng]} icon={createCrimeSceneIcon()}>
              <Popup>
                <div className="p-2.5 text-slate-900 font-medium">
                  <p className="font-bold text-red-600 flex items-center gap-1 text-sm">
                    🚨 CRIME SCENE LOCATION
                  </p>
                  <p className="text-xs text-slate-700 font-semibold mt-1">{validCrimeLoc.name || 'Active Incident'}</p>
                  <p className="text-[11px] text-slate-500 font-mono">Coords: {validCrimeLoc.lat}, {validCrimeLoc.lng}</p>
                  <p className="text-[10px] text-red-600 font-bold mt-1 bg-red-50 p-1 rounded border border-red-200">
                    Auto Radius Detection: {searchRadius}m
                  </p>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={[validCrimeLoc.lat, validCrimeLoc.lng]}
              radius={searchRadius}
              pathOptions={{
                color: '#ef4444',
                fillColor: '#ef4444',
                fillOpacity: 0.15,
                weight: 2.5,
                dashArray: '8, 8'
              }}
            />
          </>
        )}

        {/* CCTV Cameras with FOV Direction Cones */}
        {cameras.map((cam) => {
          if (!cam.latitude || !cam.longitude) return null;

          const fovPolygon = getFovPolygonCoordinates(
            cam.latitude,
            cam.longitude,
            cam.directionAngle || 0,
            cam.coverageRadiusMeters || 80,
            cam.fovAngle || 60
          );

          const coneColor = cam.verificationStatus === 'APPROVED' 
            ? (cam.cameraStatus === 'ACTIVE' ? '#10b981' : '#ef4444') 
            : '#f59e0b';

          return (
            <React.Fragment key={cam.id || cam.cameraCode}>
              {/* Field of View (FOV) Sector Cone Polygon on Map */}
              {fovPolygon.length > 0 && (
                <Polygon
                  positions={fovPolygon}
                  pathOptions={{
                    color: coneColor,
                    fillColor: coneColor,
                    fillOpacity: 0.22,
                    weight: 1.5,
                    dashArray: cam.verificationStatus === 'PENDING' ? '4, 4' : null
                  }}
                />
              )}

              {/* Camera Marker with Rotated Direction Angle Arrow */}
              <Marker
                position={[cam.latitude, cam.longitude]}
                icon={createCameraIcon(cam.cameraStatus, cam.verificationStatus, cam.directionAngle || 0)}
                eventHandlers={{
                  click: () => onSelectCamera && onSelectCamera(cam)
                }}
              >
                <Popup>
                  <div className="p-2 text-slate-900 min-w-[240px]">
                    <div className="flex items-center justify-between gap-2 border-b pb-1 mb-2">
                      <span className="font-bold text-police-700 font-mono text-sm">{cam.cameraCode}</span>
                      <div className="flex gap-1">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          cam.cameraStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {cam.cameraStatus}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          cam.verificationStatus === 'APPROVED' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {cam.verificationStatus}
                        </span>
                      </div>
                    </div>

                    <p className="font-semibold text-sm leading-tight">{cam.cameraName}</p>
                    <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {cam.fullAddress || cam.area || 'Central District'}
                    </p>

                    {/* Camera Owner Info Card (Restricted for Surveyors) */}
                    {isSurveyor ? (
                      <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1 font-semibold flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span className="text-[10px]">Owner Info Restricted (Police Access Only)</span>
                      </div>
                    ) : (
                      <div className="mt-2 p-2 rounded-lg bg-blue-50 border border-blue-200 text-xs space-y-1">
                        <p className="font-bold text-blue-950 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-blue-700" />
                          Owner: {cam.ownerName || 'Metropolitan Police Dept'}
                        </p>
                        {cam.ownerContact && (
                          <p className="text-[11px] text-blue-900 flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-blue-700" />
                            Contact: <strong>{cam.ownerContact}</strong>
                          </p>
                        )}
                        <p className="text-[9px] text-blue-700 font-semibold uppercase">
                          Type: {cam.ownerType || 'PUBLIC_GOVT'}
                        </p>
                      </div>
                    )}

                    <div className="mt-2 text-[11px] text-slate-700 bg-slate-50 p-2 rounded border border-slate-200 space-y-1">
                      <div className="flex justify-between">
                        <span>Camera Type:</span>
                        <strong className="font-mono">{cam.cameraType}</strong>
                      </div>
                      <div className="flex justify-between text-police-700 font-bold">
                        <span className="flex items-center gap-1">
                          <Compass className="w-3.5 h-3.5 text-police-600" /> Facing Direction:
                        </span>
                        <span>{cam.cardinalDirection || 'EAST'} ({cam.directionAngle || 0}°)</span>
                      </div>
                      <div className="flex justify-between text-amber-700 font-bold">
                        <span>FOV Capture Width:</span>
                        <span>{cam.fovAngle || 60}° Spread</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Coverage Radius:</span>
                        <strong>{cam.coverageRadiusMeters || 80}m</strong>
                      </div>
                      {cam.distanceMeters !== undefined && (
                        <div className="flex justify-between text-rose-600 font-bold pt-1 border-t border-slate-200">
                          <span>Proximity to Crime:</span>
                          <span>{cam.distanceMeters}m</span>
                        </div>
                      )}
                    </div>

                    {/* QR Code Tag */}
                    <div className="mt-2 pt-2 border-t flex items-center gap-2">
                      <img 
                        src={cam.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${cam.cameraCode}`} 
                        alt="QR Code" 
                        className="w-10 h-10 rounded border border-slate-300 bg-white p-0.5"
                      />
                      <div className="text-[10px] text-slate-500">
                        <p className="font-bold text-slate-700">Digital Hardware Tag</p>
                        <p>Scan for instant verification</p>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};
