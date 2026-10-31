import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {
  Target,
  Navigation,
  FileText,
  Building,
  User,
  Plus,
  Trash2,
  Camera,
  MapPin,
  Clock,
  CheckCircle2,
  X,
  Radar,
  Radio,
  Send,
} from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Card } from '../../components/Card';
import { CameraMap } from '../../components/CameraMap';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export const InvestigationsScreen = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [stations, setStations] = useState([]);
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const [radarDistance, setRadarDistance] = useState(500);
  const [isPinActive, setIsPinActive] = useState(true);
  const [isRequisitionModalOpen, setIsRequisitionModalOpen] = useState(false);
  const [selectedCameraForReq, setSelectedCameraForReq] = useState(null);
  const [reqReason, setReqReason] = useState('Suspect fleeing scene captured on perimeter feed');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCasesAndCameras = useCallback(async () => {
    try {
      const [casesRes, camRes, stationsRes] = await Promise.allSettled([
        api.get('/investigations?size=50'),
        api.get('/cameras/search?size=1000'),
        api.get('/stations'),
      ]);

      if (casesRes.status === 'fulfilled' && casesRes.value?.success) {
        const cList = casesRes.value.data?.content || casesRes.value.data || [];
        setCases(Array.isArray(cList) ? cList : []);
      }
      if (camRes.status === 'fulfilled' && camRes.value?.success) {
        const camList = camRes.value.data?.content || camRes.value.data || [];
        setCameras(Array.isArray(camList) ? camList : []);
      }
      if (stationsRes.status === 'fulfilled' && stationsRes.value?.success) {
        const sList = stationsRes.value.data?.content || stationsRes.value.data || [];
        setStations(Array.isArray(sList) ? sList : []);
      }
    } catch (err) {
      console.warn('Error fetching cases:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCasesAndCameras();
  }, [fetchCasesAndCameras]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCasesAndCameras();
  };

  const currentCase = cases[activeCaseIndex] || {
    id: 1,
    caseNumber: 'CAS-8240',
    firNumber: 'FIR-2026-329',
    title: 'theft at the house',
    status: 'ACTIVE',
    policeStationName: 'Nagpur Police Commissionerate HQ',
    assignedOfficerName: user?.fullName || 'System Administrator',
    latitude: 21.1458,
    longitude: 79.0882,
  };

  const crimeLocation = currentCase.latitude && currentCase.longitude ? {
    lat: currentCase.latitude,
    lng: currentCase.longitude,
    name: `${currentCase.caseNumber} - ${currentCase.title}`
  } : null;

  // Calculate Haversine proximity for nearby cameras
  const nearbyCameras = cameras.filter((cam) => {
    if (!crimeLocation || !cam.latitude || !cam.longitude) return false;
    const R = 6371e3;
    const phi1 = (crimeLocation.lat * Math.PI) / 180;
    const phi2 = (cam.latitude * Math.PI) / 180;
    const deltaPhi = ((cam.latitude - crimeLocation.lat) * Math.PI) / 180;
    const deltaLambda = ((cam.longitude - crimeLocation.lng) * Math.PI) / 180;
    const a = Math.sin(deltaPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return dist <= radarDistance;
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.signal} />}
    >
      {/* Top Investigation Command Card (Screenshot 4) */}
      <Card style={styles.topCard}>
        <View style={styles.eyebrowRow}>
          <View style={styles.eyebrowDot} />
          <Text style={styles.eyebrowText}>POLICE GIS INVESTIGATION COMMAND</Text>
        </View>

        <Text style={styles.caseTitle}>{currentCase.title || 'theft at the house'}</Text>

        <View style={styles.chipsRow}>
          <View style={styles.codeChip}>
            <Text style={styles.codeChipText}>{currentCase.caseNumber || 'CAS-8240'}</Text>
          </View>
          <View style={styles.firChip}>
            <Text style={styles.firChipText}>{currentCase.firNumber || 'FIR-2026-329'}</Text>
          </View>
        </View>

        <View style={styles.metaChip}>
          <Building size={14} color={Colors.linkBlue} />
          <Text style={styles.metaChipText} numberOfLines={1}>
            {currentCase.policeStationName || user?.policeStationName || 'Nagpur Police Commissionerate HQ'}
          </Text>
        </View>

        <View style={styles.metaChip}>
          <User size={14} color={Colors.muted} />
          <Text style={styles.metaChipText}>
            {currentCase.assignedOfficerName || user?.fullName || 'System Administrator'}
          </Text>
        </View>

        <View style={styles.actionBtnRow}>
          <TouchableOpacity style={styles.closeCaseBtn} activeOpacity={0.8}>
            <Trash2 size={14} color={Colors.signal} />
            <Text style={styles.closeCaseText}>Close Case</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.newFirBtn} activeOpacity={0.8}>
            <Plus size={14} color={Colors.signal} />
            <Text style={styles.newFirText}>New Incident FIR</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Proximity Radar Controls Card (Screenshot 4) */}
      <Card style={styles.radarCard}>
        <View style={styles.radarButtonsRow}>
          <TouchableOpacity
            style={[styles.radarPill, isPinActive && styles.radarPillActive]}
            onPress={() => setIsPinActive(!isPinActive)}
          >
            <Target size={14} color={isPinActive ? Colors.signal : Colors.muted} />
            <Text style={[styles.radarPillText, isPinActive && styles.radarPillTextActive]}>
              Crime Pin Active
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.radarPill, !isPinActive && styles.radarPillActive]}
            onPress={() => setIsPinActive(!isPinActive)}
          >
            <Navigation size={14} color={!isPinActive ? Colors.linkBlue : Colors.muted} />
            <Text style={[styles.radarPillText, !isPinActive && styles.radarPillTextActive]}>
              My Patrol GPS
            </Text>
          </TouchableOpacity>
        </View>

        {/* Distance Selector */}
        <View style={styles.distanceRow}>
          <Text style={styles.distanceLabel}>PROXIMITY RADAR:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.distanceChips}>
            {[200, 500, 1000, 2000].map((dist) => (
              <TouchableOpacity
                key={dist}
                style={[styles.distChip, radarDistance === dist && styles.distChipActive]}
                onPress={() => setRadarDistance(dist)}
              >
                <Text style={[styles.distChipText, radarDistance === dist && styles.distChipTextActive]}>
                  {dist}m {dist === 500 ? '(Standard Grid)' : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Card>

      {/* Incident Map Card (Screenshot 4) */}
      <Card style={styles.mapCard}>
        <View style={styles.mapHeader}>
          <View style={styles.focalRow}>
            <Target size={15} color={Colors.signal} />
            <Text style={styles.focalText}>
              Focal Point: {currentCase.caseNumber} - Central Incident Point
            </Text>
          </View>
          <View style={styles.linkedRow}>
            <View style={styles.orangeDot} />
            <Text style={styles.linkedText}>
              {nearbyCameras.length} CCTV Nodes Linked by Radar
            </Text>
          </View>
        </View>

        {/* Real Leaflet Map */}
        <CameraMap
          cameras={nearbyCameras.length > 0 ? nearbyCameras : cameras}
          stations={stations}
          crimeLocation={crimeLocation}
          searchRadius={radarDistance}
          height={380}
          onSelectCamera={(cam) => {
            setSelectedCameraForReq(cam);
            setIsRequisitionModalOpen(true);
          }}
        />
      </Card>

      {/* Nearby Detected Camera Nodes List */}
      <View style={styles.nearbySection}>
        <Text style={styles.nearbyHeading}>
          RADAR DETECTED NODES ({nearbyCameras.length})
        </Text>
        {nearbyCameras.slice(0, 5).map((cam) => (
          <Card key={cam.id} style={styles.nearbyCamCard}>
            <View style={styles.nearbyTopRow}>
              <View style={styles.camIdBadge}>
                <Camera size={14} color={Colors.ink} />
                <Text style={styles.camIdText}>{cam.cameraCode || `CAM-${cam.id}`}</Text>
              </View>
              <StatusBadge status={cam.cameraStatus || cam.status} />
            </View>

            <Text style={styles.nearbyTitle}>{cam.landmark || cam.address || 'Surveillance Node'}</Text>

            <TouchableOpacity
              style={styles.requestFootageBtn}
              onPress={() => {
                setSelectedCameraForReq(cam);
                setIsRequisitionModalOpen(true);
              }}
            >
              <FileText size={14} color={Colors.white} />
              <Text style={styles.requestFootageText}>Request Legal Footage Requisition</Text>
            </TouchableOpacity>
          </Card>
        ))}
      </View>

      {/* Requisition Modal */}
      {isRequisitionModalOpen && selectedCameraForReq && (
        <Modal visible={true} transparent animationType="slide" onRequestClose={() => setIsRequisitionModalOpen(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalEyebrow}>EVIDENCE REQUISITION DOSSIER</Text>
                  <Text style={styles.modalTitle}>{selectedCameraForReq.landmark || 'Surveillance Node'}</Text>
                </View>
                <TouchableOpacity onPress={() => setIsRequisitionModalOpen(false)}>
                  <X size={20} color={Colors.ink} />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>OFFICIAL INVESTIGATION PURPOSE / REASON</Text>
              <TextInput
                style={styles.reasonInput}
                multiline
                numberOfLines={3}
                value={reqReason}
                onChangeText={setReqReason}
              />

              <TouchableOpacity
                style={styles.dispatchBtn}
                onPress={() => {
                  Alert.alert('Requisition Dispatched', 'Official legal notice transmitted to camera custodian.');
                  setIsRequisitionModalOpen(false);
                }}
              >
                <Send size={16} color={Colors.white} />
                <Text style={styles.dispatchBtnText}>Dispatch Subpoena Notice</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
    gap: 16,
  },
  topCard: {
    padding: 22,
    borderRadius: 32,
    gap: 10,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.signal,
  },
  eyebrowText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.muted,
    letterSpacing: 0.5,
  },
  caseTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.ink,
    letterSpacing: -0.4,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 2,
  },
  codeChip: {
    backgroundColor: Colors.canvas,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1CDC7',
  },
  codeChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.ink,
    fontFamily: 'monospace',
  },
  firChip: {
    backgroundColor: '#FDF0EE',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F8C6BC',
  },
  firChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.signal,
    fontFamily: 'monospace',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5DFD9',
  },
  metaChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.ink,
    flex: 1,
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  closeCaseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: '#E5DFD9',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
  },
  closeCaseText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.signal,
  },
  newFirBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.ink,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 18,
  },
  newFirText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.white,
  },
  radarCard: {
    padding: 16,
    borderRadius: 26,
    gap: 12,
  },
  radarButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  radarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.canvas,
    borderWidth: 1,
    borderColor: '#D1CDC7',
  },
  radarPillActive: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  radarPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.ink,
  },
  radarPillTextActive: {
    color: Colors.white,
  },
  distanceRow: {
    gap: 6,
  },
  distanceLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.muted,
    letterSpacing: 0.5,
  },
  distanceChips: {
    flexDirection: 'row',
    gap: 8,
  },
  distChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: Colors.canvas,
    borderWidth: 1,
    borderColor: '#D1CDC7',
  },
  distChipActive: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  distChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.ink,
  },
  distChipTextActive: {
    color: Colors.white,
  },
  mapCard: {
    padding: 16,
    borderRadius: 32,
    gap: 12,
  },
  mapHeader: {
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5DFD9',
    paddingBottom: 10,
  },
  focalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  focalText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.ink,
  },
  linkedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orangeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.signal,
  },
  linkedText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.signal,
  },
  nearbySection: {
    gap: 10,
    marginTop: 4,
  },
  nearbyHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.muted,
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  nearbyCamCard: {
    padding: 14,
    borderRadius: 22,
    gap: 8,
  },
  nearbyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  camIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.canvas,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1CDC7',
  },
  camIdText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.ink,
    fontFamily: 'monospace',
  },
  nearbyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.ink,
  },
  requestFootageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.signal,
    borderRadius: 16,
    paddingVertical: 9,
    marginTop: 4,
  },
  requestFootageText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 22,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.signal,
    letterSpacing: 0.5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.ink,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.muted,
  },
  reasonInput: {
    backgroundColor: Colors.canvas,
    borderWidth: 1,
    borderColor: '#D1CDC7',
    borderRadius: 16,
    padding: 12,
    fontSize: 13,
    color: Colors.ink,
    textAlignVertical: 'top',
  },
  dispatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.signal,
    borderRadius: 20,
    paddingVertical: 12,
    marginTop: 6,
  },
  dispatchBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.white,
  },
});
