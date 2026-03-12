import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useHazardStore } from '../../../store/useHazardStore';
import { Hazard } from '../../../api/hazards';
import { severityColor } from '../../../utils/impactClassifier';
import { RootStackParamList } from '../../../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function HazardRow({ item }: { item: Hazard }) {
  const nav = useNavigation<Nav>();
  const color = severityColor(item.severity);
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => nav.navigate('HazardDetail', { hazardId: item.id })}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View style={styles.info}>
        <Text style={styles.type}>{item.type?.replace('_', ' ').toUpperCase()}</Text>
        <Text style={styles.coords}>{item.lat.toFixed(4)}, {item.lon.toFixed(4)}</Text>
      </View>
      <Text style={[styles.severity, { color }]}>{item.severity}</Text>
    </TouchableOpacity>
  );
}

export default function HazardSummaryCard() {
  const { hazards, isLoading } = useHazardStore();

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>NEARBY HAZARDS</Text>
      {isLoading && <Text style={styles.loading}>Scanning…</Text>}
      {hazards.length === 0 && !isLoading ? (
        <Text style={styles.empty}>No hazards in range</Text>
      ) : (
        <FlatList
          data={hazards.slice(0, 5)}
          keyExtractor={i => String(i.id)}
          renderItem={({ item }) => <HazardRow item={item} />}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      )}
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
  sectionLabel: {
    color: '#444',
    fontSize: 9,
    letterSpacing: 3,
    fontFamily: 'monospace',
    marginBottom: 14,
  },
  loading: { color: '#555', fontFamily: 'monospace', fontSize: 12 },
  empty:   { color: '#3A3A3A', fontFamily: 'monospace', fontSize: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  info: { flex: 1 },
  type: { color: '#ccc', fontSize: 12, fontWeight: '600' },
  coords: { color: '#444', fontSize: 10, fontFamily: 'monospace' },
  severity: { fontSize: 11, fontFamily: 'monospace', fontWeight: '700' },
  sep: { height: 10 },
});
