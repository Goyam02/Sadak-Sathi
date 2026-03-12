import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useHazardStore } from '../../../store/useHazardStore';

export default function MorningBrief() {
  const hazards = useHazardStore(s => s.hazards);
  const critical = hazards.filter(h => h.severity === 'S3' || h.severity === 'S3+').length;
  const total = hazards.length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'MORNING BRIEF' : hour < 17 ? 'AFTERNOON BRIEF' : 'EVENING BRIEF';

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{greeting}</Text>
      <Text style={styles.time}>{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</Text>

      <View style={styles.row}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{total}</Text>
          <Text style={styles.statLabel}>HAZARDS{'\n'}NEARBY</Text>
        </View>
        <View style={[styles.stat, critical > 0 && styles.statDanger]}>
          <Text style={[styles.statValue, critical > 0 && styles.statValueDanger]}>{critical}</Text>
          <Text style={styles.statLabel}>CRITICAL{'\n'}POTHOLES</Text>
        </View>
      </View>

      <View style={styles.pill}>
        <Text style={styles.pillText}>
          {total === 0
            ? '✓  Route looks clear'
            : `⚠  ${critical > 0 ? `${critical} critical hazards on your route` : `${total} hazards detected nearby`}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 16,
  },
  label: {
    color: '#F97316',
    fontSize: 10,
    letterSpacing: 3,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  time: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -1,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  stat: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  statDanger: {
    borderColor: '#EF4444',
    backgroundColor: '#1A0A0A',
  },
  statValue: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 40,
  },
  statValueDanger: { color: '#EF4444' },
  statLabel: {
    color: '#666',
    fontSize: 9,
    letterSpacing: 2,
    fontFamily: 'monospace',
    marginTop: 4,
  },
  pill: {
    backgroundColor: '#1A1400',
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: '#3A2800',
  },
  pillText: {
    color: '#F59E0B',
    fontSize: 12,
    fontFamily: 'monospace',
  },
});
