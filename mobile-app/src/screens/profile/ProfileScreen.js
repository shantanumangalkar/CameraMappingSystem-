import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Shield, 
  User, 
  BadgeCheck, 
  Server, 
  Lock, 
  LogOut, 
  Building, 
  Phone, 
  Mail,
  Save,
  CheckCircle
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../theme/colors';
import { Card } from '../../components/Card';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { ENV } from '../../config/env';

export const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const { user, userRole, logout } = useAuth();
  const [customServerUrl, setCustomServerUrl] = useState('');
  const [isUrlSaved, setIsUrlSaved] = useState(false);

  useEffect(() => {
    const loadUrl = async () => {
      try {
        const stored = await AsyncStorage.getItem('@cctv_custom_api_url');
        if (stored) setCustomServerUrl(stored);
      } catch (err) {}
    };
    loadUrl();
  }, []);

  const handleSaveUrl = async () => {
    try {
      if (customServerUrl.trim()) {
        await AsyncStorage.setItem('@cctv_custom_api_url', customServerUrl.trim());
        setIsUrlSaved(true);
        Alert.alert(
          'API Endpoint Configured',
          'Server base URL saved. Please restart the app or reconnect if you changed the host address.'
        );
        setTimeout(() => setIsUrlSaved(false), 3000);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to save custom backend URL');
    }
  };

  const getRoleLabel = () => {
    if (userRole === 'ROLE_ADMIN') return 'SYSTEM ADMINISTRATOR';
    if (userRole === 'ROLE_POLICE_OFFICER') return 'POLICE PATROL & DETECTIVE';
    if (userRole === 'ROLE_SURVEY_PERSON') return 'FIELD SURVEYOR';
    return userRole || 'AUTHORIZED PERSONNEL';
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to end your active command session?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => logout()
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Command Profile"
        subtitle="Jurisdiction credentials and app config"
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* User Identity Card */}
        <Card style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarCircle}>
              <Shield size={32} color={Colors.signal} />
            </View>
            <View style={styles.identityInfo}>
              <Text style={styles.userName}>{user?.name || user?.username || 'Officer'}</Text>
              <View style={styles.roleTag}>
                <BadgeCheck size={14} color={Colors.white} />
                <Text style={styles.roleTagText}>{getRoleLabel()}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRows}>
            <View style={styles.detailRow}>
              <Building size={16} color={Colors.muted} />
              <Text style={styles.detailLabel}>Jurisdiction Station:</Text>
              <Text style={styles.detailValue}>{user?.policeStationName || user?.stationName || 'Nagpur Police Commissionerate HQ'}</Text>
            </View>

            <View style={styles.detailRow}>
              <User size={16} color={Colors.muted} />
              <Text style={styles.detailLabel}>Operator Login ID:</Text>
              <Text style={styles.detailValue}>{user?.username || 'admin'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Mail size={16} color={Colors.muted} />
              <Text style={styles.detailLabel}>Official Dispatch:</Text>
              <Text style={styles.detailValue}>{user?.email || 'command@police.gov.in'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Phone size={16} color={Colors.muted} />
              <Text style={styles.detailLabel}>Emergency Contact:</Text>
              <Text style={styles.detailValue}>{user?.phone || '+91 98765 43210'}</Text>
            </View>
          </View>
        </Card>

        {/* Server & Network Gateway Card */}
        <Card style={styles.networkCard}>
          <View style={styles.sectionHeader}>
            <Server size={18} color={Colors.ink} />
            <Text style={styles.sectionTitle}>Backend API Endpoint</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Current active host: <Text style={styles.activeHost}>{ENV.API_BASE_URL}</Text>
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.urlInput}
              placeholder="e.g. http://192.168.1.5:8088/api/v1"
              placeholderTextColor={Colors.muted}
              value={customServerUrl}
              onChangeText={setCustomServerUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.saveUrlBtn} onPress={handleSaveUrl}>
              {isUrlSaved ? <CheckCircle size={18} color={Colors.white} /> : <Save size={18} color={Colors.white} />}
            </TouchableOpacity>
          </View>
          <Text style={styles.inputHint}>
            To test on your physical phone over Wi-Fi, enter your PC's local IP address above.
          </Text>
        </Card>

        {/* Security & System Info */}
        <Card style={styles.securityCard}>
          <View style={styles.sectionHeader}>
            <Lock size={18} color={Colors.ink} />
            <Text style={styles.sectionTitle}>Security & Audit Standard</Text>
          </View>
          <Text style={styles.securityText}>
            • Session Token: Bearer JWT 256-bit encrypted{'\n'}
            • Protocol: Spring Boot REST Microservice (Port 8088){'\n'}
            • Architecture: Independent React Native Mobile Client{'\n'}
            • Database: PostgreSQL PostGIS Spatial Camera Nodes
          </Text>
        </Card>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <LogOut size={20} color={Colors.signal} />
          <Text style={styles.logoutBtnText}>Sign Out of Mobile Terminal</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  profileCard: {
    padding: 20,
    borderRadius: 28,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(207, 69, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(207, 69, 0, 0.2)',
  },
  identityInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.ink,
    marginBottom: 6,
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.ink,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleTagText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  detailRows: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.muted,
    fontWeight: '600',
    width: 140,
  },
  detailValue: {
    fontSize: 13,
    color: Colors.ink,
    fontWeight: '700',
    flex: 1,
  },
  networkCard: {
    padding: 20,
    borderRadius: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.ink,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.muted,
    marginBottom: 12,
  },
  activeHost: {
    fontWeight: '700',
    color: Colors.ink,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  urlInput: {
    flex: 1,
    backgroundColor: Colors.canvas,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.ink,
  },
  saveUrlBtn: {
    backgroundColor: Colors.ink,
    borderRadius: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputHint: {
    fontSize: 11,
    color: Colors.muted,
    marginTop: 8,
    lineHeight: 16,
  },
  securityCard: {
    padding: 20,
    borderRadius: 24,
  },
  securityText: {
    fontSize: 12,
    color: Colors.muted,
    lineHeight: 20,
    marginTop: 4,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: 'rgba(207, 69, 0, 0.3)',
    borderRadius: 22,
    paddingVertical: 14,
    marginTop: 8,
  },
  logoutBtnText: {
    color: Colors.signal,
    fontSize: 14,
    fontWeight: '800',
  },
});
