import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Menu, X } from 'lucide-react-native';
import { Colors } from '../theme/colors';

export const Navbar = ({ onToggleSidebar, isSidebarOpen }) => {
  return (
    <View style={styles.container}>
      <View style={styles.navPill}>
        {/* Left: Police Emblem + SurakshaNet Title */}
        <View style={styles.brandRow}>
          <Image
            source={require('../../assets/police-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brandTitle}>SurakshaNet</Text>
          <View style={styles.policeGisTag}>
            <Text style={styles.policeGisText}>POLICE GIS</Text>
          </View>
        </View>

        {/* Right: Hamburger Menu Button */}
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={onToggleSidebar}
          activeOpacity={0.8}
          accessibilityLabel="Toggle Navigation Sidebar"
        >
          {isSidebarOpen ? (
            <X size={20} color={Colors.signal} />
          ) : (
            <Menu size={20} color={Colors.ink} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    backgroundColor: Colors.canvas,
    zIndex: 100,
  },
  navPill: {
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 34,
    height: 34,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.ink,
    letterSpacing: -0.3,
  },
  policeGisTag: {
    backgroundColor: Colors.canvas,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  policeGisText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.ink,
    letterSpacing: 0.5,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.canvas,
  },
});
