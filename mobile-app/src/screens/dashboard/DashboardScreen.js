import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { 
  Camera, 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  FileSearch, 
  Building2, 
  Target, 
  ArrowUpRight 
} from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Card } from '../../components/Card';
import { CameraMap } from '../../components/CameraMap';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export const DashboardScreen = ({ onNavigate }) => {
  const { user, isAdmin, isOfficer } = useAuth();
  const [stats, setStats] = useState({});
  const [cameras, setCameras] = useState([]);
  const [stations, setStations] = useState([]);
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, camRes, stationRes, casesRes] = await Promise.allSettled([
        api.get('/dashboard/stats'),
        api.get('/cameras/search?size=1000'),
        api.get('/stations'),
        api.get('/investigations?size=100'),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value?.success) {
        setStats(statsRes.value.data || {});
      }
      if (camRes.status === 'fulfilled' && camRes.value?.success) {
        const list = camRes.value.data?.content || camRes.value.data || [];
        setCameras(Array.isArray(list) ? list : []);
      }
      if (stationRes.status === 'fulfilled' && stationRes.value?.success) {
        const sList = stationRes.value.data?.content || stationRes.value.data || [];
        setStations(Array.isArray(sList) ? sList : []);
      }
      if (casesRes.status === 'fulfilled' && casesRes.value?.success) {
        const cList = casesRes.value.data?.content || casesRes.value.data || [];
        setCases(Array.isArray(cList) ? cList : []);
      }
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const activeCase = cases.find((c) => c.id === selectedCaseId) || cases[0];
  const crimeLocation = activeCase?.latitude && activeCase?.longitude ? {
    lat: activeCase.latitude,
    lng: activeCase.longitude,
    name: `${activeCase.caseNumber || 'CAS'} - ${activeCase.title || 'Incident Target'}`
  } : null;

  const statCards = [
    {
      title: 'Total CCTV Cameras',
      value: stats.totalCameras || cameras.length || 0,
      icon: Camera,
      iconBg: Colors.ink,
      iconColor: Colors.white,
      sublabel: 'Surveillance network',
      navKey: 'Cameras',
    },
    {
      title: 'Active Live Stream',
      value: stats.activeCameras || cameras.filter(c => c.cameraStatus === 'ACTIVE' || c.status === 'ACTIVE').length || 0,
      icon: Eye,
      iconBg: '#EAF7EE',
      iconColor: '#0A7334',
      sublabel: 'Online & healthy',
      navKey: 'Cameras',
    },
    {
      title: 'Offline / Maintenance',
      value: stats.offlineCameras || cameras.filter(c => c.cameraStatus === 'OFFLINE' || c.status === 'OFFLINE').length || 0,
      icon: AlertTriangle,
      iconBg: '#FDF0EE',
      iconColor: Colors.signal,
      sublabel: 'Requires attention',
      navKey: 'Cameras',
    },
    {
      title: 'Pending Verification',
      value: stats.pendingVerificationCameras || 0,
      icon: CheckCircle,
      iconBg: '#FEF6E9',
      iconColor: '#B56708',
      sublabel: 'Awaiting police review',
      navKey: 'Verification',
    },
    {
      title: 'Active Investigations',
      value: stats.openCases || cases.length || 0,
      icon: FileSearch,
      iconBg: '#EEF2FC',
      iconColor: '#3860BE',
      sublabel: 'Active crime dossiers',
      navKey: 'Investigations',
    },
    {
      title: 'Police Stations HQ',
      value: stats.totalPoliceStations || stations.length || 2,
      icon: Building2,
      iconBg: Colors.canvas,
      iconColor: Colors.ink,
      sublabel: 'Jurisdiction precincts',
      navKey: 'Dashboard',
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.signal} />}
    >
      {/* Top Police Command Stadium Banner */}
      <Card style={styles.topBanner}>
        <View style={styles.watermarkContainer} pointerEvents="none">
          <Text style={styles.watermarkText}>POLICE GIS</Text>
        </View>

        <View style={styles.eyebrowRow}>
          <View style={styles.eyebrowDot} />
          <Text style={styles.eyebrowText}>POLICE GIS COMMAND</Text>
        </View>

        <Text style={styles.bannerTitle}>
          {isAdmin ? 'Police GIS Command Center' : 'Patrol CCTV Live Map'}
        </Text>

        <Text style={styles.bannerSubtitle}>
          Real-time CCTV telemetry, directional field-of-view cones, police precincts, and crime scene mapping.
        </Text>
      </Card>

      {/* 2-Column KPI Stats Grid */}
      <View style={styles.statsGrid}>
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <TouchableOpacity
              key={idx}
              style={styles.statCard}
              onPress={() => onNavigate && onNavigate(card.navKey)}
              activeOpacity={0.85}
            >
              <View style={styles.statHeader}>
                <Text style={styles.statTitle} numberOfLines={1}>{card.title}</Text>
                <View style={[styles.statIconWrap, { backgroundColor: card.iconBg }]}>
                  <Icon size={16} color={card.iconColor} />
                </View>
              </View>

              <Text style={styles.statValue}>
                {loading ? '...' : card.value}
              </Text>

              <View style={styles.statFooter}>
                <Text style={styles.statSublabel} numberOfLines={1}>{card.sublabel}</Text>
                <View style={styles.arrowCircle}>
                  <ArrowUpRight size={12} color={Colors.ink} />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Live Map Stadium Frame */}
      <Card style={styles.mapCard}>
        <View style={styles.mapHeader}>
          <View style={styles.mapHeaderLeft}>
            <View style={styles.eyebrowRow}>
              <View style={styles.eyebrowDot} />
              <Text style={styles.eyebrowText}>GEOSPATIAL RADAR NETWORK</Text>
            </View>
            <View style={styles.mapTitleRow}>
              <Text style={styles.mapTitle}>Metropolitan CCTV &amp; Police Infrastructure</Text>
              <View style={styles.nodesBadge}>
                <Text style={styles.nodesBadgeText}>{cameras.length} nodes online</Text>
              </View>
            </View>
          </View>

          {/* Crime Target Selector */}
          {cases.length > 0 && (
            <View style={styles.crimeTargetRow}>
              <View style={styles.targetLabelRow}>
                <Target size={14} color={Colors.signal} />
                <Text style={styles.targetLabelText}>CRIME TARGET:</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.casesScroll}>
                {cases.map((c) => {
                  const isSelected = activeCase?.id === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.caseChip, isSelected && styles.caseChipSelected]}
                      onPress={() => setSelectedCaseId(c.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.caseChipText, isSelected && styles.caseChipTextSelected]}>
                        {c.caseNumber} - {c.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Real Leaflet Map */}
        <CameraMap
          cameras={cameras}
          stations={stations}
          crimeLocation={crimeLocation}
          searchRadius={500}
          height={380}
          onSelectCamera={(cam) => {
            if (onNavigate) onNavigate('Cameras');
          }}
        />
      </Card>
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
  topBanner: {
    padding: 22,
    borderRadius: 32,
    position: 'relative',
    overflow: 'hidden',
  },
  watermarkContainer: {
    position: 'absolute',
    right: -10,
    top: 15,
    opacity: 0.08,
  },
  watermarkText: {
    fontSize: 54,
    fontWeight: '900',
    color: Colors.ink,
    letterSpacing: -2,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
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
  bannerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.ink,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: Colors.muted,
    lineHeight: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48.5%',
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5DFD9',
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    justifyContent: 'space-between',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  statTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.muted,
    flex: 1,
    paddingRight: 4,
  },
  statIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.ink,
    marginVertical: 8,
    letterSpacing: -0.5,
  },
  statFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5DFD9',
  },
  statSublabel: {
    fontSize: 10,
    color: Colors.muted,
    flex: 1,
  },
  arrowCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5DFD9',
  },
  mapCard: {
    padding: 16,
    borderRadius: 32,
    gap: 14,
  },
  mapHeader: {
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5DFD9',
    paddingBottom: 12,
  },
  mapHeaderLeft: {
    gap: 4,
  },
  mapTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.ink,
    flex: 1,
  },
  nodesBadge: {
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1CDC7',
  },
  nodesBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.ink,
    fontFamily: 'monospace',
  },
  crimeTargetRow: {
    gap: 6,
  },
  targetLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  targetLabelText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.signal,
    letterSpacing: 0.5,
  },
  casesScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  caseChip: {
    backgroundColor: Colors.canvas,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1CDC7',
  },
  caseChipSelected: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  caseChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.ink,
  },
  caseChipTextSelected: {
    color: Colors.white,
  },
});
