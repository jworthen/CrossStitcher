import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DmcColor, FlossStatus } from '../data/dmcColors';

interface Props {
  color: DmcColor;
  status: FlossStatus;
  onPress: () => void;
}

const STATUS_CONFIG: Record<FlossStatus, { label: string; bg: string; text: string }> = {
  unowned: { label: '—', bg: '#F0F0F0', text: '#999999' },
  in_stock: { label: '✓', bg: '#D4EDDA', text: '#28A745' },
  low: { label: '!', bg: '#FFF3CD', text: '#856404' },
};

export function FlossItem({ color, status, onPress }: Props) {
  const config = STATUS_CONFIG[status];

  // Determine if swatch needs a dark border (for very light colors)
  const isLight = isLightColor(color.hex);

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View
        style={[
          styles.swatch,
          { backgroundColor: color.hex },
          isLight && styles.swatchBorder,
        ]}
      />
      <View style={styles.info}>
        <Text style={styles.number}>{color.number}</Text>
        <Text style={styles.name} numberOfLines={1}>
          {color.name}
        </Text>
      </View>
      <View style={[styles.badge, { backgroundColor: config.bg }]}>
        <Text style={[styles.badgeText, { color: config.text }]}>{config.label}</Text>
      </View>
    </TouchableOpacity>
  );
}

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 220;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 6,
    marginRight: 12,
  },
  swatchBorder: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  info: {
    flex: 1,
  },
  number: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  name: {
    fontSize: 12,
    color: '#666666',
    marginTop: 1,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
