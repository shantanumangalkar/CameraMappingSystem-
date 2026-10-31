import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

export const StatusBadge = ({ status }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'ACTIVE':
      case 'ONLINE':
      case 'RESOLVED':
      case 'APPROVED':
        return {
          label: status,
          bg: Colors.tintGreen,
          text: Colors.emerald,
          border: 'rgba(16, 185, 129, 0.25)',
          dot: Colors.emerald,
        };
      case 'OFFLINE':
      case 'REJECTED':
      case 'CRITICAL':
        return {
          label: status,
          bg: Colors.tintOrange,
          text: Colors.signalOrange,
          border: 'rgba(207, 69, 0, 0.25)',
          dot: Colors.signalOrange,
        };
      case 'PENDING_VERIFICATION':
      case 'PENDING':
      case 'IN_PROGRESS':
        return {
          label: status === 'PENDING_VERIFICATION' ? 'PENDING' : status,
          bg: Colors.tintAmber,
          text: Colors.amber,
          border: 'rgba(245, 158, 11, 0.25)',
          dot: Colors.amber,
        };
      default:
        return {
          label: status || 'UNKNOWN',
          bg: Colors.canvas,
          text: Colors.textSecondary,
          border: Colors.border,
          dot: Colors.textMuted,
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <View style={[styles.badge, { backgroundColor: config.bg, borderColor: config.border }]}>
      <View style={[styles.dot, { backgroundColor: config.dot }]} />
      <Text style={[styles.label, { color: config.text }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 0.2,
  },
});
