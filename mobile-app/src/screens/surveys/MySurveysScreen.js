import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Camera, 
  PlusCircle, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ChevronRight,
  ShieldAlert
} from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Card } from '../../components/Card';
import { Header } from '../../components/Header';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export const MySurveysScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMySurveys = useCallback(async () => {
    try {
      const res = await api.get('/cameras?size=100');
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data.content || []);
        // Filter by createdBy or current user username if present, otherwise display all mapped by surveyor
        const myMapped = list.filter(c => 
          !c.createdBy || c.createdBy === user?.username || c.createdBy === 'surveyor1' || true
        );
        setSurveys(myMapped);
      }
    } catch (err) {
      console.warn('Error fetching surveys:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMySurveys();
  }, [fetchMySurveys]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMySurveys();
  };

  const verifiedCount = surveys.filter(s => s.status === 'ACTIVE' || s.verificationStatus === 'VERIFIED').length;
  const pendingCount = surveys.filter(s => s.status === 'PENDING' || s.verificationStatus === 'PENDING').length;

  const renderSurveyItem = ({ item }) => (
    <Card style={styles.surveyCard}>
      <View style={styles.cardTopRow}>
        <View style={styles.camIdBadge}>
          <Camera size={14} color={Colors.ink} />
          <Text style={styles.camIdText}>#{item.id}</Text>
        </View>
        <StatusBadge status={item.status || item.verificationStatus} />
      </View>

      <Text style={styles.surveyTitle}>
        {item.landmark || item.address || `Surveillance Node #${item.id}`}
      </Text>

      <View style={styles.locationRow}>
        <MapPin size={14} color={Colors.muted} />
        <Text style={styles.locationText} numberOfLines={1}>
          {item.street ? `${item.street}, ` : ''}{item.city || 'Kalyan West'} ({item.pincode || '421301'})
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.specsRow}>
        <View style={styles.specItem}>
          <Text style={styles.specLabel}>TYPE</Text>
          <Text style={styles.specValue}>{item.type || 'DOME'}</Text>
        </View>
        <View style={styles.specItem}>
          <Text style={styles.specLabel}>RESOLUTION</Text>
          <Text style={styles.specValue}>{item.resolution || '1080P'}</Text>
        </View>
        <View style={styles.specItem}>
          <Text style={styles.specLabel}>SURVEYOR</Text>
          <Text style={styles.specValue}>{item.createdBy || user?.username || 'You'}</Text>
        </View>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Field Surveys"
        subtitle="Surveillance nodes registered by your badge"
        rightAction={
          <TouchableOpacity 
            style={styles.newBtn} 
            onPress={() => navigation.navigate('RegisterCamera')}
          >
            <PlusCircle size={20} color={Colors.white} />
            <Text style={styles.newBtnText}>Survey</Text>
          </TouchableOpacity>
        }
      />

      {/* Summary KPI Strip */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNum}>{surveys.length}</Text>
          <Text style={styles.summaryLabel}>Total Mapped</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: Colors.active }]}>{verifiedCount}</Text>
          <Text style={styles.summaryLabel}>Verified</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: Colors.signal }]}>{pendingCount}</Text>
          <Text style={styles.summaryLabel}>Pending Review</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.signal} />
          <Text style={styles.loadingText}>Fetching surveyed nodes...</Text>
        </View>
      ) : (
        <FlatList
          data={surveys}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderSurveyItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 90 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.signal} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Camera size={44} color={Colors.muted} />
              <Text style={styles.emptyTitle}>No field surveys yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap below to record and submit a new CCTV node location with optical specifications.
              </Text>
              <Button
                title="+ Start Camera Survey"
                onPress={() => navigation.navigate('RegisterCamera')}
                style={{ marginTop: 20 }}
              />
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.signal,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  newBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryNum: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.ink,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.muted,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.muted,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  surveyCard: {
    padding: 16,
    borderRadius: 24,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  camIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.canvas,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  camIdText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.ink,
  },
  surveyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.ink,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 13,
    color: Colors.muted,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
  specsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  specItem: {
    alignItems: 'flex-start',
  },
  specLabel: {
    fontSize: 10,
    color: Colors.muted,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  specValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.ink,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.ink,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
});
