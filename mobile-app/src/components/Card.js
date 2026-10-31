import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

export const Card = ({ children, style, dark = false }) => {
  return (
    <View
      style={[
        styles.card,
        dark ? styles.darkCard : styles.lightCard,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 16,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  lightCard: {
    backgroundColor: Colors.lifted,
    borderColor: Colors.border,
  },
  darkCard: {
    backgroundColor: Colors.ink,
    borderColor: Colors.borderDark,
  },
});
