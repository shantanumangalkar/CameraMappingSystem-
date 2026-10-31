import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../theme/colors';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '../../components/Button';
import {
  CheckCircle2,
  XCircle,
  Camera,
  MapPin,
  User,
  ShieldCheck,
  Building2,
} from 'lucide-react-native';

export const VerificationQueueScreen = ({ navigation }) => {
  const { user, userRole } = useAuth();
  const [pendingCameras, setPendingCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const fetchPendingCameras = async () => {
    try {
      const res = await api.get('/cameras/pending');
      if (res?.data) {
        setPendingCameras(res.data);
      }
    } catch (err) {
      console.warn('Failed to load pending cameras', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPendingCameras();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPendingCameras();
  };

  const handleVerify = async (cameraId, action) => {
    setProcessingId(cameraId);
    try {
      const payload = {
        action, // 'APPROVE' or 'REJECT'
        rejectionReason: action === 'REJECT' ? 'Failed police precision survey check' : null,
      };
      const res = await api.post(`/cameras/${cameraId}/verify`, payload);
      if (res?.success) {
        Alert.alert(
          'Verification Updated',
          `Camera marked as ${action === 'APPROVE' ? 'APPROVED & ACTIVE' : 'REJECTED'}.`
        );
        fetchPendingCameras();
      }
    } catch (err) {
      Alert.alert('Action Failed', err.message || 'Verification update error.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        userRole={userRole}
        policeStationName={user?.policeStationName}
        onProfilePress={() => navigation.navigate('Profile')}
      />

      <FlatList
        data={pendingCameras}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.signalOrange} />
        }
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Card style={styles.bannerCard}>
            <View style={styles.eyebrowRow}>
              <View style={styles.eyebrowDot} />
              <Text style={styles.eyebrow}>ADMINISTRATIVE VERIFICATION QUEUE</Text>
            </View>
            <Text style={styles.bannerTitle}>Field Camera Approvals</Text>
            <Text style={styles.bannerSubtitle}>
              Review surveyor submissions, inspect geocoded nodes, and authorize live network feeds.
            </Text>
            <View style={styles.countTag}>
              <Text style={styles.countText}>{pendingCameras.length} PENDING AUTHORIZATION</Text>
            </View>
          </Card>
        }
        renderItem={({ item }) => (
          <Card style={styles.verifyCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cameraIconWrapper}>
                <Camera size={20} color={Colors.ink} />
              </View>
              <View style={styles.cameraDetails}>
                <Text style={styles.cameraName}>{item.cameraName}</Text>
                <View style={styles.locRow}>
                  <MapPin size={11} color={Colors.signalOrange} />
                  <Text style={styles.locText} numberOfLines={1}>
                    {item.locationName || item.landmark}
                  </Text>
                </View>
              </View>
              <StatusBadge status="PENDING_VERIFICATION" />
            </View>

            <View style={styles.metaBox}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Type / Model:</Text>
                <Text style={styles.metaValue}>{item.cameraType} • {item.resolution || '1080p'}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>GPS Coordinates:</Text>
                <Text style={styles.metaValueMono}>{item.latitude?.toFixed(4)}, {item.longitude?.toFixed(4)}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Surveyor:</Text>
                <Text style={styles.metaValue}>{item.createdByName || item.createdBy || 'Field Person'}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Custodian / Phone:</Text>
                <Text style={styles.metaValue}>{item.ownerName} ({item.ownerContactNumber || 'None'})</Text>
              </View>
            </View>

            <View style={styles.btnRow}>
              <Button
                title="Approve &amp; Activate"
                variant="primary"
                icon={CheckCircle2}
                onPress={() => handleVerify(item.id, 'APPROVE')}
                loading={processingId === item.id}
                style={{ flex: 1, marginRight: 8, paddingVertical: 10 }}
              />
              <Button
                title="Reject"
                variant="signal"
                icon={XCircle}
                onPress={() => handleVerify(item.id, 'REJECT')}
                disabled={processingId === item.id}
                style={{ paddingHorizontal: 14, paddingVertical: 10 }}
              />
            </View>
          </Card>
        )}
        ListEmptyComponent={
          !loading && (
            <Card style={styles.emptyCard}>
              <ShieldCheck size={36} color={Colors.emerald} style={{ marginBottom: 10 }} />
              <Text style={styles.emptyTitle}>Queue Clean &amp; Verified</Text>
              <Text style={styles.emptySubtitle}>
                No field cameras are currently awaiting police admin verification.
              </Text>
            </Card>
          )
        }
      />
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
    paddingBottom: 40,
  },
  bannerCard: {
    marginBottom: 14,
    padding: 16,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.signalOrange,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.6,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.ink,
  },
  bannerSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 3,
    lineHeight: 15,
  },
  countTag: {
    marginTop: 10,
    backgroundColor: Colors.canvas,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  countText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.signalOrange,
  },
  verifyCard: {
    marginBottom: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  cameraIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cameraDetails: {
    flex: 1,
  },
  cameraName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.ink,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  locText: {
    fontSize: 11,
    color: Colors.textSecondary,
    flex: 1,
  },
  metaBox: {
    backgroundColor: Colors.canvas,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.ink,
  },
  metaValueMono: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: Colors.blue,
    fontWeight: '700',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.ink,
  },
  emptySubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});
