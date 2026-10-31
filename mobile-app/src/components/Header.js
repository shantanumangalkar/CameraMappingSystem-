import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/colors';
import { Shield, Bell, User } from 'lucide-react-native';

export const Header = ({ onProfilePress, userRole, policeStationName }) => {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={styles.logoWrapper}>
          <Image
            source={require('../../assets/police-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <View>
          <View style={styles.brandRow}>
            <Text style={styles.title}>SurakshaNet</Text>
            <View style={styles.tag}>
              <Text style={styles.tagText}>POLICE GIS</Text>
            </View>
          </View>
          <Text style={styles.subtitle} numberOfLines={1}>
            {policeStationName || 'Nagpur Police Commissionerate HQ'}
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        {onProfilePress && (
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={onProfilePress}
            activeOpacity={0.8}
          >
            <User size={18} color={Colors.ink} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  logoWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logo: {
    width: 28,
    height: 28,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.ink,
    letterSpacing: -0.3,
  },
  tag: {
    backgroundColor: Colors.canvas,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.ink,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    maxWidth: 200,
    marginTop: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
