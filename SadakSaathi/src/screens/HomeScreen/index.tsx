import React, { useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import MorningBrief from './components/MorningBrief';
import DetectionToggle from './components/DetectionToggle';
import HazardSummaryCard from './components/HazardSummaryCard';
import LocationService from '../../services/LocationService';
import AccelerometerService from '../../services/AccelerometerService';
import { useNearbyHazards } from '../../hooks/useNearbyHazards';
import { useDetectionStore } from '../../store/useDetectionStore';
import { useLocationStore } from '../../store/useLocationStore';
import { useHazardStore } from '../../store/useHazardStore';

export default function HomeScreen() {
  const accelEnabled = useDetectionStore(s => s.accelEnabled);
  const accelMagnitude = useDetectionStore(s => s.accelMagnitude);
  const impactCount = useDetectionStore(s => s.impactCount);
  const { lat, lon } = useLocationStore();
  const { hazards } = useHazardStore();

  useNearbyHazards();

  useEffect(() => {
    void LocationService.start();
    if (accelEnabled) AccelerometerService.start();
    return () => {
      LocationService.stop();
      AccelerometerService.stop();
    };
  }, []);

  const s3Count = hazards.filter(h => h.severity === 'S3' || h.severity === 'S3+').length;
  const s2Count = hazards.filter(h => h.severity === 'S2').length;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>SADAK <Text style={styles.logoAccent}>SAATHI</Text></Text>
          <Text style={styles.logoSub}>Delhi Road Intelligence</Text>
        </View>
        <View style={[styles.liveIndicator, accelEnabled && styles.liveIndicatorActive]}>
          <Text style={styles.liveText}>{accelEnabled ? '● LIVE' : '○ OFF'}</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <MorningBrief />

        {/* Live sensor strip */}
        <View style={styles.sensorStrip}>
          <View style={styles.sensorItem}>
            <Text style={styles.sensorLabel}>GPS</Text>
            <Text style={styles.sensorValue}>
              {lat ? `${lat.toFixed(4)}, ${lon?.toFixed(4)}` : 'Acquiring…'}
            </Text>
          </View>
          <View style={styles.sensorDivider} />
          <View style={styles.sensorItem}>
            <Text style={styles.sensorLabel}>ACCEL</Text>
            <Text style={[
              styles.sensorValue,
              accelMagnitude > 12 && { color: '#EF4444' },
              accelMagnitude > 8  && accelMagnitude <= 12 && { color: '#F97316' },
            ]}>
              {accelMagnitude.toFixed(2)} m/s²
            </Text>
          </View>
          <View style={styles.sensorDivider} />
          <View style={styles.sensorItem}>
            <Text style={styles.sensorLabel}>IMPACTS</Text>
            <Text style={styles.sensorValue}>{impactCount} today</Text>
          </View>
        </View>

        {/* Quick stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, s3Count > 0 && styles.statCardDanger]}>
            <Text style={[styles.statBig, s3Count > 0 && { color: '#EF4444' }]}>{s3Count}</Text>
            <Text style={styles.statDesc}>Critical{'\n'}Potholes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statBig, { color: '#F97316' }]}>{s2Count}</Text>
            <Text style={styles.statDesc}>Moderate{'\n'}Hazards</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statBig, { color: '#F59E0B' }]}>{hazards.length}</Text>
            <Text style={styles.statDesc}>Total In{'\n'}500m</Text>
          </View>
        </View>

        <DetectionToggle />
        <HazardSummaryCard />

        {/* Info footer */}
        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>HOW IT WORKS</Text>
          <Text style={styles.footerText}>
            Your accelerometer detects pothole impacts automatically while you ride.
            Camera mode uses Overshoot AI to visually detect hazards 4-5 seconds ahead.
            Every detection is reported and clustered to build Delhi's most accurate road map.
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0A' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#1C1C1C',
  },
  logo: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 3 },
  logoAccent: { color: '#F97316' },
  logoSub: { color: '#444', fontSize: 10, fontFamily: 'monospace', letterSpacing: 1, marginTop: 2 },
  liveIndicator: {
    backgroundColor: '#1C1C1C', borderRadius: 12, paddingHorizontal: 10,
    paddingVertical: 4, borderWidth: 1, borderColor: '#333',
  },
  liveIndicatorActive: { borderColor: '#F97316', backgroundColor: '#1A0800' },
  liveText: { color: '#F97316', fontSize: 10, fontFamily: 'monospace' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  sensorStrip: {
    flexDirection: 'row', backgroundColor: '#0F0F0F',
    borderRadius: 10, borderWidth: 1, borderColor: '#1E1E1E',
    marginBottom: 16, overflow: 'hidden',
  },
  sensorItem: { flex: 1, padding: 12, alignItems: 'center' },
  sensorLabel: { color: '#444', fontSize: 8, letterSpacing: 2, fontFamily: 'monospace', marginBottom: 4 },
  sensorValue: { color: '#888', fontSize: 10, fontFamily: 'monospace', textAlign: 'center' },
  sensorDivider: { width: 1, backgroundColor: '#1E1E1E', marginVertical: 8 },
  statsGrid: {
    flexDirection: 'row', gap: 10, marginBottom: 16,
  },
  statCard: {
    flex: 1, backgroundColor: '#111', borderRadius: 10,
    borderWidth: 1, borderColor: '#1E1E1E', padding: 14,
  },
  statCardDanger: { borderColor: '#EF4444', backgroundColor: '#1A0808' },
  statBig: { color: '#fff', fontSize: 30, fontWeight: '900', lineHeight: 34 },
  statDesc: { color: '#555', fontSize: 9, letterSpacing: 1, fontFamily: 'monospace', marginTop: 4 },
  footerCard: {
    backgroundColor: '#111', borderRadius: 10,
    borderWidth: 1, borderColor: '#1E1E1E', padding: 16, marginTop: 4,
  },
  footerTitle: {
    color: '#444', fontSize: 9, letterSpacing: 3,
    fontFamily: 'monospace', marginBottom: 10,
  },
  footerText: {
    color: '#555', fontSize: 12, lineHeight: 20, fontFamily: 'monospace',
  },
});