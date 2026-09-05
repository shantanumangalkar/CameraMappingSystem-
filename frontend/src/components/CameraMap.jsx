import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import { Camera, Shield, Eye, AlertTriangle, MapPin, Navigation, Compass, User, Phone, Lock, Building2, Radio, ArrowRight } from 'lucide-react';

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

// Official Police Station Pin Marker
const createPoliceStationIcon = () => {
  const html = `
    <div class="relative flex items-center justify-center filter drop-shadow-md hover:scale-110 transition-transform cursor-pointer">
      <img 
        src="/police-station-marker.png" 
        alt="Police Station Precinct" 
        class="w-[38px] h-[44px] object-contain drop-shadow-sm" 
      />
    </div>
  `;

  return L.divIcon({
    html: html,
    className: 'police-station-marker-pin',
    iconSize: [38, 44],
    iconAnchor: [19, 44],
    popupAnchor: [0, -44],
  });
};

// Custom SVG Marker for Camera Node with Rotating Direction Arrow & Satellite Circle
const createCameraIcon = (status, verificationStatus, directionAngle = 0, isSelected = false) => {
  let color = '#10B981'; // Green for Active
  if (status === 'OFFLINE' || verificationStatus === 'REJECTED') color = '#CF4500'; // Signal Orange / Red
  if (status === 'UNDER_MAINTENANCE' || verificationStatus === 'PENDING') color = '#F79E1B'; // Amber

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="${isSelected ? '46' : '38'}" height="${isSelected ? '46' : '38'}">
      ${isSelected ? `<circle cx="20" cy="20" r="19" fill="none" stroke="#141413" stroke-width="2.5" stroke-dasharray="3 2"/>` : ''}
      <!-- Direction Indicator Arrow -->
      <g transform="rotate(${directionAngle}, 20, 20)">
        <polygon points="20,2 25,11 15,11" fill="${color}"/>
        <circle cx="20" cy="20" r="14" fill="none" stroke="${color}" stroke-width="1.5" stroke-opacity="0.7"/>
      </g>
      <!-- Center Camera Hub -->
      <circle cx="20" cy="20" r="9" fill="#FFFFFF" stroke="#141413" stroke-width="2"/>
      <circle cx="20" cy="20" r="5" fill="${color}"/>
      ${verificationStatus === 'PENDING' ? '<circle cx="27" cy="13" r="3.5" fill="#F79E1B" stroke="#FFFFFF" stroke-width="1"/>' : ''}
    </svg>
  `;

  const size = isSelected ? 46 : 38;
  return L.divIcon({
    html: svg,
    className: 'custom-camera-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Crime Scene Pin: Ink Black & Signal Orange Target
const createCrimeSceneIcon = () => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44" width="46" height="46">
      <circle cx="22" cy="22" r="20" fill="#CF4500" fill-opacity="0.2" stroke="#CF4500" stroke-width="2.5"/>
      <circle cx="22" cy="22" r="12" fill="#141413"/>
      <polygon points="22,7 26,16 35,17 28,24 30,33 22,28 14,33 16,24 9,17 18,16" fill="#F37338"/>
      <circle cx="22" cy="22" r="3" fill="#FFFFFF"/>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'crime-scene-marker',
    iconSize: [46, 46],
    iconAnchor: [23, 23],
  });
};

// Live GPS Marker
const createLiveGpsIcon = () => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
      <circle cx="20" cy="20" r="16" fill="#141413" fill-opacity="0.2" stroke="#141413" stroke-width="2"/>
      <circle cx="20" cy="20" r="9" fill="#141413"/>
      <circle cx="20" cy="20" r="3.5" fill="#F37338"/>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'live-gps-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

// Dedicated Map Picker Target Pin Icon
const createPickerPinIcon = () => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 46 46" width="46" height="46">
      <circle cx="23" cy="23" r="18" fill="#CF4500" fill-opacity="0.25">
        <animate attributeName="r" values="14;22;14" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="fill-opacity" values="0.35;0.08;0.35" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="23" cy="23" r="10" fill="#141413" stroke="#FFFFFF" stroke-width="2.5"/>
      <circle cx="23" cy="23" r="4.5" fill="#CF4500"/>
      <!-- Crosshairs -->
      <line x1="23" y1="3" x2="23" y2="10" stroke="#CF4500" stroke-width="2" stroke-linecap="round"/>
      <line x1="23" y1="36" x2="23" y2="43" stroke="#CF4500" stroke-width="2" stroke-linecap="round"/>
      <line x1="3" y1="23" x2="10" y2="23" stroke="#CF4500" stroke-width="2" stroke-linecap="round"/>
      <line x1="36" y1="23" x2="43" y2="23" stroke="#CF4500" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'picker-target-pin',
    iconSize: [46, 46],
    iconAnchor: [23, 23],
  });
};

// Invalidate Leaflet map size on mount and container layout change
const MapInvalidator = () => {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 120);
    const t2 = setTimeout(() => map.invalidateSize(), 350);
    const t3 = setTimeout(() => map.invalidateSize(), 700);

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    const container = map.getContainer();
    if (container) {
      resizeObserver.observe(container);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      resizeObserver.disconnect();
    };
  }, [map]);

  return null;
};

// Auto pan to newly picked location
const MapPanToSelected = ({ selectedLocation, active }) => {
  const map = useMap();
  useEffect(() => {
    if (active && selectedLocation?.lat && selectedLocation?.lng) {
      map.panTo([selectedLocation.lat, selectedLocation.lng], { animate: true, duration: 0.5 });
    }
  }, [selectedLocation?.lat, selectedLocation?.lng, active, map]);
  return null;
};

// Auto-adjust map viewport
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

// Map click listener that supports all caller argument signatures safely
const MapClickListener = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        const lat = Math.round(e.latlng.lat * 100000) / 100000;
        const lng = Math.round(e.latlng.lng * 100000) / 100000;
        const locObj = { lat, lng, latitude: lat, longitude: lng };
        try {
          // Pass (lat, lng, locObj) so both fn(lat, lng) and fn(locObj) work seamlessly
          onMapClick(lat, lng, locObj);
        } catch (err) {
          console.error('onMapClick handler error:', err);
        }
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
  selectedCameraId = null,
  interactivePicker = false,
  autoFit = true
}) => {
  const { user } = useAuth();
  const userRole = typeof user?.role === 'object' ? user?.role?.name : user?.role;
  const isSurveyor = userRole === 'ROLE_SURVEY_PERSON';

  const defaultStations = stations.length > 0 ? stations : [
    { id: 101, stationCode: 'PS-DEL-01', stationName: 'Delhi Police Central HQ (ITO)', latitude: 28.6280, longitude: 77.2410, address: 'ITO, New Delhi', contactNumber: '+91-11-23490000', jurisdictionZone: 'Central Delhi' },
    { id: 102, stationCode: 'PS-DEL-02', stationName: 'Connaught Place Police Station', latitude: 28.6328, longitude: 77.2197, address: 'Parliament Street, New Delhi', contactNumber: '+91-11-23340000', jurisdictionZone: 'NDMC Zone' },
    { id: 103, stationCode: 'PS-MUM-01', stationName: 'Mumbai City Police Commissionerate HQ', latitude: 18.9452, longitude: 72.8336, address: 'Crawford Market, Fort, Mumbai', contactNumber: '+91-22-22620111', jurisdictionZone: 'Greater Mumbai' },
    { id: 104, stationCode: 'PS-BLR-01', stationName: 'Bengaluru City Police Commissionerate', latitude: 12.9818, longitude: 77.5975, address: 'Infantry Road, Bengaluru', contactNumber: '+91-80-22942222', jurisdictionZone: 'Bengaluru Urban' },
    { id: 105, stationCode: 'PS-NGP-01', stationName: 'Nagpur Police Commissionerate HQ', latitude: 21.1524, longitude: 79.0801, address: 'Civil Lines, Nagpur', contactNumber: '+91-712-2560300', jurisdictionZone: 'Nagpur City HQ' },
    { id: 106, stationCode: 'PS-NGP-02', stationName: 'Sitabuldi Police Station', latitude: 21.1458, longitude: 79.0882, address: 'Main Road, Sitabuldi, Nagpur', contactNumber: '+91-712-2522000', jurisdictionZone: 'Central Nagpur' }
  ];

  const isValidLat = (val) => typeof val === 'number' && !isNaN(val) && val >= -90 && val <= 90;
  const isValidLng = (val) => typeof val === 'number' && !isNaN(val) && val >= -180 && val <= 180;

  const safeCenterLat = isValidLat(center?.[0]) ? center[0] : 28.6139;
  const safeCenterLng = isValidLng(center?.[1]) ? center[1] : 77.2090;
  const safeCenter = [safeCenterLat, safeCenterLng];

  const validSelectedLoc = selectedLocation && isValidLat(selectedLocation.lat) && isValidLng(selectedLocation.lng) ? selectedLocation : null;
  const validCrimeLoc = crimeLocation && isValidLat(crimeLocation.lat) && isValidLng(crimeLocation.lng) ? crimeLocation : null;

  return (
    <div className={`w-full h-full ${interactivePicker ? 'min-h-[220px] cursor-crosshair' : 'min-h-[340px]'} relative rounded-[28px] sm:rounded-[36px] overflow-hidden border border-[#E5DFD9] shadow-mc-card bg-[#F3F0EE]`}>
      <MapContainer 
        center={safeCenter} 
        zoom={zoom} 
        scrollWheelZoom={true} 
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Dynamic viewport & size recalculations */}
        <MapInvalidator />
        <MapPanToSelected selectedLocation={validSelectedLoc} active={interactivePicker} />

        <AutoBounds 
          cameras={cameras} 
          stations={defaultStations}
          crimeLocation={crimeLocation} 
          selectedLocation={selectedLocation} 
          autoFit={autoFit} 
        />

        {interactivePicker && <MapClickListener onMapClick={onMapClick} />}

        {/* Selected / Live Patrol Location Marker */}
        {validSelectedLoc && (
          <>
            <Marker 
              position={[validSelectedLoc.lat, validSelectedLoc.lng]} 
              icon={interactivePicker ? createPickerPinIcon() : createLiveGpsIcon()}
            >
              <Popup>
                <div className="p-3 text-[#141413] text-xs font-semibold space-y-1.5 min-w-[210px]">
                  <div className="flex items-center gap-1.5 text-[#141413] font-mono text-[11px] font-bold border-b border-[#E5DFD9] pb-1">
                    <span className={`w-2 h-2 rounded-full ${interactivePicker ? 'bg-[#CF4500]' : 'bg-[#F37338]'} animate-ping`}></span>
                    <span>{interactivePicker ? 'SELECTED REGISTRATION POINT' : 'PATROL GPS LOCATION'}</span>
                  </div>
                  <p className="text-[#696969] font-mono text-[11px] leading-relaxed">
                    Lat: <span className="text-[#141413] font-bold">{validSelectedLoc.lat.toFixed(5)}</span><br/>
                    Lng: <span className="text-[#141413] font-bold">{validSelectedLoc.lng.toFixed(5)}</span>
                  </p>
                  {interactivePicker && (
                    <p className="text-[10px] text-[#CF4500] font-sans font-semibold pt-0.5">
                      ✓ Location locked (Click anywhere to relocate)
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
            <Circle
              center={[validSelectedLoc.lat, validSelectedLoc.lng]}
              radius={interactivePicker ? 60 : 250}
              pathOptions={{
                color: interactivePicker ? '#CF4500' : '#141413',
                fillColor: interactivePicker ? '#CF4500' : '#141413',
                fillOpacity: interactivePicker ? 0.12 : 0.08,
                weight: 2,
                dashArray: '4, 4'
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
                <div className="p-3.5 text-[#141413] min-w-[260px] space-y-2">
                  <div className="flex items-center justify-between border-b border-[#E5DFD9] pb-1.5">
                    <span className="font-bold text-[#141413] font-mono text-xs flex items-center gap-1.5">
                      <img src="/police-station-marker.png" alt="Police Precinct" className="w-4 h-4 object-contain shrink-0" />
                      {st.stationCode}
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#EAF7EE] text-[#0A7334] border border-[#BDE7CA] font-mono">
                      CCTNS VERIFIED
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-[#141413] leading-snug">{st.stationName}</h4>
                    <p className="text-xs text-[#696969] mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#9A3A0A] shrink-0" />
                      {st.address || st.jurisdictionZone || 'Metropolitan Station'}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-[16px] bg-[#F3F0EE] border border-[#E5DFD9] text-xs space-y-1">
                    <p className="text-[11px] text-[#696969] flex justify-between">
                      <span>Jurisdiction:</span>
                      <strong className="text-[#141413]">{st.jurisdictionZone || 'Central Zone'}</strong>
                    </p>
                    <p className="font-semibold text-[#141413] flex items-center gap-1 font-mono pt-1 border-t border-[#E5DFD9] text-[11px]">
                      <Phone className="w-3.5 h-3.5 text-[#CF4500]" />
                      Helpline: <strong>{st.contactNumber || '+91 11 100'}</strong>
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Crime Scene Location, Radius, and Connective Orbital Trajectory Lines */}
        {validCrimeLoc && (
          <>
            <Marker position={[validCrimeLoc.lat, validCrimeLoc.lng]} icon={createCrimeSceneIcon()}>
              <Popup>
                <div className="p-3 text-[#141413] min-w-[220px] space-y-1.5">
                  <p className="font-bold text-[#CF4500] flex items-center gap-1 text-xs uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-[#CF4500]"></span>
                    Crime Scene Incident Target
                  </p>
                  <p className="text-sm font-semibold text-[#141413]">{validCrimeLoc.name || 'Incident Focal Point'}</p>
                  <p className="text-[11px] text-[#696969] font-mono">Coords: {validCrimeLoc.lat}, {validCrimeLoc.lng}</p>
                  <p className="text-[11px] text-[#CF4500] font-bold bg-[#FDF0EE] p-1.5 rounded-full border border-[#F8C6BC] text-center">
                    Investigation Radius: {searchRadius}m
                  </p>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={[validCrimeLoc.lat, validCrimeLoc.lng]}
              radius={searchRadius}
              pathOptions={{
                color: '#CF4500',
                fillColor: '#F37338',
                fillOpacity: 0.1,
                weight: 2,
                dashArray: '6, 6'
              }}
            />

            {/* Connective Orbital Trajectory Lines between Crime Scene and Nearby CCTV Nodes */}
            {cameras.map((cam) => {
              if (!cam.latitude || !cam.longitude) return null;
              return (
                <Polyline
                  key={`orbit-${cam.id || cam.cameraCode}`}
                  positions={[
                    [validCrimeLoc.lat, validCrimeLoc.lng],
                    [cam.latitude, cam.longitude]
                  ]}
                  pathOptions={{
                    color: '#F37338',
                    weight: 1.2,
                    opacity: 0.45,
                    dashArray: '3, 6'
                  }}
                />
              );
            })}
          </>
        )}

        {/* CCTV Cameras & FOV Cones */}
        {cameras.map((cam) => {
          if (!cam.latitude || !cam.longitude) return null;

          const isSelected = selectedCameraId === cam.id;
          const fovPolygon = getFovPolygonCoordinates(
            cam.latitude,
            cam.longitude,
            cam.directionAngle || 0,
            cam.coverageRadiusMeters || 80,
            cam.fovAngle || 60
          );

          const coneColor = cam.verificationStatus === 'APPROVED' 
            ? (cam.cameraStatus === 'ACTIVE' ? '#10B981' : '#CF4500') 
            : '#F79E1B';

          return (
            <React.Fragment key={cam.id || cam.cameraCode}>
              {/* Field of View (FOV) Sector Cone Polygon */}
              {fovPolygon.length > 0 && (
                <Polygon
                  positions={fovPolygon}
                  pathOptions={{
                    color: coneColor,
                    fillColor: coneColor,
                    fillOpacity: 0.15,
                    weight: 1.5,
                    dashArray: cam.verificationStatus === 'PENDING' ? '4, 4' : null
                  }}
                />
              )}

              {/* Camera Marker with Orientation Arrow */}
              <Marker
                position={[cam.latitude, cam.longitude]}
                icon={createCameraIcon(cam.cameraStatus, cam.verificationStatus, cam.directionAngle || 0, isSelected)}
                eventHandlers={{
                  click: () => onSelectCamera && onSelectCamera(cam)
                }}
              >
                <Popup>
                  <div className="p-3 text-[#141413] min-w-[250px] space-y-2">
                    <div className="flex items-center justify-between border-b border-[#E5DFD9] pb-1.5">
                      <span className="font-bold text-[#141413] font-mono text-xs">{cam.cameraCode}</span>
                      <div className="flex gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          cam.cameraStatus === 'ACTIVE' 
                            ? 'bg-[#EAF7EE] text-[#0A7334] border border-[#BDE7CA]' 
                            : 'bg-[#FDF0EE] text-[#CF4500] border border-[#F8C6BC]'
                        }`}>
                          {cam.cameraStatus === 'ACTIVE' ? '● Online' : '● Offline'}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          cam.verificationStatus === 'APPROVED' 
                            ? 'bg-white text-[#141413] border border-[#D1CDC7]' 
                            : 'bg-[#FEF6E9] text-[#B56708] border border-[#FADBA6]'
                        }`}>
                          {cam.verificationStatus === 'APPROVED' ? '✓ Verified' : '◷ Pending'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-[#141413] leading-snug">{cam.cameraName}</h4>
                      <p className="text-xs text-[#696969] mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#CF4500] shrink-0" />
                        {cam.fullAddress || cam.area || 'Central District'}
                      </p>
                    </div>

                    {/* Camera Specs info */}
                    <div className="grid grid-cols-2 gap-1.5 p-2 rounded-[16px] bg-[#F3F0EE] border border-[#E5DFD9] text-xs">
                      <div>
                        <span className="text-[10px] text-[#696969] block">Orientation</span>
                        <strong className="text-[#141413]">{cam.directionAngle || 0}° ({cam.cardinalDirection || 'EAST'})</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#696969] block">Coverage</span>
                        <strong className="text-[#141413]">{cam.coverageRadiusMeters || 80}m</strong>
                      </div>
                    </div>

                    {/* Owner Info (Restricted for Surveyors) */}
                    {isSurveyor ? (
                      <div className="p-2 rounded-full bg-[#FEF6E9] border border-[#FADBA6] text-xs text-[#B56708] font-medium flex items-center justify-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-[#B56708] shrink-0" />
                        <span className="text-[10px]">Owner info restricted for surveyors</span>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-[16px] bg-white border border-[#E5DFD9] text-xs space-y-0.5">
                        <p className="font-semibold text-[#141413] flex items-center gap-1 text-[11px]">
                          <User className="w-3 h-3 text-[#3860BE]" />
                          Owner: {cam.ownerName || 'Metropolitan Police Dept'}
                        </p>
                        {cam.ownerContact && (
                          <p className="text-[11px] text-[#696969] flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-[#CF4500]" />
                            Contact: <strong>{cam.ownerContact}</strong>
                          </p>
                        )}
                      </div>
                    )}
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
