import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform, Text, TouchableOpacity } from 'react-native';
import { Maximize2, Minimize2, Radio } from 'lucide-react-native';
import { Colors } from '../theme/colors';

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

export const CameraMap = ({
  cameras = [],
  stations = [],
  center = [21.1458, 79.0882],
  zoom = 14,
  crimeLocation = null,
  searchRadius = 500,
  onSelectCamera = () => {},
  onMapClick = null,
  selectedCameraId = null,
  interactivePicker = false,
  height = 360,
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // In Web Browser mode: Dynamically inject Leaflet CSS and initialize map
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      if (!document.getElementById('leaflet-css-bundle')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css-bundle';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Initialize Leaflet Map
      const L = require('leaflet');

      if (!mapContainerRef.current) return;

      // Clean up previous instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const initialCenter = crimeLocation && crimeLocation.lat && crimeLocation.lng
        ? [crimeLocation.lat, crimeLocation.lng]
        : (center && center[0] ? center : [28.6280, 77.2410]);

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: zoom || 14,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      // OpenStreetMap Basemap Tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;
      mapInstanceRef.current = map;

      // Click listener if interactivePicker is enabled
      if (onMapClick) {
        map.on('click', (e) => {
          const lat = Math.round(e.latlng.lat * 100000) / 100000;
          const lng = Math.round(e.latlng.lng * 100000) / 100000;
          onMapClick({ lat, lng });
        });
      }

      setTimeout(() => {
        map.invalidateSize();
      }, 200);

      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }
  }, [isFullscreen]);

  // Update Markers, FOVs, Crime Scenes and Police Stations on Prop changes
  useEffect(() => {
    if (Platform.OS !== 'web' || !mapInstanceRef.current) return;
    const L = require('leaflet');
    const map = mapInstanceRef.current;
    const group = markersGroupRef.current;
    if (!group) return;

    group.clearLayers();

    // Default Police Stations if empty
    const defaultStations = (stations && stations.length > 0) ? stations : [
      { id: 1, stationCode: 'PS-NGP-01', stationName: 'Nagpur Police Commissionerate HQ', latitude: 21.1524, longitude: 79.0801, address: 'Civil Lines, Nagpur', contactNumber: '+91-712-2560300' },
      { id: 2, stationCode: 'PS-NGP-02', stationName: 'Sitabuldi Police Station', latitude: 21.1458, longitude: 79.0882, address: 'Main Road, Sitabuldi, Nagpur', contactNumber: '+91-712-2522000' }
    ];

    // 1. Police Station Pins
    defaultStations.forEach((st) => {
      if (!st.latitude || !st.longitude) return;
      const stationSvg = `
        <div style="cursor:pointer; filter:drop-shadow(0 2px 5px rgba(0,0,0,0.3));">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 44" width="38" height="44">
            <path d="M19 2 L34 8 L34 22 C34 32 19 42 19 42 C19 42 4 32 4 22 L4 8 Z" fill="#141413" stroke="#CF4500" stroke-width="2"/>
            <polygon points="19,10 22,18 30,19 24,24 26,32 19,27 12,32 14,24 8,19 16,18" fill="#F79E1B"/>
            <circle cx="19" cy="21" r="3" fill="#FFFFFF"/>
          </svg>
        </div>
      `;
      const icon = L.divIcon({ html: stationSvg, className: 'police-station-pin', iconSize: [38, 44], iconAnchor: [19, 44] });
      L.marker([st.latitude, st.longitude], { icon })
        .bindPopup(`
          <div style="font-family:Inter,sans-serif; padding:6px; min-width:200px;">
            <div style="font-size:10px; font-weight:700; color:#CF4500; text-transform:uppercase;">POLICE PRECINCT</div>
            <div style="font-size:13px; font-weight:800; color:#141413; margin:2px 0;">${st.stationName}</div>
            <div style="font-size:11px; color:#696969;">${st.address || 'Jurisdiction Precinct'}</div>
            <div style="font-size:11px; font-weight:700; margin-top:4px; color:#141413;">📞 ${st.contactNumber || '+91 11 100'}</div>
          </div>
        `)
        .addTo(group);
    });

    // 2. Crime Incident Focal Point & Radar Radius
    if (crimeLocation && crimeLocation.lat && crimeLocation.lng) {
      const crimeSvg = `
        <div style="cursor:pointer; filter:drop-shadow(0 2px 8px rgba(207,69,0,0.5));">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44" width="44" height="44">
            <circle cx="22" cy="22" r="20" fill="#CF4500" fill-opacity="0.25" stroke="#CF4500" stroke-width="2.5"/>
            <circle cx="22" cy="22" r="12" fill="#141413"/>
            <polygon points="22,7 26,16 35,17 28,24 30,33 22,28 14,33 16,24 9,17 18,16" fill="#F37338"/>
            <circle cx="22" cy="22" r="3.5" fill="#FFFFFF"/>
          </svg>
        </div>
      `;
      const crimeIcon = L.divIcon({ html: crimeSvg, className: 'crime-scene-marker', iconSize: [44, 44], iconAnchor: [22, 22] });
      L.marker([crimeLocation.lat, crimeLocation.lng], { icon: crimeIcon })
        .bindPopup(`
          <div style="font-family:Inter,sans-serif; padding:6px; min-width:200px;">
            <div style="font-size:10px; font-weight:800; color:#CF4500; text-transform:uppercase;">🚨 INCIDENT FOCAL POINT</div>
            <div style="font-size:13px; font-weight:800; color:#141413; margin:2px 0;">${crimeLocation.name || 'Active Case Target'}</div>
            <div style="font-size:11px; color:#696969;">Proximity Range: ${searchRadius || 500}m</div>
          </div>
        `)
        .addTo(group);

      // Dashed Radar Search Circle
      L.circle([crimeLocation.lat, crimeLocation.lng], {
        radius: searchRadius || 500,
        color: '#CF4500',
        fillColor: '#F37338',
        fillOpacity: 0.12,
        weight: 2,
        dashArray: '6, 6',
      }).addTo(group);

      // Dotted trajectory lines from incident to cameras
      cameras.forEach((cam) => {
        if (!cam.latitude || !cam.longitude) return;
        L.polyline([
          [crimeLocation.lat, crimeLocation.lng],
          [cam.latitude, cam.longitude],
        ], {
          color: '#F37338',
          weight: 1.2,
          opacity: 0.45,
          dashArray: '3, 6',
        }).addTo(group);
      });
    }

    // 3. CCTV Cameras & Directional FOV Cones
    cameras.forEach((cam) => {
      if (!cam.latitude || !cam.longitude) return;
      const isSelected = selectedCameraId === cam.id;
      const directionAngle = cam.directionAngle || cam.coverageAngle || 0;
      const fovAngle = cam.fovAngle || 60;
      const radiusMeters = cam.coverageRadiusMeters || 80;

      // Status color
      let color = '#10B981'; // Green (Active)
      if (cam.cameraStatus === 'OFFLINE' || cam.status === 'OFFLINE') color = '#CF4500';
      if (cam.cameraStatus === 'UNDER_MAINTENANCE' || cam.status === 'PENDING' || cam.verificationStatus === 'PENDING') color = '#F79E1B';

      // Conical FOV Sector Wedge
      const fovPoints = getFovPolygonCoordinates(cam.latitude, cam.longitude, directionAngle, radiusMeters, fovAngle);
      if (fovPoints.length > 0) {
        L.polygon(fovPoints, {
          color: color,
          fillColor: color,
          fillOpacity: 0.22,
          weight: 1.5,
        }).addTo(group);
      }

      // Camera Pin Marker with rotating arrow & satellite circle
      const size = isSelected ? 46 : 38;
      const cameraSvg = `
        <div style="cursor:pointer; filter:drop-shadow(0 2px 6px rgba(0,0,0,0.25));">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="${size}" height="${size}">
            ${isSelected ? `<circle cx="20" cy="20" r="19" fill="none" stroke="#141413" stroke-width="2.5" stroke-dasharray="3 2"/>` : ''}
            <g transform="rotate(${directionAngle}, 20, 20)">
              <polygon points="20,2 25,11 15,11" fill="${color}"/>
              <circle cx="20" cy="20" r="14" fill="none" stroke="${color}" stroke-width="1.5" stroke-opacity="0.75"/>
            </g>
            <circle cx="20" cy="20" r="9" fill="#FFFFFF" stroke="#141413" stroke-width="2"/>
            <circle cx="20" cy="20" r="5" fill="${color}"/>
          </svg>
        </div>
      `;
      const camIcon = L.divIcon({ html: cameraSvg, className: 'cctv-node-marker', iconSize: [size, size], iconAnchor: [size / 2, size / 2] });

      const marker = L.marker([cam.latitude, cam.longitude], { icon: camIcon })
        .bindPopup(`
          <div style="font-family:Inter,sans-serif; padding:6px; min-width:210px;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #E5DFD9; padding-bottom:4px; margin-bottom:6px;">
              <span style="font-size:11px; font-weight:800; color:#141413; font-family:monospace;">${cam.cameraCode || `CAM-${cam.id}`}</span>
              <span style="font-size:9px; font-weight:700; background:#EAF7EE; color:#0A7334; padding:2px 6px; border-radius:12px;">${cam.cameraType || 'PTZ'}</span>
            </div>
            <div style="font-size:12px; font-weight:800; color:#141413; margin-bottom:3px;">${cam.landmark || cam.area || cam.address || 'CCTV Surveillance Node'}</div>
            <div style="font-size:11px; color:#696969; margin-bottom:6px;">${cam.street || ''} ${cam.city || ''}</div>
            <div style="display:flex; justify-content:space-between; background:#F3F0EE; padding:4px 8px; border-radius:8px; font-size:10px; font-weight:700; color:#141413;">
              <span>ARC: ${radiusMeters}m</span>
              <span>ANGLE: ${directionAngle}°</span>
              <span>RES: ${cam.resolution || '1080P'}</span>
            </div>
          </div>
        `)
        .addTo(group);

      marker.on('click', () => {
        onSelectCamera(cam);
      });
    });

  }, [cameras, stations, crimeLocation, searchRadius, selectedCameraId]);

  return (
    <View style={[
      styles.mapWrapper, 
      { height: isFullscreen ? '100%' : height },
      isFullscreen && styles.fullscreenWrapper
    ]}>
      {/* Fullscreen Toggle Button */}
      <TouchableOpacity 
        style={styles.expandBtn}
        onPress={() => {
          setIsFullscreen(!isFullscreen);
          if (mapInstanceRef.current) {
            setTimeout(() => mapInstanceRef.current.invalidateSize(), 150);
          }
        }}
        activeOpacity={0.85}
      >
        {isFullscreen ? (
          <>
            <Minimize2 size={14} color={Colors.white} />
            <Text style={styles.expandBtnTextWhite}>Exit Fullscreen</Text>
          </>
        ) : (
          <>
            <Maximize2 size={14} color={Colors.signal} />
            <Text style={styles.expandBtnText}>Expand Map</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Direct DOM Map Container for Web */}
      {Platform.OS === 'web' ? (
        <div 
          ref={mapContainerRef} 
          style={{ width: '100%', height: '100%', minHeight: isFullscreen ? '100vh' : height, borderRadius: isFullscreen ? 0 : 28 }}
        />
      ) : (
        <View style={styles.fallbackCenter}>
          <Radio size={32} color={Colors.signal} />
          <Text style={styles.fallbackText}>Live Map Reconnaissance Active</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mapWrapper: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#F3F0EE',
    borderWidth: 1,
    borderColor: '#E5DFD9',
    position: 'relative',
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  fullscreenWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    borderRadius: 0,
  },
  expandBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5DFD9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  expandBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#141413',
  },
  expandBtnTextWhite: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.white,
  },
  fallbackCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 280,
  },
  fallbackText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.ink,
  },
});
