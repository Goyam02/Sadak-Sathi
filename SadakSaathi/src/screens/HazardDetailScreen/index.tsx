import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useHazardStore } from '../../store/useHazardStore';
import { severityColor } from '../../utils/impactClassifier';

type Route = RouteProp<RootStackParamList, 'HazardDetail'>;

export default function HazardDetailScreen() {
  const { params } = useRoute<Route>();
  const hazards = useHazardStore(s => s.hazards);
  const hazard = hazards.find(h => h.id === params.hazardId);

  if (!hazard) {
    return (
      <View style={styles.root}>
        <Text style={styles.notFound}>Hazard not found</Text>
      </View>
    );
  }

  const color = severityColor(hazard.severity);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* Severity badge */}
      <View style={[styles.severityBadge, { borderColor: color }]}>
        <Text style={[styles.severityText, { color }]}>{hazard.severity}</Text>
        <Text style={styles.severityType}>{hazard.type?.replace('_', ' ').toUpperCase()}</Text>
      </View>

      <Row label="HAZARD ID"     value={`#${hazard.id}`} />
      <Row label="COORDINATES"   value={`${hazard.lat.toFixed(6)}, ${hazard.lon.toFixed(6)}`} />
      <Row label="TYPE"          value={hazard.type ?? '—'} />
      <Row label="SEVERITY"      value={hazard.severity ?? '—'} color={color} />
      <Row label="CONFIDENCE"    value={hazard.confidence != null ? `${(hazard.confidence * 100).toFixed(1)}%` : '—'} />
      <Row label="REPORT COUNT"  value={String(hazard.report_count ?? '—')} />
      <Row label="STATUS"        value={hazard.status ?? '—'} />
    </ScrollView>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, color ? { color } : undefined]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0A' },
  content: { padding: 20, paddingBottom: 40 },
  notFound: { color: '#555', textAlign: 'center', marginTop: 60, fontFamily: 'monospace' },
  severityBadge: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 28,
  },
  severityText: { fontSize: 48, fontWeight: '900', lineHeight: 52 },
  severityType: { color: '#666', fontSize: 11, letterSpacing: 3, fontFamily: 'monospace', marginTop: 4 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  rowLabel: { color: '#444', fontSize: 10, letterSpacing: 2, fontFamily: 'monospace' },
  rowValue: { color: '#ccc', fontSize: 13, fontFamily: 'monospace', fontWeight: '600' },
});
