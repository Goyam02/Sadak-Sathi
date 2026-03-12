import React, { useEffect, useRef } from 'react';
import {
  View, ScrollView, Text, StyleSheet,
  StatusBar, Animated, TouchableOpacity,
} from 'react-native';
import MorningBrief from './components/MorningBrief';
import DetectionToggle from './components/DetectionToggle';
import HazardSummaryCard from './components/HazardSummaryCard';
import DemoModeBanner from '../../components/DemoModeBanner';
import LocationService from '../../services/LocationService';
import AccelerometerService from '../../services/AccelerometerService';
import { useNearbyHazards } from '../../hooks/useNearbyHazards';
import { useDetectionStore } from '../../store/useDetectionStore';
import { useLocationStore } from '../../store/useLocationStore';
import { useHazardStore } from '../../store/useHazardStore';
import { useDemoStore, DEMO_HAZARDS, DEMO_LOCATION, DEMO_ACCEL_SEQUENCE, DEMO_MORNING_BRIEF } from '../../store/useDemoStore';
import { severityColor } from '../../utils/impactClassifier';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';

export default function HomeScreen() {
  const { isDemoMode } = useDemoStore();
  const accelEnabled = useDetectionStore(s => s.accelEnabled);
  const { setAccelMagnitude, recordImpact } = useDetectionStore();
  const accelMagnitude = useDetectionStore(s => s.accelMagnitude);
  const impactCount = useDetectionStore(s => s.impactCount);
  const { lat, lon, setLocation } = useLocationStore();
  const { hazards, setHazards } = useHazardStore();
  const accelIdxRef = useRef(0);
  const impactFlash = useRef(new Animated.Value(0)).current;

  useNearbyHazards();

  useEffect(() => {
    if (isDemoMode) return;
    void LocationService.start();
    if (accelEnabled) AccelerometerService.start();
    return () => { LocationService.stop(); AccelerometerService.stop(); };
  }, [isDemoMode]);

  useEffect(() => {
    if (!isDemoMode) return;
    setLocation(DEMO_LOCATION.lat, DEMO_LOCATION.lon);
    setHazards(DEMO_HAZARDS);
    const interval = setInterval(() => {
      const mag = DEMO_ACCEL_SEQUENCE[accelIdxRef.current % DEMO_ACCEL_SEQUENCE.length];
      setAccelMagnitude(mag);
      if (mag > 12) {
        recordImpact();
        Animated.sequence([
          Animated.timing(impactFlash, { toValue: 1, duration: 80, useNativeDriver: true }),
          Animated.timing(impactFlash, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]).start();
      }
      accelIdxRef.current++;
    }, 300);
    return () => clearInterval(interval);
  }, [isDemoMode]);

  const displayHazards = isDemoMode ? DEMO_HAZARDS : hazards;
  const s3Count = displayHazards.filter(h => h.severity === 'S3' || h.severity === 'S3+').length;
  const s2Count = displayHazards.filter(h => h.severity === 'S2').length;
  const displayLat = isDemoMode ? DEMO_LOCATION.lat : lat;
  const displayLon = isDemoMode ? DEMO_LOCATION.lon : lon;

  const flashBg = impactFlash.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(239,68,68,0)', 'rgba(239,68,68,0.15)'],
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>SADAK <Text style={styles.logoAccent}>SAATHI</Text></Text>
          <Text style={styles.logoSub}>Delhi Road Intelligence Network</Text>
        </View>
        <View style={[styles.pill, accelEnabled && styles.pillActive]}>
          <Text style={styles.pillText}>{accelEnabled ? '● LIVE' : '○ OFF'}</Text>
        </View>
      </View>

      <DemoModeBanner />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Morning brief */}
        <View style={styles.briefCard}>
          <Text style={styles.briefLabel}>MORNING BRIEF</Text>
          <Text style={styles.briefTime}>
            {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {isDemoMode ? (
            <View style={styles.briefRows}>
              <BriefRow icon="⚠" text={`${DEMO_MORNING_BRIEF.newOvernightPotholes} new potholes overnight near Lajpat Nagar`} color="#F97316" />
              <BriefRow icon="🌧" text={DEMO_MORNING_BRIEF.rainForecast} color="#60A5FA" />
              <BriefRow icon="🚦" text={DEMO_MORNING_BRIEF.trafficAlert} color="#F59E0B" />
              <BriefRow icon="✓" text={`Recommended: Leave at ${DEMO_MORNING_BRIEF.recommendedLeaveTime}`} color="#22C55E" />
              <BriefRow icon="↗" text={DEMO_MORNING_BRIEF.alternateRoute} color="#A78BFA" />
            </View>
          ) : (
            <Text style={styles.liveNote}>
              {displayHazards.length === 0
                ? '✓  Route looks clear'
                : `⚠  ${s3Count > 0 ? `${s3Count} critical hazards nearby` : `${displayHazards.length} hazards in range`}`}
            </Text>
          )}
        </View>

        {/* Sensor strip */}
        <Animated.View style={[styles.sensorStrip, { backgroundColor: flashBg }]}>
          <View style={styles.sensorItem}>
            <Text style={styles.sensorLabel}>GPS</Text>
            <Text style={styles.sensorValue} numberOfLines={1}>
              {displayLat ? `${displayLat.toFixed(4)}, ${displayLon?.toFixed(4)}` : 'Acquiring…'}
            </Text>
          </View>
          <View style={styles.sensorDivider} />
          <View style={styles.sensorItem}>
            <Text style={styles.sensorLabel}>ACCEL</Text>
            <Text style={[
              styles.sensorValue,
              accelMagnitude > 15 && { color: '#EF4444', fontWeight: '700' },
              accelMagnitude > 12 && accelMagnitude <= 15 && { color: '#F97316' },
            ]}>
              {accelMagnitude.toFixed(2)} m/s²
            </Text>
          </View>
          <View style={styles.sensorDivider} />
          <View style={styles.sensorItem}>
            <Text style={styles.sensorLabel}>IMPACTS</Text>
            <Text style={[styles.sensorValue, impactCount > 0 && { color: '#F97316' }]}>
              {impactCount} today
            </Text>
          </View>
        </Animated.View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, s3Count > 0 && styles.statCardDanger]}>
            <Text style={[styles.statBig, s3Count > 0 && { color: '#EF4444' }]}>{s3Count}</Text>
            <Text style={styles.statDesc}>Critical{'\n'}S3</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statBig, { color: '#F97316' }]}>{s2Count}</Text>
            <Text style={styles.statDesc}>Moderate{'\n'}S2</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statBig, { color: '#F59E0B' }]}>{displayHazards.length}</Text>
            <Text style={styles.statDesc}>Total{'\n'}500m</Text>
          </View>
        </View>

        <DetectionToggle />

        {/* Hazard list */}
        <View style={styles.hazardCard}>
          <Text style={styles.sectionLabel}>
            NEARBY HAZARDS{isDemoMode ? ' — DEMO DATA' : ''}
          </Text>
          {displayHazards.slice(0, 5).map(h => {
            const color = severityColor(h.severity);
            return (
              <HazardRow key={h.id} h={h} color={color} />
            );
          })}
          {displayHazards.length === 0 && (
            <Text style={styles.emptyText}>No hazards in range</Text>
          )}
        </View>

        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>HOW IT WORKS</Text>
          <Text style={styles.footerText}>
            Accelerometer detects pothole impacts automatically while you ride.
            Camera mode uses Overshoot AI to detect hazards 4–5 seconds ahead.
            Every detection is reported and clustered to build Delhi's most accurate road map.
            Contractors are automatically notified of warranty breaches.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function BriefRow({ icon, text, color }: { icon: string; text: string; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
      <Text style={{ fontSize: 13, width: 20 }}>{icon}</Text>
      <Text style={{ flex: 1, fontSize: 11, fontFamily: 'monospace', lineHeight: 18, color }}>{text}</Text>
    </View>
  );
}

function HazardRow({ h, color }: { h: any; color: string }) {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <TouchableOpacity
      style={styles.hRow}
      onPress={() => nav.navigate('HazardDetail', { hazardId: h.id })}
    >
      <View style={[styles.hDot, { backgroundColor: color }]} />
      <View style={styles.hInfo}>
        <Text style={styles.hType}>{h.type?.replace(/_/g, ' ').toUpperCase()}</Text>
        <Text style={styles.hCoords}>{h.lat.toFixed(4)}, {h.lon.toFixed(4)}</Text>
      </View>
      <Text style={[styles.hSev, { color }]}>{h.severity}</Text>
      <Text style={styles.hArrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0A' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#1C1C1C',
  },
  logo: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 3 },
  logoAccent: { color: '#F97316' },
  logoSub: { color: '#444', fontSize: 9, fontFamily: 'monospace', letterSpacing: 1, marginTop: 2 },
  pill: { backgroundColor: '#1C1C1C', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#333' },
  pillActive: { borderColor: '#22C55E', backgroundColor: '#001A0A' },
  pillText: { color: '#22C55E', fontSize: 10, fontFamily: 'monospace' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32, gap: 12 },
  briefCard: { backgroundColor: '#111', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#F97316' + '55' },
  briefLabel: { color: '#F97316', fontSize: 9, letterSpacing: 3, fontFamily: 'monospace', marginBottom: 4 },
  briefTime: { color: '#fff', fontSize: 30, fontWeight: '700', letterSpacing: -1, marginBottom: 14 },
  briefRows: {},
  liveNote: { color: '#F59E0B', fontSize: 12, fontFamily: 'monospace' },
  sensorStrip: { flexDirection: 'row', backgroundColor: '#0F0F0F', borderRadius: 10, borderWidth: 1, borderColor: '#1E1E1E', overflow: 'hidden' },
  sensorItem: { flex: 1, padding: 12, alignItems: 'center' },
  sensorLabel: { color: '#444', fontSize: 8, letterSpacing: 2, fontFamily: 'monospace', marginBottom: 4 },
  sensorValue: { color: '#888', fontSize: 10, fontFamily: 'monospace', textAlign: 'center' },
  sensorDivider: { width: 1, backgroundColor: '#1E1E1E', marginVertical: 8 },
  statsGrid: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: '#111', borderRadius: 10, borderWidth: 1, borderColor: '#1E1E1E', padding: 14 },
  statCardDanger: { borderColor: '#EF4444', backgroundColor: '#1A0808' },
  statBig: { color: '#fff', fontSize: 30, fontWeight: '900', lineHeight: 34 },
  statDesc: { color: '#555', fontSize: 9, letterSpacing: 1, fontFamily: 'monospace', marginTop: 4 },
  hazardCard: { backgroundColor: '#111', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#1E1E1E' },
  sectionLabel: { color: '#444', fontSize: 9, letterSpacing: 3, fontFamily: 'monospace', marginBottom: 12 },
  hRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1A1A1A', gap: 10 },
  hDot: { width: 8, height: 8, borderRadius: 4 },
  hInfo: { flex: 1 },
  hType: { color: '#ccc', fontSize: 12, fontWeight: '600' },
  hCoords: { color: '#444', fontSize: 9, fontFamily: 'monospace' },
  hSev: { fontSize: 10, fontFamily: 'monospace', fontWeight: '700' },
  hArrow: { color: '#333', fontSize: 18 },
  emptyText: { color: '#333', fontFamily: 'monospace', fontSize: 12 },
  footerCard: { backgroundColor: '#111', borderRadius: 10, borderWidth: 1, borderColor: '#1E1E1E', padding: 16 },
  footerTitle: { color: '#444', fontSize: 9, letterSpacing: 3, fontFamily: 'monospace', marginBottom: 10 },
  footerText: { color: '#555', fontSize: 11, lineHeight: 20, fontFamily: 'monospace' },
});
