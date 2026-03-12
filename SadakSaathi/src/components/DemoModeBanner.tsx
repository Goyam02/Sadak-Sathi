import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useDemoStore } from '../store/useDemoStore';

export default function DemoModeBanner() {
  const { isDemoMode, toggleMode } = useDemoStore();

  return (
    <TouchableOpacity
      style={[styles.banner, isDemoMode ? styles.bannerDemo : styles.bannerLive]}
      onPress={toggleMode}
      activeOpacity={0.8}
    >
      <View style={[styles.dot, isDemoMode ? styles.dotDemo : styles.dotLive]} />
      <Text style={[styles.label, isDemoMode ? styles.labelDemo : styles.labelLive]}>
        {isDemoMode ? 'DEMO MODE' : 'LIVE MODE'}
      </Text>
      <Text style={styles.tap}>tap to switch →</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
  },
  bannerDemo: { backgroundColor: '#1A1400' },
  bannerLive: { backgroundColor: '#001A0A' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotDemo: { backgroundColor: '#F59E0B' },
  dotLive: { backgroundColor: '#22C55E' },
  label: { fontSize: 9, fontFamily: 'monospace', fontWeight: '700', letterSpacing: 2 },
  labelDemo: { color: '#F59E0B' },
  labelLive: { color: '#22C55E' },
  tap: { color: '#444', fontSize: 9, fontFamily: 'monospace', marginLeft: 'auto' },
});
