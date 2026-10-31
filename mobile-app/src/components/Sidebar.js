import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import {
  X,
  LayoutDashboard,
  FileSearch,
  Camera,
  CheckCircle2,
  ClipboardList,
  Building2,
  BadgeCheck,
  LogOut,
} from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

export const Sidebar = ({ isOpen, onClose, activeRoute, onNavigate }) => {
  const { user, userRole, logout, isAdmin, isOfficer, isSurveyor } = useAuth();

  if (!isOpen) return null;

  const navItems = [
    { key: 'Dashboard', label: 'GIS Command & Map', icon: LayoutDashboard, visible: true },
    { key: 'Investigations', label: 'Crime Investigations', icon: FileSearch, visible: isAdmin || isOfficer },
    { key: 'Cameras', label: 'CCTV Camera Directory', icon: Camera, visible: true },
    { key: 'Verification', label: 'Verification Queue', icon: CheckCircle2, visible: isAdmin },
    { key: 'MySurveys', label: 'My Field Surveys', icon: ClipboardList, visible: isSurveyor },
  ];

  const getRoleTag = () => {
    if (isAdmin) return 'ADMIN';
    if (isOfficer) return 'OFFICER';
    if (isSurveyor) return 'SURVEYOR';
    return 'OFFICIAL';
  };

  const handleNav = (routeKey) => {
    onNavigate(routeKey);
    onClose();
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Backdrop touchable */}
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        {/* Drawer Content */}
        <View style={styles.drawer}>
          <ScrollView contentContainerStyle={styles.drawerScroll} showsVerticalScrollIndicator={false}>
            {/* Header with Logo & Close button */}
            <View style={styles.header}>
              <View style={styles.brandRow}>
                <Image source={require('../../assets/police-logo.png')} style={styles.logo} resizeMode="contain" />
                <View>
                  <Text style={styles.brandTitle}>SurakshaNet</Text>
                  <Text style={styles.brandSubtitle}>Police Investigation GIS</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <X size={20} color={Colors.dust} />
              </TouchableOpacity>
            </View>

            {/* Profile Card */}
            <View style={styles.profileCard}>
              <View style={styles.userRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>
                    {user?.fullName?.charAt(0) || user?.username?.charAt(0)?.toUpperCase() || 'S'}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.userName} numberOfLines={1}>
                      {user?.fullName || 'System Administrator'}
                    </Text>
                    <BadgeCheck size={16} color={Colors.signal} />
                  </View>
                  <Text style={styles.userBadge}>Badge: @{user?.username || 'admin'}</Text>
                </View>
              </View>

              <View style={styles.jurisdictionBox}>
                <View style={styles.jurisdictionHeader}>
                  <Text style={styles.jurisdictionLabel}>JURISDICTION</Text>
                  <View style={styles.roleChip}>
                    <Text style={styles.roleChipText}>{getRoleTag()}</Text>
                  </View>
                </View>
                <View style={styles.stationRow}>
                  <Building2 size={15} color={Colors.signal} />
                  <Text style={styles.stationText} numberOfLines={1}>
                    {user?.policeStationName || user?.stationName || 'Nagpur Police Commissionerate HQ'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Section: Investigation Modules */}
            <View style={styles.moduleSection}>
              <View style={styles.sectionEyebrow}>
                <View style={styles.orangeDot} />
                <Text style={styles.sectionEyebrowText}>INVESTIGATION MODULES</Text>
              </View>

              <View style={styles.navList}>
                {navItems.filter((i) => i.visible).map((item) => {
                  const Icon = item.icon;
                  const isActive = activeRoute === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[styles.navItem, isActive && styles.navItemActive]}
                      onPress={() => handleNav(item.key)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.navItemLeft}>
                        <Icon size={18} color={isActive ? Colors.signal : Colors.dust} />
                        <Text style={[styles.navItemText, isActive && styles.navItemTextActive]}>
                          {item.label}
                        </Text>
                      </View>
                      {isActive && <View style={styles.activeDot} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Bottom Actions */}
            <View style={styles.bottomSection}>
              <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.85}>
                <LogOut size={18} color={Colors.white} />
                <Text style={styles.logoutText}>Exit & Sign Out</Text>
              </TouchableOpacity>

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>CCTNS POLICE GIS</Text>
                <Text style={styles.footerText}>v2.4 SECURE</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  backdrop: {
    flex: 1,
  },
  drawer: {
    width: Math.min(width * 0.85, 340),
    height: '100%',
    backgroundColor: Colors.ink,
    borderLeftWidth: 1,
    borderLeftColor: Colors.charcoal,
  },
  drawerScroll: {
    padding: 16,
    gap: 16,
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.charcoal,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 32,
    height: 32,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
  },
  brandSubtitle: {
    fontSize: 10,
    color: Colors.dust,
    fontFamily: 'monospace',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  profileCard: {
    backgroundColor: '#1C1C1A',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 14,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.ink,
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.white,
    flexShrink: 1,
  },
  userBadge: {
    fontSize: 11,
    color: Colors.dust,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  jurisdictionBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 16,
    padding: 12,
    gap: 6,
  },
  jurisdictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jurisdictionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.muted,
    letterSpacing: 0.5,
  },
  roleChip: {
    backgroundColor: 'rgba(207, 69, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(207, 69, 0, 0.4)',
  },
  roleChipText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.signal,
  },
  stationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stationText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
    flex: 1,
  },
  moduleSection: {
    gap: 10,
  },
  sectionEyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  orangeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.signal,
  },
  sectionEyebrowText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.dust,
    letterSpacing: 0.5,
  },
  navList: {
    gap: 6,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  navItemActive: {
    backgroundColor: Colors.white,
  },
  navItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dust,
  },
  navItemTextActive: {
    color: Colors.ink,
    fontWeight: '800',
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.signal,
  },
  bottomSection: {
    gap: 14,
    marginTop: 'auto',
    paddingTop: 16,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.signal,
    borderRadius: 22,
    paddingVertical: 14,
  },
  logoutText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  footerText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.slateGray,
    fontFamily: 'monospace',
  },
});
