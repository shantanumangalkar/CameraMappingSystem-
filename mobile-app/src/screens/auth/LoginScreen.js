import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../theme/colors';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { User, Lock, ArrowRight, ShieldCheck, Target, Video, AlertCircle } from 'lucide-react-native';

export const LoginScreen = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const { login, authActionLoading } = useAuth();

  const handleLogin = async () => {
    setError('');
    const res = await login(username, password);
    if (!res.success) {
      setError(res.message);
    }
  };

  const fillQuick = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Top Government Official Strip */}
        <View style={styles.govStrip}>
          <Text style={styles.govText}>
            🇮🇳 Govt of India • National Police GIS &amp; CCTNS Command
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Top Visual Command Banner */}
          <View style={styles.heroBanner}>
            <Image
              source={require('../../../assets/police-command-hero.jpg')}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={styles.heroOverlay} />

            <View style={styles.heroContent}>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>LIVE GIS RADAR</Text>
              </View>
              <View style={styles.cctnsTag}>
                <Text style={styles.cctnsTagText}>CCTNS v2.4</Text>
              </View>
            </View>
          </View>

          {/* Overlapping Floating Stadium Login Card */}
          <View style={styles.cardContainer}>
            {/* Police Department Shield Crest */}
            <View style={styles.emblemWrapper}>
              <Image
                source={require('../../../assets/police-logo.png')}
                style={styles.emblem}
                resizeMode="contain"
              />
            </View>

            <View style={styles.headerText}>
              <View style={styles.eyebrowRow}>
                <View style={styles.eyebrowDot} />
                <Text style={styles.eyebrow}>POLICE GIS PORTAL</Text>
              </View>
              <Text style={styles.title}>Officer Login</Text>
              <Text style={styles.subtitle}>Authorized Law Enforcement Access Only</Text>
            </View>

            {/* Error message */}
            {error ? (
              <View style={styles.errorBox}>
                <AlertCircle size={16} color={Colors.signalOrange} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Inputs */}
            <Input
              label="Username / Badge ID"
              value={username}
              onChangeText={setUsername}
              placeholder="Enter badge username"
              icon={User}
            />

            <Input
              label="Secret Passcode"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              icon={Lock}
            />

            <Button
              title="Sign In to Investigation Command"
              onPress={handleLogin}
              loading={authActionLoading}
              icon={ArrowRight}
              style={styles.signInBtn}
            />

            {/* Quick Demo Access Roles */}
            <View style={styles.demoSection}>
              <Text style={styles.demoTitle}>QUICK DEMO ACCESS ROLES</Text>
              <View style={styles.demoRolesRow}>
                <TouchableOpacity
                  style={[styles.roleChip, username === 'admin' && styles.roleChipActive]}
                  onPress={() => fillQuick('admin', 'admin123')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.roleChipText, { color: Colors.ink }]}>Admin</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleChip, username === 'officer1' && styles.roleChipActive]}
                  onPress={() => fillQuick('officer1', 'officer123')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.roleChipText, { color: Colors.blue }]}>Officer</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleChip, username === 'surveyor1' && styles.roleChipActive]}
                  onPress={() => fillQuick('surveyor1', 'surveyor123')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.roleChipText, { color: Colors.amber }]}>Surveyor</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.disclaimer}>
              <Text style={styles.disclaimerText}>
                Classified Law Enforcement Access • BNS 2023 &amp; IT Act Sec 66
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.ink,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  govStrip: {
    backgroundColor: Colors.ink,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.charcoal,
  },
  govText: {
    color: Colors.textLight,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroBanner: {
    height: 140,
    width: '100%',
    position: 'relative',
    backgroundColor: Colors.ink,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 20, 19, 0.65)',
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.signalOrange,
  },
  statusText: {
    color: Colors.surface,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cctnsTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  cctnsTagText: {
    color: Colors.textLight,
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  cardContainer: {
    flex: 1,
    backgroundColor: Colors.lifted,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -28,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  emblemWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surface,
    alignSelf: 'center',
    marginTop: -32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emblem: {
    width: 44,
    height: 44,
  },
  headerText: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  eyebrowDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.signalOrange,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.ink,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDF0EE',
    borderWidth: 1,
    borderColor: '#F8C6BC',
    borderRadius: 16,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    color: Colors.signalOrange,
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  signInBtn: {
    marginTop: 6,
    paddingVertical: 14,
  },
  demoSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  demoTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  demoRolesRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  roleChip: {
    flex: 1,
    paddingVertical: 9,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleChipActive: {
    borderColor: Colors.ink,
    backgroundColor: Colors.canvas,
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  disclaimer: {
    marginTop: 20,
    alignItems: 'center',
  },
  disclaimerText: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
