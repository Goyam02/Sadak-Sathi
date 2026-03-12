import React, { useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, StatusBar } from 'react-native';
import MorningBrief from './components/MorningBrief';
import DetectionToggle from './components/DetectionToggle';
import HazardSummaryCard from './components/HazardSummaryCard';
import LocationService from '../../services/LocationService';
import AccelerometerService from '../../services/AccelerometerService';
import { useNearbyHazards } from '../../hooks/useNearbyHazards';
import { useDetectionStore } from '../../store/useDetectionStore';

export default function HomeScreen() {
  const accelEnabled = useDetectionStore(s => s.accelEnabled);

  // Start location + hazard polling
  useNearbyHazards();

  useEffect(() => {
    LocationService.start();
    if (accelEnabled) AccelerometerService.start();
    return () => {
      LocationService.stop();
      AccelerometerService.stop();
    };
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <View style={styles.header}>
        <Text style={styles.logo}>SADAK</Text>
        <Text style={styles.logoAccent}>SAATHI</Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <MorningBrief />
        <DetectionToggle />
        <HazardSummaryCard />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1C',
  },
  logo: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 4,
  },
  logoAccent: {
    color: '#F97316',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 4,
    marginLeft: 6,
  },
  scroll: { flex: 1 },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
});
