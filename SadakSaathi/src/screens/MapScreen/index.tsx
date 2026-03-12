import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useHazardStore } from '../../store/useHazardStore';
import { useLocationStore } from '../../store/useLocationStore';
import { severityColor } from '../../utils/impactClassifier';
import { GOOGLE_MAPS_API_KEY } from '@env';

export default function MapScreen() {
  const { hazards, isLoading } = useHazardStore();
  const { lat, lon } = useLocationStore();

  const region = lat && lon
    ? { latitude: lat, longitude: lon, latitudeDelta: 0.01, longitudeDelta: 0.01 }
    : { latitude: 28.6139, longitude: 77.2090, latitudeDelta: 0.05, longitudeDelta: 0.05 };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>HAZARD MAP</Text>
        {isLoading && <ActivityIndicator color="#F97316" size="small" />}
      </View>

      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        showsUserLocation
        showsMyLocationButton
        customMapStyle={darkMapStyle}
      >
        {hazards.map(h => (
          <Marker
            key={h.id}
            coordinate={{ latitude: h.lat, longitude: h.lon }}
            pinColor={severityColor(h.severity)}
            title={h.type}
            description={`Severity: ${h.severity}`}
          />
        ))}
      </MapView>

      {/* Legend */}
      <View style={styles.legend}>
        {[
          { label: 'S1 Minor', color: '#F59E0B' },
          { label: 'S2 Moderate', color: '#F97316' },
          { label: 'S3 Critical', color: '#EF4444' },
        ].map(l => (
          <View key={l.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: l.color }]} />
            <Text style={styles.legendText}>{l.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1C',
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 3,
    fontFamily: 'monospace',
  },
  map: { flex: 1 },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: '#0A0A0A',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#1C1C1C',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: '#666', fontSize: 10, fontFamily: 'monospace' },
});

// Google Maps dark style
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0a0a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#555' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2a2a' }] },
  { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#666' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#111' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
];
