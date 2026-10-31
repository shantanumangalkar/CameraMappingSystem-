import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useAuth } from '../../context/AuthContext';
import { MapCompass } from './MapCompass';
import { 
  Compass, 
  MapPin, 
  RotateCcw,
  Clock,
  Shield,
  Sun,
  Moon,
  Globe,
  Maximize2,
  Minimize2,
  Camera,
  Navigation,
  Phone,
  User,
  Lock,
  X,
  ExternalLink,
  Radio,
  Eye,
  Crosshair,
  Plus,
  Minus,
  Scan,
  Activity,
  Layers,
  Video,
  Sparkles,
  Sliders,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

/**
 * ============================================================================
 * ACCURATE DIGITAL TWIN SPECIFICATION & C4ISR RECON CONFIGURATION
 * ============================================================================
 * Implements European EN 62676-4 / Indian Police CCTNS DORI Optical Standard:
 * - Identification (ID): Core 35% of optical radius (250+ px/m facial recognition)
 * - Recognition (REC): Mid 70% of optical radius (125+ px/m plate/apparel recognition)
 * - Detection (DET): Outer 100% of optical radius (25+ px/m presence detection)
 * - Volumetric 3D Frustum: Extruded optical cone based on mounting height AGL (8m - 14m)
 */

// Vidarbha Region (Nagpur Hub - Zero Mile / Sitabuldi HQ) Coordinates
const VIDARBHA_CONFIG = {
  center: [79.0882, 21.1458], // [lng, lat] Sitabuldi / Nagpur Police Zone
  defaultZoom: 15.4,
  defaultPitch: 58, // Cinematic perspective tilt for authentic 3D depth
  defaultBearing: -18, // Isometric surveillance angle
  maxPitch: 78,
  minPitch: 0,
  bounds: [
    [75.8, 18.5], // Southwest boundary [lng, lat]
    [81.2, 22.3]  // Northeast boundary [lng, lat]
  ]
};

// Map Style Specifications
const MAP_STYLES = {
  satellite: {
    id: 'satellite',
    label: '3D Satellite',
    icon: Globe,
    styleUrl: 'https://tiles.openfreemap.org/styles/liberty',
    isSatellite: true,
  },
  urban: {
    id: 'urban',
    label: '3D Daylight',
    icon: Sun,
    styleUrl: 'https://tiles.openfreemap.org/styles/liberty',
    isSatellite: false,
  },
  night: {
    id: 'night',
    label: 'Tactical Night',
    icon: Moon,
    styleUrl: 'https://tiles.openfreemap.org/styles/liberty',
    isSatellite: false,
  }
};

// Helper: Calculate polygon coordinates for Field-of-View (FOV) wedge in GeoJSON [lng, lat] format
// Supports scaling for DORI forensic optical bands (e.g. 0.35 for ID, 0.70 for REC, 1.0 for DET)
const getFovGeoJsonCoordinates = (lat, lon, directionAngle = 0, radiusMeters = 80, fovAngleDegrees = 60, scaleRatio = 1.0) => {
  const numLat = parseFloat(lat);
  const numLon = parseFloat(lon);
  const numRadius = (parseFloat(radiusMeters) || 80) * scaleRatio;
  const numDir = parseFloat(directionAngle) || 0;
  const numFov = parseFloat(fovAngleDegrees) || 60;

  if (isNaN(numLat) || isNaN(numLon) || numFov <= 0) return null;

  const metersPerLatDegree = 111320;
  const metersPerLonDegree = 111320 * Math.cos((numLat * Math.PI) / 180);

  // Full 360-degree fisheye / omnidirectional view
  if (numFov >= 360) {
    const coords = [];
    for (let deg = 0; deg <= 360; deg += 15) {
      const rad = (deg * Math.PI) / 180;
      const ptLat = numLat + (numRadius * Math.sin(rad)) / metersPerLatDegree;
      const ptLon = numLon + (numRadius * Math.cos(rad)) / metersPerLonDegree;
      coords.push([ptLon, ptLat]);
    }
    return [coords];
  }

  const startAngle = numDir - numFov / 2;
  const endAngle = numDir + numFov / 2;
  const step = Math.max(0.5, (endAngle - startAngle) / 12);

  const coords = [[numLon, numLat]];
  for (let a = startAngle; a <= endAngle + 0.001; a += step) {
    const rad = ((90 - a) * Math.PI) / 180;
    const ptLat = numLat + (numRadius * Math.sin(rad)) / metersPerLatDegree;
    const ptLon = numLon + (numRadius * Math.cos(rad)) / metersPerLonDegree;
    coords.push([ptLon, ptLat]);
  }
  coords.push([numLon, numLat]);
  return [coords];
};

// Helper: Optical Centerline Boresight Laser Line
const getBoresightCenterline = (lat, lon, directionAngle = 0, radiusMeters = 80) => {
  const numLat = parseFloat(lat);
  const numLon = parseFloat(lon);
  const numRadius = parseFloat(radiusMeters) || 80;
  const numDir = parseFloat(directionAngle) || 0;

  if (isNaN(numLat) || isNaN(numLon)) return null;

  const metersPerLatDegree = 111320;
  const metersPerLonDegree = 111320 * Math.cos((numLat * Math.PI) / 180);

  const rad = ((90 - numDir) * Math.PI) / 180;
  const tipLat = numLat + (numRadius * Math.sin(rad)) / metersPerLatDegree;
  const tipLon = numLon + (numRadius * Math.cos(rad)) / metersPerLonDegree;

  return [
    [numLon, numLat],
    [tipLon, tipLat]
  ];
};

// Helper: Generate circle coordinates for Crime Scene radius in GeoJSON [lng, lat]
const getCircleGeoJsonCoordinates = (lat, lon, radiusMeters = 500) => {
  const numLat = parseFloat(lat);
  const numLon = parseFloat(lon);
  const numRadius = parseFloat(radiusMeters) || 500;
  if (isNaN(numLat) || isNaN(numLon)) return null;

  const metersPerLatDegree = 111320;
  const metersPerLonDegree = 111320 * Math.cos((numLat * Math.PI) / 180);
  const coords = [];
  for (let deg = 0; deg <= 360; deg += 6) {
    const rad = (deg * Math.PI) / 180;
    const ptLat = numLat + (numRadius * Math.sin(rad)) / metersPerLatDegree;
    const ptLon = numLon + (numRadius * Math.cos(rad)) / metersPerLonDegree;
    coords.push([ptLon, ptLat]);
  }
  return [coords];
};

export const ThreeDMap = ({
  cameras = [],
  stations = [],
  center,
  zoom = 15.4,
  crimeLocation = null,
  searchRadius = 500,
  onSelectCamera,
  onMapClick,
  selectedLocation = null,
  liveLocation = null,
  onGetLiveLocation,
  isLocating = false,
  selectedCameraId = null,
  interactivePicker = false,
  autoFit = true,
  allowFullscreen = true,
  isFullscreen = false,
  onToggleFullscreen,
  focusKey = null,
  viewMode = '3d',
  onViewModeChange
}) => {
  const { user } = useAuth();
  const userRole = typeof user?.role === 'object' ? user?.role?.name : user?.role;
  const isSurveyor = userRole === 'ROLE_SURVEY_PERSON';

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const activePopupRef = useRef(null);

  // Style Mode: 'satellite' | 'urban' | 'night'
  const [styleMode, setStyleMode] = useState('satellite');
  const [currentPitch, setCurrentPitch] = useState(VIDARBHA_CONFIG.defaultPitch);
  const [currentBearing, setCurrentBearing] = useState(VIDARBHA_CONFIG.defaultBearing);
  const [realtimeClock, setRealtimeClock] = useState('');
  const [internalLiveLoc, setInternalLiveLoc] = useState(null);
  const [internalIsLocating, setInternalIsLocating] = useState(false);

  // Digital Twin Advanced Features:
  const [show3dBeams, setShow3dBeams] = useState(true); // Volumetric extruded light frustums
  const [doriMode, setDoriMode] = useState(false); // DORI (Detection/Recognition/Identification) forensic bands
  const [povCamera, setPovCamera] = useState(null); // Virtual Lens Street-Level POV Sightline

  const effectiveLiveLoc = liveLocation || internalLiveLoc;
  const effectiveIsLocating = isLocating || internalIsLocating;

  // Validate coordinates
  const isValidLat = (val) => typeof val === 'number' && !isNaN(val) && val >= -90 && val <= 90;
  const isValidLng = (val) => typeof val === 'number' && !isNaN(val) && val >= -180 && val <= 180;

  // Real-time ticking clock (IST)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-IN', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
      setRealtimeClock(`${timeStr} IST`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Determine center coordinates - Defaults to Nagpur region [79.0882, 21.1458]
  const getInitialCenter = useCallback(() => {
    if (crimeLocation && isValidLat(crimeLocation.lat) && isValidLng(crimeLocation.lng)) {
      return [parseFloat(crimeLocation.lng), parseFloat(crimeLocation.lat)];
    }
    if (center && isValidLat(center[0]) && isValidLng(center[1])) {
      return [parseFloat(center[1]), parseFloat(center[0])];
    }
    return VIDARBHA_CONFIG.center; // [79.0882, 21.1458] (Sitabuldi / Nagpur Central HQ)
  }, [crimeLocation, center]);

  // Update GeoJSON Layers (FOV Cones, DORI Bands, Boresight Lasers, Crime Radius, Trajectories)
  const updateMapLayers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    // 1. Build Multi-Tiered FOV Cones GeoJSON
    const fovFeatures = [];
    const laserFeatures = [];

    cameras.forEach((cam) => {
      if (!cam.latitude || !cam.longitude) return;

      const fixedDirection = parseFloat(cam.directionAngle) || 0;
      const radius = parseFloat(cam.coverageRadiusMeters) || 80;
      const fov = parseFloat(cam.fovAngle) || 60;
      const isSelected = selectedCameraId === cam.id;

      // Base status color
      const baseColor = cam.verificationStatus === 'APPROVED' 
        ? (cam.cameraStatus === 'ACTIVE' ? '#10B981' : '#CF4500') 
        : '#F79E1B';

      // 1A. Full Detection Zone (Outer Cone)
      const outerCoords = getFovGeoJsonCoordinates(cam.latitude, cam.longitude, fixedDirection, radius, fov, 1.0);
      if (outerCoords) {
        fovFeatures.push({
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: outerCoords },
          properties: { 
            id: cam.id || cam.cameraCode, 
            zone: 'detection',
            color: doriMode ? '#F59E0B' : baseColor,
            status: cam.cameraStatus,
            verificationStatus: cam.verificationStatus,
            mountingHeight: isSelected ? 15 : 11, // meters AGL for 3D extrusion
            opacity3d: isSelected ? 0.28 : (show3dBeams ? 0.16 : 0.0),
            opacityFill: isSelected ? 0.24 : 0.14
          }
        });
      }

      // 1B. If DORI Mode Active: Add Recognition (0.7x) & Identification (0.35x) Sub-Cones
      if (doriMode) {
        const recCoords = getFovGeoJsonCoordinates(cam.latitude, cam.longitude, fixedDirection, radius, fov, 0.70);
        if (recCoords) {
          fovFeatures.push({
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: recCoords },
            properties: { 
              id: `${cam.id}-rec`,
              zone: 'recognition',
              color: '#06B6D4',
              mountingHeight: 8,
              opacity3d: 0.22,
              opacityFill: 0.20
            }
          });
        }

        const idCoords = getFovGeoJsonCoordinates(cam.latitude, cam.longitude, fixedDirection, radius, fov, 0.35);
        if (idCoords) {
          fovFeatures.push({
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: idCoords },
            properties: { 
              id: `${cam.id}-id`,
              zone: 'identification',
              color: '#10B981',
              mountingHeight: 5,
              opacity3d: 0.32,
              opacityFill: 0.30
            }
          });
        }
      }

      // 1C. Boresight Optical Centerline Laser
      const laserCoords = getBoresightCenterline(cam.latitude, cam.longitude, fixedDirection, radius);
      if (laserCoords) {
        laserFeatures.push({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: laserCoords },
          properties: {
            color: isSelected ? '#FFFFFF' : baseColor,
            isSelected
          }
        });
      }
    });

    const fovSource = map.getSource('camera-fovs');
    if (fovSource) {
      fovSource.setData({ type: 'FeatureCollection', features: fovFeatures });
    }

    const laserSource = map.getSource('camera-lasers');
    if (laserSource) {
      laserSource.setData({ type: 'FeatureCollection', features: laserFeatures });
    }

    // 2. Build Crime Scene Investigation Radius & Radar Trajectory Lines
    const crimeFeatures = [];
    const validCrime = crimeLocation && isValidLat(crimeLocation.lat) && isValidLng(crimeLocation.lng);
    if (validCrime) {
      const circleCoords = getCircleGeoJsonCoordinates(crimeLocation.lat, crimeLocation.lng, searchRadius || 500);
      if (circleCoords) {
        crimeFeatures.push({
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: circleCoords },
          properties: { type: 'crime-radius' }
        });
      }

      // Trajectory lines connecting crime scene to all CCTV nodes
      cameras.forEach((cam) => {
        if (!cam.latitude || !cam.longitude) return;
        crimeFeatures.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [parseFloat(crimeLocation.lng), parseFloat(crimeLocation.lat)],
              [parseFloat(cam.longitude), parseFloat(cam.latitude)]
            ]
          },
          properties: { type: 'radar-line' }
        });
      });
    }

    const crimeSource = map.getSource('crime-scene-data');
    if (crimeSource) {
      crimeSource.setData({ type: 'FeatureCollection', features: crimeFeatures });
    }
  }, [cameras, crimeLocation, searchRadius, selectedCameraId, doriMode, show3dBeams]);

  // Apply Atmospheric Sky & Fog Depth Cueing
  const applyAtmosphere = useCallback((map, currentStyle) => {
    if (!map) return;
    try {
      if (typeof map.setFog === 'function') {
        if (currentStyle === 'night') {
          map.setFog({
            range: [-0.5, 12],
            color: '#0B0F19',
            'horizon-blend': 0.15,
            'high-color': '#020617',
            'space-color': '#020617'
          });
        } else if (currentStyle === 'satellite') {
          map.setFog({
            range: [-1, 14],
            color: '#CBD5E1',
            'horizon-blend': 0.1,
            'high-color': '#60A5FA',
            'space-color': '#3B82F6'
          });
        } else {
          // Urban Daylight
          map.setFog({
            range: [-1, 15],
            color: '#F1F5F9',
            'horizon-blend': 0.12,
            'high-color': '#93C5FD',
            'space-color': '#60A5FA'
          });
        }
      }

      if (typeof map.setLight === 'function') {
        if (currentStyle === 'night') {
          map.setLight({
            anchor: 'viewport',
            color: '#60A5FA',
            intensity: 0.4,
            position: [1.5, 210, 35]
          });
        } else {
          map.setLight({
            anchor: 'viewport',
            color: '#FFFBEB',
            intensity: 0.72,
            position: [1.2, 175, 55]
          });
        }
      }
    } catch (e) {
      // Graceful fallback if driver does not support advanced fog
    }
  }, []);

  // 1. Initialize MapLibre GL Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialCenter = getInitialCenter();

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLES[styleMode].styleUrl,
      center: initialCenter,
      zoom: zoom || VIDARBHA_CONFIG.defaultZoom,
      pitch: VIDARBHA_CONFIG.defaultPitch,
      bearing: VIDARBHA_CONFIG.defaultBearing,
      maxPitch: VIDARBHA_CONFIG.maxPitch,
      minPitch: VIDARBHA_CONFIG.minPitch,
      attributionControl: false
    });

    map.on('pitch', () => setCurrentPitch(Math.round(map.getPitch())));
    map.on('rotate', () => setCurrentBearing(Math.round(map.getBearing())));
    map.on('error', (e) => console.warn('[MapLibre GL Notice]', e?.error?.message || e));

    setTimeout(() => { try { map.resize(); } catch(e){} }, 80);
    setTimeout(() => { try { map.resize(); } catch(e){} }, 300);
    setTimeout(() => { try { map.resize(); } catch(e){} }, 700);

    map.on('load', () => {
      try {
        map.resize();

        // 1A. High-Resolution Aerial Satellite Layer
        if (!map.getSource('esri-satellite')) {
          map.addSource('esri-satellite', {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            maxzoom: 19
          });

          const layers = map.getStyle().layers;
          let firstSymbolLayerId;
          for (let i = 0; i < layers.length; i++) {
            if (layers[i].type === 'symbol') {
              firstSymbolLayerId = layers[i].id;
              break;
            }
          }

          map.addLayer(
            {
              id: 'esri-satellite-layer',
              type: 'raster',
              source: 'esri-satellite',
              layout: {
                visibility: styleMode === 'satellite' ? 'visible' : 'none'
              },
              paint: {
                'raster-opacity': 0.94,
                'raster-contrast': 0.1,
                'raster-saturation': 0.15
              }
            },
            firstSymbolLayerId
          );
        }

        // 1B. Crime Scene Radar & Connective Trajectories
        if (!map.getSource('crime-scene-data')) {
          map.addSource('crime-scene-data', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
          });

          map.addLayer({
            id: 'crime-radius-fill',
            type: 'fill',
            source: 'crime-scene-data',
            filter: ['==', '$type', 'Polygon'],
            paint: {
              'fill-color': '#F37338',
              'fill-opacity': 0.12
            }
          });

          map.addLayer({
            id: 'crime-radius-line',
            type: 'line',
            source: 'crime-scene-data',
            filter: ['==', '$type', 'Polygon'],
            paint: {
              'line-color': '#CF4500',
              'line-width': 2.4,
              'line-dasharray': [3, 2]
            }
          });

          map.addLayer({
            id: 'crime-radar-lines',
            type: 'line',
            source: 'crime-scene-data',
            filter: ['==', '$type', 'LineString'],
            paint: {
              'line-color': '#F37338',
              'line-width': 1.6,
              'line-dasharray': [2, 3],
              'line-opacity': 0.65
            }
          });
        }

        // 1C. CCTV Surveillance FOV Cones Source
        if (!map.getSource('camera-fovs')) {
          map.addSource('camera-fovs', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
          });

          // Layer 1: Volumetric 3D Light Extrusion Frustum
          map.addLayer({
            id: 'camera-fovs-3d',
            type: 'fill-extrusion',
            source: 'camera-fovs',
            paint: {
              'fill-extrusion-color': ['get', 'color'],
              'fill-extrusion-height': ['coalesce', ['get', 'mountingHeight'], 12],
              'fill-extrusion-base': 0,
              'fill-extrusion-opacity': ['coalesce', ['get', 'opacity3d'], 0.16],
              'fill-extrusion-vertical-gradient': true
            }
          });

          // Layer 2: Ground Projected Optical Footprint
          map.addLayer({
            id: 'camera-fovs-fill',
            type: 'fill',
            source: 'camera-fovs',
            paint: {
              'fill-color': ['get', 'color'],
              'fill-opacity': ['coalesce', ['get', 'opacityFill'], 0.18]
            }
          });

          // Layer 3: Crisp Optical Outline
          map.addLayer({
            id: 'camera-fovs-outline',
            type: 'line',
            source: 'camera-fovs',
            paint: {
              'line-color': ['get', 'color'],
              'line-width': 2.0,
              'line-opacity': 0.85
            }
          });
        }

        // 1D. Boresight Centerline Lasers Source & Layer
        if (!map.getSource('camera-lasers')) {
          map.addSource('camera-lasers', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
          });

          map.addLayer({
            id: 'camera-lasers-line',
            type: 'line',
            source: 'camera-lasers',
            paint: {
              'line-color': ['get', 'color'],
              'line-width': 1.8,
              'line-dasharray': [2, 2],
              'line-opacity': 0.9
            }
          });
        }

        // 1E. Procedural 3D Building Extrusions with Vertical Shading
        const styleSources = map.getStyle().sources || {};
        const vectorSourceId = Object.keys(styleSources).find(k => styleSources[k].type === 'vector') || 'openmaptiles';
        const layers = map.getStyle().layers;
        let labelLayerId;
        for (let i = 0; i < layers.length; i++) {
          if (layers[i].type === 'symbol' && layers[i].layout && layers[i].layout['text-field']) {
            labelLayerId = layers[i].id;
            break;
          }
        }

        if (map.getSource(vectorSourceId) && !map.getLayer('3d-buildings')) {
          map.addLayer(
            {
              id: '3d-buildings',
              source: vectorSourceId,
              'source-layer': 'building',
              type: 'fill-extrusion',
              minzoom: 12.5,
              paint: {
                'fill-extrusion-color': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  13, styleMode === 'night' ? '#0F172A' : (styleMode === 'satellite' ? '#E2E8F0' : '#CBD5E1'),
                  16, styleMode === 'night' ? '#1E293B' : (styleMode === 'satellite' ? '#94A3B8' : '#94A3B8')
                ],
                'fill-extrusion-height': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  12.5, 0,
                  14.2, [
                    'coalesce',
                    ['get', 'render_height'],
                    ['get', 'height'],
                    ['*', ['to-number', ['get', 'building:levels'], 3], 3.5],
                    ['*', ['to-number', ['get', 'levels'], 3], 3.5],
                    16
                  ]
                ],
                'fill-extrusion-base': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  12.5, 0,
                  14.2, [
                    'coalesce',
                    ['get', 'render_min_height'],
                    ['get', 'min_height'],
                    0
                  ]
                ],
                'fill-extrusion-opacity': styleMode === 'satellite' ? 0.76 : 0.88,
                'fill-extrusion-vertical-gradient': true
              }
            },
            labelLayerId
          );
        }

        // Apply atmospheric fog and sun lighting
        applyAtmosphere(map, styleMode);

        // Populate initial GeoJSON features
        updateMapLayers();
      } catch (err) {
        console.warn('MapLibre 3D Realistic setup note:', err);
      }
    });

    map.on('styledata', () => {
      updateMapLayers();
      applyAtmosphere(map, styleMode);
    });

    mapRef.current = map;

    const handleRotate = () => {
      if (mapRef.current) setCurrentBearing(Math.round(mapRef.current.getBearing()));
    };
    const handlePitch = () => {
      if (mapRef.current) setCurrentPitch(Math.round(mapRef.current.getPitch()));
    };

    map.on('rotate', handleRotate);
    map.on('pitch', handlePitch);

    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) mapRef.current.resize();
    });
    if (mapContainerRef.current) resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.off('rotate', handleRotate);
      map.off('pitch', handlePitch);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Dynamic Style Switching (Satellite, Urban, Night)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    try {
      const satLayer = map.getLayer('esri-satellite-layer');
      if (satLayer) {
        map.setLayoutProperty(
          'esri-satellite-layer',
          'visibility',
          styleMode === 'satellite' ? 'visible' : 'none'
        );
      }

      const bldgLayer = map.getLayer('3d-buildings');
      if (bldgLayer) {
        map.setPaintProperty('3d-buildings', 'fill-extrusion-color', [
          'interpolate',
          ['linear'],
          ['zoom'],
          13, styleMode === 'night' ? '#0F172A' : (styleMode === 'satellite' ? '#E2E8F0' : '#CBD5E1'),
          16, styleMode === 'night' ? '#1E293B' : (styleMode === 'satellite' ? '#94A3B8' : '#94A3B8')
        ]);
        map.setPaintProperty('3d-buildings', 'fill-extrusion-opacity', styleMode === 'satellite' ? 0.76 : 0.88);
      }

      applyAtmosphere(map, styleMode);
      updateMapLayers();
    } catch (e) {
      console.warn('Style switch dynamic update note:', e);
    }
  }, [styleMode, updateMapLayers, applyAtmosphere]);

  // 3. Interactive Map Click (Registration Picker & Blank Space Dismissal)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleMapClick = (e) => {
      if (interactivePicker && onMapClick) {
        const lat = Math.round(e.lngLat.lat * 100000) / 100000;
        const lng = Math.round(e.lngLat.lng * 100000) / 100000;
        onMapClick(lat, lng, { lat, lng, latitude: lat, longitude: lng });
      } else {
        if (activePopupRef.current) {
          activePopupRef.current.remove();
          activePopupRef.current = null;
        }
      }
    };

    map.on('click', handleMapClick);
    return () => map.off('click', handleMapClick);
  }, [interactivePicker, onMapClick]);

  // 4. Update Layers when props or tactical modes change
  useEffect(() => {
    updateMapLayers();
  }, [cameras, crimeLocation, searchRadius, selectedCameraId, doriMode, show3dBeams, updateMapLayers]);

  // 5. Render High-Fidelity 3D CCTV Markers & Infrastructure Pins
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Helper: Create 3D Tactical Camera Node Element
    const createCameraEl = (cam) => {
      const isSelected = selectedCameraId === cam.id;
      let color = '#10B981'; // Green for Active
      if (cam.cameraStatus === 'OFFLINE' || cam.verificationStatus === 'REJECTED') color = '#CF4500';
      if (cam.cameraStatus === 'UNDER_MAINTENANCE' || cam.verificationStatus === 'PENDING') color = '#F79E1B';

      const dirAngle = cam.directionAngle || 0;
      const size = isSelected ? 48 : 40;
      const camType = (cam.cameraType || 'DOME').substring(0, 4);

      const el = document.createElement('div');
      el.className = 'custom-camera-marker cursor-pointer transition-transform duration-200 hover:scale-120 select-none';
      el.style.width = `${size}px`;
      el.style.height = `${size + 14}px`;
      el.style.display = 'flex';
      el.style.flexDirection = 'column';
      el.style.alignItems = 'center';
      el.style.pointerEvents = 'auto';

      el.innerHTML = `
        <div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.45));">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="${size}" height="${size}">
            ${isSelected ? `<circle cx="20" cy="20" r="19" fill="none" stroke="#F37338" stroke-width="2.5" stroke-dasharray="3 2"/>` : ''}
            <!-- Direction Indicator Arrow -->
            <g transform="rotate(${dirAngle}, 20, 20)">
              <polygon points="20,1 26,11 14,11" fill="${color}"/>
              <circle cx="20" cy="20" r="14" fill="none" stroke="${color}" stroke-width="1.8" stroke-opacity="0.8"/>
            </g>
            <!-- Center Camera Hub: Metallic outer bezel, color status core -->
            <circle cx="20" cy="20" r="10" fill="#141413" stroke="#FFFFFF" stroke-width="2"/>
            <circle cx="20" cy="20" r="5" fill="${color}"/>
            ${cam.verificationStatus === 'PENDING' ? '<circle cx="28" cy="12" r="3.5" fill="#F79E1B" stroke="#FFFFFF" stroke-width="1"/>' : ''}
          </svg>
        </div>
        <!-- Miniature Tactical Sensor Badge -->
        <span style="font-size:9px;font-family:monospace;font-weight:800;background:#141413;color:#FFFFFF;padding:1px 5px;border-radius:9999px;border:1px solid rgba(255,255,255,0.25);margin-top:-6px;box-shadow:0 2px 4px rgba(0,0,0,0.5);">
          ${camType}
        </span>
      `;

      return el;
    };

    // 5A. Mount CCTV Camera Markers
    cameras.forEach((cam) => {
      if (!cam.latitude || !cam.longitude) return;

      const el = createCameraEl(cam);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([parseFloat(cam.longitude), parseFloat(cam.latitude)])
        .addTo(map);

      // Click: Select camera and trigger dossier modal
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        map.flyTo({
          center: [parseFloat(cam.longitude), parseFloat(cam.latitude)],
          zoom: 16.5,
          pitch: 58,
          bearing: parseFloat(cam.directionAngle) || 0,
          duration: 900,
          essential: true
        });
        if (onSelectCamera) onSelectCamera(cam);
      });

      markersRef.current.push(marker);
    });

    // 5B. Mount Police Station Headquarters Markers
    const defaultStations = stations.length > 0 ? stations : [
      { id: 105, stationCode: 'PS-NGP-01', stationName: 'Nagpur Police Commissionerate HQ', latitude: 21.1524, longitude: 79.0801, address: 'Civil Lines, Nagpur', contactNumber: '+91-712-2560300', jurisdictionZone: 'Nagpur City HQ' },
      { id: 106, stationCode: 'PS-NGP-02', stationName: 'Sitabuldi Police Station', latitude: 21.1458, longitude: 79.0882, address: 'Main Road, Sitabuldi, Nagpur', contactNumber: '+91-712-2522000', jurisdictionZone: 'Central Nagpur' },
      { id: 107, stationCode: 'PS-AMR-01', stationName: 'Amravati City Police Commissionerate', latitude: 20.9320, longitude: 77.7523, address: 'Camp, Amravati', contactNumber: '+91-721-2551000', jurisdictionZone: 'Amravati Precinct' }
    ];

    defaultStations.forEach((st) => {
      if (!st.latitude || !st.longitude) return;

      const el = document.createElement('div');
      el.className = 'police-station-marker-pin cursor-pointer transition-transform duration-150 hover:scale-115';
      el.style.pointerEvents = 'auto';
      el.innerHTML = `
        <img 
          src="/police-station-marker.png" 
          alt="${st.stationName}" 
          style="width:38px;height:44px;object-fit:contain;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.35));" 
        />
      `;

      const popup = new maplibregl.Popup({ offset: [0, -22], maxWidth: '320px', closeButton: true, closeOnClick: false })
        .setLngLat([parseFloat(st.longitude), parseFloat(st.latitude)])
        .setHTML(`
          <div style="font-family:inherit;min-width:240px;padding:4px;color:#141413;">
            <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #E5DFD9;padding-bottom:6px;margin-bottom:8px;">
              <span style="font-family:monospace;font-weight:700;font-size:12px;color:#141413;">🏢 ${st.stationCode}</span>
              <span style="background:#EAF7EE;color:#0A7334;border:1px solid #BDE7CA;padding:2px 8px;border-radius:9999px;font-weight:700;font-size:10px;">CCTNS VERIFIED</span>
            </div>
            <div style="font-weight:700;font-size:14px;line-height:1.2;">${st.stationName}</div>
            <div style="color:#696969;font-size:11px;margin-top:2px;">📍 ${st.address || st.jurisdictionZone || 'Nagpur Command HQ'}</div>
            <div style="background:#F3F0EE;border:1px solid #E5DFD9;padding:8px;border-radius:12px;margin-top:8px;font-size:11px;">
              <div style="color:#696969;">Jurisdiction: <strong style="color:#141413;">${st.jurisdictionZone || 'Nagpur Central'}</strong></div>
              <div style="margin-top:4px;padding-top:4px;border-top:1px solid #E5DFD9;font-family:monospace;">
                📞 Helpline: <strong style="color:#CF4500;">${st.contactNumber || '+91 712 2560300'}</strong>
              </div>
            </div>
          </div>
        `);

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([parseFloat(st.longitude), parseFloat(st.latitude)])
        .addTo(map);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (activePopupRef.current) {
          activePopupRef.current.remove();
          activePopupRef.current = null;
        }
        popup.addTo(map);
        activePopupRef.current = popup;
      });

      markersRef.current.push(marker);
    });

    // 5C. Mount Crime Scene Pin
    if (crimeLocation && isValidLat(crimeLocation.lat) && isValidLng(crimeLocation.lng)) {
      const el = document.createElement('div');
      el.className = 'crime-scene-target-node cursor-pointer';
      el.style.pointerEvents = 'auto';
      el.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44" width="46" height="46">
          <circle cx="22" cy="22" r="20" fill="#CF4500" fill-opacity="0.2" stroke="#CF4500" stroke-width="2.5"/>
          <circle cx="22" cy="22" r="12" fill="#141413"/>
          <polygon points="22,7 26,16 35,17 28,24 30,33 22,28 14,33 16,24 9,17 18,16" fill="#F37338"/>
          <circle cx="22" cy="22" r="3" fill="#FFFFFF"/>
        </svg>
      `;

      const popup = new maplibregl.Popup({ offset: 18, maxWidth: '280px', closeButton: true, closeOnClick: false })
        .setLngLat([parseFloat(crimeLocation.lng), parseFloat(crimeLocation.lat)])
        .setHTML(`
          <div style="font-family:inherit;min-width:210px;padding:4px;color:#141413;">
            <div style="color:#CF4500;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;display:flex;align-items:center;gap:4px;">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#CF4500;"></span>
              Crime Scene Incident Target
            </div>
            <div style="font-weight:700;font-size:13px;margin-top:4px;">${crimeLocation.name || 'Incident Focal Point'}</div>
            <div style="font-size:11px;color:#696969;font-family:monospace;margin-top:2px;">Coords: ${crimeLocation.lat}, ${crimeLocation.lng}</div>
            <div style="background:#FDF0EE;border:1px solid #F8C6BC;color:#CF4500;padding:6px;border-radius:9999px;font-size:11px;font-weight:700;text-align:center;margin-top:6px;">
              Investigation Radius: ${searchRadius}m
            </div>
          </div>
        `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([parseFloat(crimeLocation.lng), parseFloat(crimeLocation.lat)])
        .addTo(map);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (activePopupRef.current) {
          activePopupRef.current.remove();
          activePopupRef.current = null;
        }
        popup.addTo(map);
        activePopupRef.current = popup;
      });

      markersRef.current.push(marker);
    }

    // 5D. Mount Selected Location Pin (Registration Picker or Live GPS)
    const activeLoc = (interactivePicker && selectedLocation) || effectiveLiveLoc;
    if (activeLoc && isValidLat(activeLoc.lat) && isValidLng(activeLoc.lng)) {
      const isLive = Boolean(effectiveLiveLoc && !interactivePicker);
      const el = document.createElement('div');
      el.className = 'selected-patrol-marker cursor-pointer';
      el.style.pointerEvents = 'auto';

      if (interactivePicker) {
        el.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 46 46" width="46" height="46">
            <circle cx="23" cy="23" r="18" fill="#CF4500" fill-opacity="0.3"/>
            <circle cx="23" cy="23" r="10" fill="#141413" stroke="#FFFFFF" stroke-width="2.5"/>
            <circle cx="23" cy="23" r="4.5" fill="#CF4500"/>
            <line x1="23" y1="3" x2="23" y2="10" stroke="#CF4500" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="23" y1="36" x2="23" y2="43" stroke="#CF4500" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="3" y1="23" x2="10" y2="23" stroke="#CF4500" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="36" y1="23" x2="43" y2="23" stroke="#CF4500" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        `;
      } else {
        el.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 42 42" width="42" height="42">
            <circle cx="21" cy="21" r="18" fill="#10B981" fill-opacity="0.25" stroke="#10B981" stroke-width="1.5" stroke-dasharray="3 2"/>
            <circle cx="21" cy="21" r="10" fill="#141413" stroke="#FFFFFF" stroke-width="2"/>
            <circle cx="21" cy="21" r="4" fill="#10B981"/>
          </svg>
        `;
      }

      const popup = new maplibregl.Popup({ offset: 18, maxWidth: '240px', closeButton: true, closeOnClick: false })
        .setLngLat([parseFloat(activeLoc.lng), parseFloat(activeLoc.lat)])
        .setHTML(`
          <div style="font-family:inherit;min-width:180px;padding:4px;color:#141413;">
            <div style="font-family:monospace;font-size:11px;font-weight:700;border-bottom:1px solid #E5DFD9;padding-bottom:4px;display:flex;align-items:center;gap:6px;">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${interactivePicker ? '#CF4500' : '#10B981'};"></span>
              <span>${interactivePicker ? 'SELECTED REGISTRATION POINT' : 'LIVE PATROL GPS FIX'}</span>
            </div>
            <div style="font-family:monospace;color:#696969;font-size:11px;margin-top:6px;">
              Lat: <strong style="color:#141413;">${Number(activeLoc.lat).toFixed(5)}</strong><br/>
              Lng: <strong style="color:#141413;">${Number(activeLoc.lng).toFixed(5)}</strong>
            </div>
            ${isLive ? '<div style="color:#10B981;font-size:10px;font-weight:600;margin-top:4px;">● Real-time Live Position Active</div>' : ''}
            ${interactivePicker ? '<div style="color:#CF4500;font-size:10px;font-weight:600;margin-top:4px;">✓ Location locked (Click anywhere to relocate)</div>' : ''}
          </div>
        `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([parseFloat(activeLoc.lng), parseFloat(activeLoc.lat)])
        .addTo(map);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (activePopupRef.current) {
          activePopupRef.current.remove();
          activePopupRef.current = null;
        }
        popup.addTo(map);
        activePopupRef.current = popup;
      });

      markersRef.current.push(marker);
    }
  }, [cameras, stations, crimeLocation, searchRadius, selectedLocation, effectiveLiveLoc, selectedCameraId, interactivePicker, isSurveyor, onSelectCamera]);

  // 6. Smooth Focus when selectedCameraId changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedCameraId || cameras.length === 0) return;

    const found = cameras.find(c => c.id === selectedCameraId);
    if (found && found.latitude && found.longitude) {
      map.flyTo({
        center: [parseFloat(found.longitude), parseFloat(found.latitude)],
        zoom: 16.5,
        pitch: 58,
        bearing: parseFloat(found.directionAngle) || 0,
        duration: 900,
        essential: true
      });
    }
  }, [selectedCameraId, cameras]);

  // Auto-focus on crimeLocation
  const lastCrimeLocRef = useRef({ lat: null, lng: null, focusKey: null });
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !crimeLocation?.lat || !crimeLocation?.lng) return;
    const targetLat = parseFloat(crimeLocation.lat);
    const targetLng = parseFloat(crimeLocation.lng);
    if (isNaN(targetLat) || isNaN(targetLng)) return;

    const isNewCoords = lastCrimeLocRef.current.lat !== targetLat || lastCrimeLocRef.current.lng !== targetLng;
    const isKeyTrigger = focusKey !== undefined && focusKey !== null && lastCrimeLocRef.current.focusKey !== focusKey;

    if (isKeyTrigger || isNewCoords) {
      lastCrimeLocRef.current = { lat: targetLat, lng: targetLng, focusKey };
      map.flyTo({
        center: [targetLng, targetLat],
        zoom: 16.2,
        pitch: 58,
        duration: 1000,
        essential: true
      });
    }
  }, [crimeLocation?.lat, crimeLocation?.lng, focusKey]);

  // Live Location Trigger
  const handleTriggerLiveLocation = () => {
    if (onGetLiveLocation) {
      onGetLiveLocation();
      return;
    }
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setInternalIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Math.round(pos.coords.latitude * 100000) / 100000;
        const lng = Math.round(pos.coords.longitude * 100000) / 100000;
        setInternalLiveLoc({ lat, lng });
        setInternalIsLocating(false);
      },
      (err) => {
        console.warn('Live location error:', err);
        setInternalIsLocating(false);
        alert('Unable to retrieve your live GPS location. Please check browser location permissions.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Virtual Lens POV Mode Actions
  const handleEnterPOV = (cam) => {
    const map = mapRef.current;
    if (!map || !cam) return;
    setPovCamera(cam);
    map.flyTo({
      center: [parseFloat(cam.longitude), parseFloat(cam.latitude)],
      zoom: 17.6,
      pitch: 68, // Street level depression angle
      bearing: parseFloat(cam.directionAngle) || 0,
      duration: 1200,
      essential: true
    });
  };

  const handleExitPOV = () => {
    setPovCamera(null);
    mapRef.current?.flyTo({
      zoom: 15.4,
      pitch: 58,
      duration: 900
    });
  };

  const handlePanPOV = (deltaBearing) => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ bearing: map.getBearing() + deltaBearing, duration: 250 });
  };

  const handleTiltPOV = (deltaPitch) => {
    const map = mapRef.current;
    if (!map) return;
    const next = Math.min(VIDARBHA_CONFIG.maxPitch, Math.max(VIDARBHA_CONFIG.minPitch, map.getPitch() + deltaPitch));
    map.easeTo({ pitch: next, duration: 250 });
  };

  // Reset to Zero Mile / Nagpur Headquarters Hub
  const handleResetVidarbhaView = () => {
    const map = mapRef.current;
    if (!map) return;
    setPovCamera(null);
    map.flyTo({
      center: VIDARBHA_CONFIG.center,
      zoom: VIDARBHA_CONFIG.defaultZoom,
      pitch: VIDARBHA_CONFIG.defaultPitch,
      bearing: VIDARBHA_CONFIG.defaultBearing,
      duration: 1000
    });
  };

  const handleAdjustPitch = (delta) => {
    const map = mapRef.current;
    if (!map) return;
    const nextPitch = Math.min(VIDARBHA_CONFIG.maxPitch, Math.max(VIDARBHA_CONFIG.minPitch, map.getPitch() + delta));
    map.easeTo({ pitch: nextPitch, duration: 300 });
  };

  const handleCyclePitch = () => {
    const map = mapRef.current;
    if (!map) return;
    const pitches = [35, 55, 68, 76];
    const curr = Math.round(map.getPitch());
    const next = pitches.find(p => p > curr + 3) || pitches[0];
    map.easeTo({ pitch: next, duration: 350 });
  };

  const handleResetNorth = () => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ bearing: 0, duration: 400 });
  };

  const activeCamsCount = cameras.filter(c => c.cameraStatus === 'ACTIVE').length;

  return (
    <div className="w-full h-full relative isolate overflow-hidden select-none bg-[#0B0F19]">
      {/* MapLibre WebGL Canvas Container */}
      <div 
        ref={mapContainerRef} 
        className={`absolute inset-0 w-full h-full ${interactivePicker ? 'cursor-crosshair' : 'cursor-grab'}`}
      />

      {/* UNIFIED TOP BAR: Tactical Digital Twin Header */}
      <div className="absolute top-2.5 inset-x-2.5 sm:top-3 sm:inset-x-3 z-10 pointer-events-none flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Left: Tactical Twin Status Badge */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 bg-[#141413]/90 backdrop-blur-md px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-white border border-white/10 shadow-lg text-[10px] sm:text-[11px] font-semibold shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#10B981] shrink-0 animate-pulse"></span>
          <span className="font-bold tracking-tight">DIGITAL TWIN 3D</span>
          <span className="text-[9px] font-mono text-[#F37338] bg-[#F37338]/20 px-1.5 py-0.5 rounded-full border border-[#F37338]/30">
            NAGPUR HQ
          </span>
          {realtimeClock && (
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono text-white/70 border-l border-white/20 pl-2">
              <Clock className="w-2.5 h-2.5 text-[#F37338]" />
              {realtimeClock}
            </span>
          )}
        </div>

        {/* Right: Controls Cluster (Engine, Styles, Fullscreen) */}
        <div className="pointer-events-auto flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
          {/* 2D / 3D Mode Switcher */}
          {onViewModeChange && !interactivePicker && (
            <div className="flex items-center bg-[#141413]/90 backdrop-blur-md p-0.5 rounded-full border border-white/15 shadow-lg">
              <button
                type="button"
                onClick={() => onViewModeChange('2d')}
                className={`px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold transition-all ${
                  viewMode === '2d'
                    ? 'bg-white text-[#141413] shadow-sm'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                2D
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('3d')}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold transition-all ${
                  viewMode === '3d'
                    ? 'bg-[#CF4500] text-white shadow-sm'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                <span>3D</span>
              </button>
            </div>
          )}

          {/* 3D Photorealistic Style Switcher */}
          <div className="flex items-center bg-[#141413]/90 backdrop-blur-md p-0.5 rounded-full border border-white/15 shadow-xl text-white">
            {Object.values(MAP_STYLES).map((style) => {
              const IconComponent = style.icon;
              const isActive = styleMode === style.id;
              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setStyleMode(style.id)}
                  title={style.label}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold transition-all ${
                    isActive 
                      ? 'bg-[#CF4500] text-white shadow-md' 
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <IconComponent className="w-3 h-3" />
                  <span className="hidden xl:inline">{style.label.replace('3D ', '')}</span>
                </button>
              );
            })}
          </div>

          {/* Fullscreen Expand/Exit Button */}
          {allowFullscreen && onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen (ESC)" : "Expand Fullscreen Map"}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-medium text-[10px] sm:text-[11px] shadow-mc-card transition-all active:scale-95 border cursor-pointer ${
                isFullscreen 
                  ? 'bg-[#CF4500] text-white hover:bg-[#B53C00] border-[#CF4500]'
                  : 'bg-white/95 backdrop-blur-md text-[#141413] hover:bg-[#141413] hover:text-white border-[#E5DFD9]'
              }`}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3 h-3 text-white shrink-0" />
                  <span className="hidden sm:inline font-bold">Exit</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3 h-3 text-[#CF4500] shrink-0" />
                  <span className="hidden sm:inline font-bold">Expand</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* TOP FLOATING OVERLAY: Virtual Camera POV Sightline Viewfinder */}
      {povCamera && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 pointer-events-auto bg-[#141413]/92 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-[#CF4500]/40 text-white shadow-2xl flex flex-col sm:flex-row items-center gap-3 animate-in fade-in max-w-[94%]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#CF4500] animate-ping shrink-0" />
            <div className="text-left">
              <div className="text-[10px] font-mono text-[#F37338] tracking-widest font-bold uppercase flex items-center gap-1.5">
                <span>VIRTUAL CCTV SIGHTLINE POV</span>
                <span className="text-white/60">•</span>
                <span className="text-white font-bold">{povCamera.cameraCode}</span>
              </div>
              <div className="text-xs font-semibold text-white truncate max-w-[240px] sm:max-w-xs">
                {povCamera.cameraName || 'CCTV Focal Perspective'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 border-t sm:border-t-0 sm:border-l border-white/15 pt-2 sm:pt-0 sm:pl-3">
            {/* Pan / Tilt controls */}
            <div className="flex items-center bg-white/10 rounded-full p-0.5 text-white/90">
              <button 
                type="button" 
                onClick={() => handlePanPOV(-15)} 
                title="Pan Left"
                className="p-1 hover:bg-white/20 rounded-full"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button 
                type="button" 
                onClick={() => handlePanPOV(15)} 
                title="Pan Right"
                className="p-1 hover:bg-white/20 rounded-full"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button 
                type="button" 
                onClick={() => handleTiltPOV(-5)} 
                title="Tilt Up"
                className="p-1 hover:bg-white/20 rounded-full"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button 
                type="button" 
                onClick={() => handleTiltPOV(5)} 
                title="Tilt Down"
                className="p-1 hover:bg-white/20 rounded-full"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleExitPOV}
              className="px-2.5 py-1 rounded-full bg-[#CF4500] hover:bg-[#B53C00] text-white text-[11px] font-bold shadow-md transition-colors"
            >
              Exit POV
            </button>
          </div>
        </div>
      )}

      {/* BOTTOM LEFT: Digital Twin Quick Actions & Optics Toolbar */}
      <div className="absolute bottom-2.5 left-2.5 sm:bottom-3 sm:left-3 z-10 pointer-events-auto flex items-center gap-1 sm:gap-1.5 bg-[#141413]/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15 shadow-xl text-white text-xs max-w-[calc(100%-80px)] overflow-x-auto no-scrollbar">
        {/* Reset to Nagpur Headquarters Hub */}
        <button
          type="button"
          onClick={handleResetVidarbhaView}
          title="Reset View to Nagpur Police HQ (Zero Mile)"
          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 hover:bg-[#CF4500] hover:text-white transition-all active:scale-95 text-[10px] sm:text-[11px] font-medium shrink-0"
        >
          <RotateCcw className="w-2.5 h-2.5 text-[#F37338]" />
          <span>HQ</span>
        </button>

        <div className="h-3 w-px bg-white/20 shrink-0"></div>

        {/* 3D Volumetric Extruded Frustums Toggle */}
        <button
          type="button"
          onClick={() => setShow3dBeams(prev => !prev)}
          title="Toggle 3D Volumetric Extruded Optical Beams"
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition-all active:scale-95 text-[10px] sm:text-[11px] font-medium shrink-0 ${
            show3dBeams ? 'bg-[#CF4500] text-white' : 'bg-white/10 hover:bg-white/20 text-white/80'
          }`}
        >
          <Sparkles className="w-2.5 h-2.5" />
          <span>3D Cones</span>
        </button>

        {/* DORI Forensic Optical Analysis Toggle */}
        <button
          type="button"
          onClick={() => setDoriMode(prev => !prev)}
          title="Toggle Forensic DORI Optical Zones (Identification / Recognition / Detection)"
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition-all active:scale-95 text-[10px] sm:text-[11px] font-medium shrink-0 ${
            doriMode ? 'bg-[#10B981] text-white font-bold' : 'bg-white/10 hover:bg-white/20 text-white/80'
          }`}
        >
          <Scan className="w-2.5 h-2.5" />
          <span>DORI</span>
        </button>

        <div className="h-3 w-px bg-white/20 shrink-0"></div>

        {/* Live GPS Patrol Fix */}
        <button
          type="button"
          onClick={handleTriggerLiveLocation}
          title="Acquire Live GPS Patrol Location"
          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 hover:bg-[#10B981] hover:text-white transition-all active:scale-95 text-[10px] sm:text-[11px] font-medium text-white/90 shrink-0"
        >
          <Navigation className={`w-2.5 h-2.5 ${effectiveIsLocating ? 'animate-spin text-[#F37338]' : 'text-[#10B981]'}`} />
          <span>{effectiveIsLocating ? 'GPS...' : 'Live GPS'}</span>
        </button>

        <div className="h-3 w-px bg-white/20 shrink-0"></div>

        {/* 3D Pitch Depression Cycler */}
        <button
          type="button"
          onClick={handleCyclePitch}
          title="Cycle Camera Perspective Pitch"
          className="px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 transition-all text-[9px] sm:text-[10px] font-mono font-bold shrink-0"
        >
          Tilt {currentPitch}°
        </button>
      </div>

      {/* BOTTOM RIGHT: Unified Surveillance Compass & Tactical Zoom Controls */}
      <div className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 z-10 pointer-events-auto flex flex-col items-center gap-1.5 scale-75 sm:scale-85 origin-bottom-right">
        <MapCompass
          bearing={currentBearing}
          onResetNorth={handleResetNorth}
          title="Surveillance Compass (Click to reset North)"
        />

        {/* Tactical Dark Glass Zoom Controls */}
        <div className="flex flex-col items-center bg-[#141413]/90 backdrop-blur-md rounded-2xl border border-white/15 overflow-hidden shadow-xl text-white">
          <button
            type="button"
            onClick={() => mapRef.current?.zoomIn({ duration: 250 })}
            className="p-2 hover:bg-white/10 active:bg-white/20 transition-all text-white/90 hover:text-white"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="h-px w-5 bg-white/15" />
          <button
            type="button"
            onClick={() => mapRef.current?.zoomOut({ duration: 250 })}
            className="p-2 hover:bg-white/10 active:bg-white/20 transition-all text-white/90 hover:text-white"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
