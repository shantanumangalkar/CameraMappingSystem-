import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LayoutDashboard, FileSearch, Camera, CheckCircle2, ClipboardList } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

export const BottomNav = ({ activeRoute, onNavigate, onOpenProfile }) => {
  const { user, isAdmin, isOfficer, isSurveyor } = useAuth();

  const getTabs = () => {
    if (isSurveyor) {
      return [
        { key: 'Dashboard', label: 'GIS Map', icon: LayoutDashboard },
        { key: 'Cameras', label: 'Directory', icon: Camera },
        { key: 'MySurveys', label: 'Surveys', icon: ClipboardList },
      ];
    }
    if (isAdmin) {
      return [
        { key: 'Dashboard', label: 'Command', icon: LayoutDashboard },
        { key: 'Investigations', label: 'Cases', icon: FileSearch },
        { key: 'Cameras', label: 'Cameras', icon: Camera },
        { key: 'Verification', label: 'Verify', icon: CheckCircle2 },
      ];
    }
    return [
      { key: 'Dashboard', label: 'Live Map', icon: LayoutDashboard },
      { key: 'Investigations', label: 'Cases', icon: FileSearch },
      { key: 'Cameras', label: 'Cameras', icon: Camera },
    ];
  };

  const tabs = getTabs();

  return (
    <View style={styles.floatingContainer} pointerEvents="box-none">
      <View style={styles.pillBar}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeRoute === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabBtn}
              onPress={() => onNavigate(tab.key)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
                <Icon
                  size={18}
                  color={isActive ? Colors.white : Colors.muted}
                  strokeWidth={isActive ? 2.4 : 1.8}
                />
              </View>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Profile Trigger Button */}
        <TouchableOpacity style={styles.tabBtn} onPress={onOpenProfile} activeOpacity={0.8}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {user?.fullName?.charAt(0) || user?.username?.charAt(0)?.toUpperCase() || 'S'}
            </Text>
          </View>
          <Text style={styles.tabLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 16,
    right: 16,
    zIndex: 999,
    alignItems: 'center',
  },
  pillBar: {
    width: '100%',
    maxWidth: 440,
    height: 62,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 31,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E5DFD9',
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  tabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 54,
    paddingVertical: 4,
  },
  iconWrap: {
    padding: 6,
    borderRadius: 16,
  },
  iconWrapActive: {
    backgroundColor: Colors.ink,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.muted,
    marginTop: 2,
  },
  tabLabelActive: {
    color: Colors.ink,
    fontWeight: '800',
  },
  profileAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '900',
  },
});
