import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {
  Camera,
  Search,
  Plus,
  MapPin,
  Eye,
  CheckCircle2,
  X,
  Compass,
  Radio,
  Map,
  Grid,
  List,
  ChevronRight,
  ShieldCheck,
  Phone,
  Building,
} from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Card } from '../../components/Card';
import { CameraMap } from '../../components/CameraMap';
import { StatusBadge } from '../../components/StatusBadge';
import { RegisterCameraScreen } from './RegisterCameraScreen';
import api from '../../api/client';

export const CameraListScreen = () => {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRadarMap, setShowRadarMap] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);

  const fetchCameras = useCallback(async () => {
    try {
      const res = await api.get('/cameras/search?size=1000');
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data.content || []);
        setCameras(list);
      }
    } catch (err) {
      console.warn('Error fetching cameras:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCameras();
  }, [fetchCameras]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCameras();
  };

  const filteredCameras = cameras.filter((cam) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (cam.landmark && cam.landmark.toLowerCase().includes(q)) ||
      (cam.street && cam.street.toLowerCase().includes(q)) ||
      (cam.cameraCode && cam.cameraCode.toLowerCase().includes(q)) ||
      (cam.area && cam.area.toLowerCase().includes(q)) ||
      (cam.ownerName && cam.ownerName.toLowerCase().includes(q));

    const matchesType =
      selectedType === 'ALL' ||
      (cam.cameraType && cam.cameraType.toUpperCase() === selectedType) ||
      (cam.type && cam.type.toUpperCase() === selectedType);

    const matchesStatus =
      selectedStatus === 'ALL' ||
      (selectedStatus === 'ACTIVE' && (cam.cameraStatus === 'ACTIVE' || cam.status === 'ACTIVE')) ||
      (selectedStatus === 'PENDING' && (cam.status === 'PENDING' || cam.verificationStatus === 'PENDING')) ||
      (selectedStatus === 'OFFLINE' && (cam.cameraStatus === 'OFFLINE' || cam.status === 'OFFLINE'));

    return matchesSearch && matchesType && matchesStatus;
  });

  const renderCameraCard = ({ item }) => {
    const isOnline = item.cameraStatus === 'ACTIVE' || item.status === 'ACTIVE';
    const typeLabel = item.cameraType || item.type || 'PTZ';

    return (
      <Card style={styles.camCard}>
        {/* Big Circular Avatar Preview */}
        <View style={styles.camAvatarRow}>
          <View style={styles.bigAvatarCircle}>
            <Camera size={26} color={Colors.ink} />
            <Text style={styles.avatarType}>{typeLabel}</Text>
            <View style={styles.avatarStatusRow}>
              <View style={[styles.statusDot, isOnline ? styles.dotGreen : styles.dotOrange]} />
              <Text style={styles.statusDotText}>{isOnline ? 'ONLINE' : 'OFFLINE'}</Text>
            </View>
            <TouchableOpacity 
              style={styles.satelliteArrow}
              onPress={() => setSelectedCamera(item)}
              activeOpacity={0.8}
            >
              <ChevronRight size={16} color={Colors.ink} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Eyebrow & Title */}
        <View style={styles.cardHeader}>
          <View style={styles.eyebrowRow}>
            <View style={styles.eyebrowDot} />
            <Text style={styles.eyebrowText}>SURVEILLANCE NODE</Text>
          </View>
          <Text style={styles.camTitle} numberOfLines={2}>
            {item.landmark || item.area || `Surveillance Node #${item.id}`}
          </Text>
          <Text style={styles.camCodeText}>{item.cameraCode || `CAM-00${item.id}`}</Text>
        </View>

        {/* Location Pin */}
        <View style={styles.locRow}>
          <MapPin size={15} color={Colors.clay} />
          <Text style={styles.locText} numberOfLines={1}>
            {item.street ? `${item.street}, ` : ''}{item.area || item.city || 'Sector 4, Metro City'}
          </Text>
        </View>

        {/* Metrics Box */}
        <View style={styles.metricsBox}>
          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>ORIENTATION</Text>
            <Text style={styles.metricVal}>
              {item.directionAngle || item.coverageAngle || 45}° [{item.directionAngle > 180 ? 'WEST' : 'EAST'}]
            </Text>
          </View>
          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>RADAR ARC</Text>
            <Text style={styles.metricVal}>{item.coverageRadiusMeters || 150}m</Text>
          </View>
        </View>

        {/* Owner Box */}
        <View style={styles.ownerBox}>
          <Text style={styles.ownerLabel}>OWNER</Text>
          <Text style={styles.ownerVal}>{item.ownerName || 'Govt / Police Dept'}</Text>
        </View>

        {/* Card Footer: Status Badge & Inspect Button */}
        <View style={styles.cardFooter}>
          <StatusBadge status={item.status || item.verificationStatus || item.cameraStatus} />
          <TouchableOpacity
            style={styles.inspectBtn}
            onPress={() => setSelectedCamera(item)}
            activeOpacity={0.8}
          >
            <Eye size={14} color={Colors.ink} />
            <Text style={styles.inspectBtnText}>Inspect</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredCameras}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCameraCard}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.signal} />}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            {/* Top Metropolitan Registry Banner */}
            <Card style={styles.topCard}>
              <View style={styles.eyebrowRow}>
                <View style={styles.eyebrowDot} />
                <Text style={styles.eyebrowText}>POLICE SURVEILLANCE INFRASTRUCTURE</Text>
              </View>

              <Text style={styles.topTitle}>Metropolitan CCTV Camera Registry</Text>
              <Text style={styles.topSubtitle}>
                Geocoded surveillance nodes, directional coverage angles, optical specs, and civilian/police camera owners for crime investigation.
              </Text>

              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={styles.radarToggleBtn}
                  onPress={() => setShowRadarMap(!showRadarMap)}
                  activeOpacity={0.85}
                >
                  <Map size={16} color={Colors.white} />
                  <Text style={styles.radarToggleText}>
                    {showRadarMap ? 'Hide GIS Radar' : 'Show GIS Radar'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.surveyBtn}
                  onPress={() => setIsSurveyModalOpen(true)}
                  activeOpacity={0.85}
                >
                  <Plus size={16} color={Colors.signal} />
                  <Text style={styles.surveyBtnText}>Survey New Camera</Text>
                </TouchableOpacity>
              </View>
            </Card>

            {/* Live Geospatial Map Card */}
            {showRadarMap && (
              <Card style={styles.mapCard}>
                <View style={styles.mapCardHeader}>
                  <View style={styles.eyebrowRow}>
                    <View style={styles.eyebrowDot} />
                    <Text style={styles.eyebrowText}>LIVE GEOSPATIAL CCTV RECONNAISSANCE</Text>
                  </View>
                  <View style={styles.plottedBadge}>
                    <Text style={styles.plottedText}>{cameras.length} nodes plotted</Text>
                  </View>
                </View>

                <CameraMap
                  cameras={cameras}
                  height={340}
                  onSelectCamera={(cam) => setSelectedCamera(cam)}
                />
              </Card>
            )}

            {/* Filter Card */}
            <Card style={styles.filterCard}>
              <View style={styles.searchBar}>
                <Search size={16} color={Colors.muted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by camera code, area, landmark, owner name..."
                  placeholderTextColor={Colors.muted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {/* Hardware & Status Chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
                {['ALL', 'PTZ', 'DOME', 'BULLET'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.filterChip, selectedType === t && styles.filterChipActive]}
                    onPress={() => setSelectedType(t)}
                  >
                    <Text style={[styles.filterChipText, selectedType === t && styles.filterChipTextActive]}>
                      {t === 'ALL' ? 'All Hardware' : t}
                    </Text>
                  </TouchableOpacity>
                ))}

                {['ALL', 'ACTIVE', 'PENDING', 'OFFLINE'].map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.filterChip, selectedStatus === s && styles.filterChipActive]}
                    onPress={() => setSelectedStatus(s)}
                  >
                    <Text style={[styles.filterChipText, selectedStatus === s && styles.filterChipTextActive]}>
                      {s === 'ALL' ? 'All Statuses' : s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Card>

            <Text style={styles.resultCounter}>
              Showing <Text style={{ fontWeight: '800', color: Colors.ink }}>{filteredCameras.length}</Text> registered police surveillance nodes
            </Text>
          </View>
        }
      />

      {/* Camera Inspection Detail Modal */}
      {selectedCamera && (
        <Modal visible={true} transparent animationType="slide" onRequestClose={() => setSelectedCamera(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalEyebrow}>CCTV SURVEILLANCE TELEMETRY</Text>
                  <Text style={styles.modalTitle}>{selectedCamera.landmark || selectedCamera.address}</Text>
                  <Text style={styles.modalCode}>{selectedCamera.cameraCode || `CAM-${selectedCamera.id}`}</Text>
                </View>
                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedCamera(null)}>
                  <X size={20} color={Colors.ink} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.modalGrid}>
                  <View style={styles.modalSpecItem}>
                    <Text style={styles.modalSpecLabel}>TYPE</Text>
                    <Text style={styles.modalSpecVal}>{selectedCamera.cameraType || selectedCamera.type || 'PTZ'}</Text>
                  </View>
                  <View style={styles.modalSpecItem}>
                    <Text style={styles.modalSpecLabel}>STATUS</Text>
                    <StatusBadge status={selectedCamera.cameraStatus || selectedCamera.status} />
                  </View>
                  <View style={styles.modalSpecItem}>
                    <Text style={styles.modalSpecLabel}>RESOLUTION</Text>
                    <Text style={styles.modalSpecVal}>{selectedCamera.resolution || '1080P'}</Text>
                  </View>
                  <View style={styles.modalSpecItem}>
                    <Text style={styles.modalSpecLabel}>RADAR ARC</Text>
                    <Text style={styles.modalSpecVal}>{selectedCamera.coverageRadiusMeters || 150}m</Text>
                  </View>
                  <View style={styles.modalSpecItem}>
                    <Text style={styles.modalSpecLabel}>ORIENTATION</Text>
                    <Text style={styles.modalSpecVal}>{selectedCamera.directionAngle || 45}°</Text>
                  </View>
                  <View style={styles.modalSpecItem}>
                    <Text style={styles.modalSpecLabel}>RETENTION</Text>
                    <Text style={styles.modalSpecVal}>{selectedCamera.storageRetentionDays || 30} Days</Text>
                  </View>
                </View>

                <View style={styles.modalDivider} />

                <Text style={styles.sectionHeading}>OWNER &amp; LEGAL CUSTODIAN</Text>
                <Text style={styles.ownerText}>{selectedCamera.ownerName || 'Govt / Police Bureau'}</Text>
                <Text style={styles.ownerPhone}>📞 {selectedCamera.ownerPhone || '+91 98765 43210'}</Text>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Survey New Camera Modal */}
      {isSurveyModalOpen && (
        <Modal visible={true} animationType="slide" onRequestClose={() => setIsSurveyModalOpen(false)}>
          <RegisterCameraScreen 
            onSuccess={() => {
              setIsSurveyModalOpen(false);
              fetchCameras();
            }}
            onCancel={() => setIsSurveyModalOpen(false)}
          />
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  listContent: {
    padding: 16,
    paddingBottom: 110,
    gap: 16,
  },
  headerSection: {
    gap: 16,
    marginBottom: 8,
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
  topTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.ink,
    letterSpacing: -0.4,
  },
  topSubtitle: {
    fontSize: 12,
    color: Colors.muted,
    lineHeight: 18,
  },
  btnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  radarToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.ink,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  radarToggleText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  surveyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.ink,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  surveyBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  mapCard: {
    padding: 16,
    borderRadius: 32,
    gap: 12,
  },
  mapCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  plottedBadge: {
    backgroundColor: Colors.white,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1CDC7',
  },
  plottedText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.ink,
    fontFamily: 'monospace',
  },
  filterCard: {
    padding: 14,
    borderRadius: 24,
    gap: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.canvas,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.ink,
  },
  chipsScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: Colors.canvas,
    borderWidth: 1,
    borderColor: '#D1CDC7',
  },
  filterChipActive: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.ink,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  resultCounter: {
    fontSize: 12,
    color: Colors.muted,
    paddingHorizontal: 4,
  },
  camCard: {
    padding: 18,
    borderRadius: 28,
    gap: 12,
  },
  camAvatarRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  bigAvatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EAE6E1',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#D1CDC7',
  },
  avatarType: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.ink,
    marginTop: 2,
  },
  avatarStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotGreen: {
    backgroundColor: '#10B981',
  },
  dotOrange: {
    backgroundColor: Colors.signal,
  },
  statusDotText: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.ink,
  },
  satelliteArrow: {
    position: 'absolute',
    right: -4,
    bottom: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardHeader: {
    gap: 2,
  },
  camTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.ink,
    letterSpacing: -0.3,
  },
  camCodeText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: Colors.muted,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locText: {
    fontSize: 12,
    color: Colors.muted,
    flex: 1,
  },
  metricsBox: {
    flexDirection: 'row',
    backgroundColor: Colors.canvas,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5DFD9',
  },
  metricCol: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.muted,
    letterSpacing: 0.5,
  },
  metricVal: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.ink,
    marginTop: 2,
  },
  ownerBox: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5DFD9',
  },
  ownerLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.muted,
    letterSpacing: 0.5,
  },
  ownerVal: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.ink,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  inspectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.ink,
  },
  inspectBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.ink,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 22,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 14,
  },
  modalEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.signal,
    letterSpacing: 0.5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.ink,
    marginTop: 2,
  },
  modalCode: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: Colors.muted,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    paddingVertical: 14,
  },
  modalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  modalSpecItem: {
    width: '47%',
    backgroundColor: Colors.canvas,
    padding: 12,
    borderRadius: 16,
  },
  modalSpecLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.muted,
  },
  modalSpecVal: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.ink,
    marginTop: 2,
  },
  modalDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.muted,
    letterSpacing: 0.5,
  },
  ownerText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.ink,
    marginTop: 4,
  },
  ownerPhone: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.signal,
    marginTop: 2,
  },
});
