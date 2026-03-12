import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Modal, TextInput,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useHazardStore } from '../../store/useHazardStore';
import { useLocationStore } from '../../store/useLocationStore';
import { useNearbyHazards } from '../../hooks/useNearbyHazards';
import { getRoute } from '../../api/routing';
import { severityColor } from '../../utils/impactClassifier';
import { Hazard } from '../../api/hazards';
import { RootStackParamList } from '../../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FAKE_CONTRACTOR = {
  name: 'M/s Delhi Road Works Pvt Ltd',
  contract: 'PWD/2023/DRW/4471',
  score: 28,
  breaches: 7,
  activeContracts: '₹31 Crore',
  unresolved: 41,
  vehicleDamage: '₹8.4L',
  trafficCost: '₹6.3L/day',
};

export default function MapScreen() {
  useNearbyHazards();
  const { hazards, isLoading } = useHazardStore();
  const { lat, lon } = useLocationStore();
  const nav = useNavigation<Nav>();

  const [destination, setDestination] = useState('');
  const [routeInfo, setRouteInfo] = useState<{
    distanceKm: number; durationMin: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRouteInput, setShowRouteInput] = useState(false);
  const [selectedHazard, setSelectedHazard] = useState<Hazard | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'route'>('list');

  const userLat = lat ?? 28.6139;
  const userLon = lon ?? 77.2090;

  const handleGetRoute = async () => {
    if (!destination.trim()) return;
    setLoading(true);
    try {
      const geo = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination + ', Delhi')}&format=json&limit=1`,
        { headers: { 'User-Agent': 'SadakSaathi/1.0' } }
      );
      const geoData = await geo.json();
      if (!geoData.length) { setLoading(false); return; }

      const dLat = parseFloat(geoData[0].lat);
      const dLon = parseFloat(geoData[0].lon);

      const route = await getRoute(
        { lat: userLat, lon: userLon },
        { lat: dLat, lon: dLon }
      );
      setRouteInfo({ distanceKm: route.distanceKm, durationMin: route.durationMin });
      setShowRouteInput(false);
      setActiveTab('route');
    } catch (e) {
      console.warn('[Route]', e);
    } finally {
      setLoading(false);
    }
  };

  const s3Hazards = hazards.filter(h => h.severity === 'S3' || h.severity === 'S3+');

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>HAZARD MAP</Text>
        <TouchableOpacity style={styles.routeBtn} onPress={() => setShowRouteInput(true)}>
          <Text style={styles.routeBtnText}>+ ROUTE</Text>
        </TouchableOpacity>
      </View>

      {/* Location strip */}
      <View style={styles.locStrip}>
        <Text style={styles.locText}>
          📍 {lat ? `${lat.toFixed(5)}, ${lon?.toFixed(5)}` : 'Acquiring GPS…'}
        </Text>
        {isLoading && <ActivityIndicator color="#F97316" size="small" />}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['list', 'route'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, activeTab === t && styles.tabActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
              {t === 'list' ? `HAZARDS (${hazards.length})` : 'SAFE ROUTE'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'list' ? (
        <FlatList
          data={hazards}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {isLoading ? 'Scanning for hazards…' : 'No hazards in 500m range'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const color = severityColor(item.severity);
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => setSelectedHazard(item)}
              >
                <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
                  <Text style={[styles.badgeText, { color }]}>{item.severity}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardType}>
                    {item.type?.replace('_', ' ').toUpperCase()}
                  </Text>
                  <Text style={styles.cardCoords}>
                    {item.lat.toFixed(5)}, {item.lon.toFixed(5)}
                  </Text>
                  {item.report_count != null && (
                    <Text style={styles.cardMeta}>
                      {item.report_count} reports · {((item.confidence ?? 0) * 100).toFixed(0)}% confidence
                    </Text>
                  )}
                </View>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            );
          }}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {routeInfo ? (
            <>
              <View style={styles.routeCard}>
                <Text style={styles.routeCardLabel}>SAFE ROUTE TO</Text>
                <Text style={styles.routeCardDest}>{destination.toUpperCase()}</Text>
                <View style={styles.routeStats}>
                  <View style={styles.routeStat}>
                    <Text style={styles.routeStatVal}>{routeInfo.distanceKm.toFixed(1)}</Text>
                    <Text style={styles.routeStatLabel}>KM</Text>
                  </View>
                  <View style={styles.routeStat}>
                    <Text style={styles.routeStatVal}>{Math.round(routeInfo.durationMin)}</Text>
                    <Text style={styles.routeStatLabel}>MIN</Text>
                  </View>
                  <View style={styles.routeStat}>
                    <Text style={[styles.routeStatVal, { color: '#EF4444' }]}>{s3Hazards.length}</Text>
                    <Text style={styles.routeStatLabel}>CRITICAL</Text>
                  </View>
                </View>
              </View>

              {/* Hazards on route */}
              <Text style={styles.sectionLabel}>HAZARDS ON ROUTE</Text>
              {hazards.slice(0, 4).map(h => {
                const color = severityColor(h.severity);
                return (
                  <TouchableOpacity
                    key={h.id}
                    style={styles.card}
                    onPress={() => setSelectedHazard(h)}
                  >
                    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
                      <Text style={[styles.badgeText, { color }]}>{h.severity}</Text>
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardType}>{h.type?.replace('_', ' ').toUpperCase()}</Text>
                      <Text style={styles.cardCoords}>{h.lat.toFixed(5)}, {h.lon.toFixed(5)}</Text>
                    </View>
                    <Text style={styles.arrow}>›</Text>
                  </TouchableOpacity>
                );
              })}
            </>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Tap "+ ROUTE" to plan a safe route</Text>
              <Text style={styles.emptySub}>
                Uses OpenRoute Service to avoid pothole clusters
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Route input modal */}
      <Modal visible={showRouteInput} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>SAFE ROUTE PLANNER</Text>
            <Text style={styles.modalSub}>From your current location →</Text>
            <TextInput
              style={styles.input}
              placeholder="Destination (e.g. Connaught Place)"
              placeholderTextColor="#444"
              value={destination}
              onChangeText={setDestination}
              onSubmitEditing={handleGetRoute}
              autoFocus
            />
            <View style={styles.modalRow}>
              <TouchableOpacity
                style={[styles.mBtn, styles.mBtnPrimary]}
                onPress={handleGetRoute}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.mBtnText}>FIND SAFE ROUTE</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.mBtn}
                onPress={() => setShowRouteInput(false)}
              >
                <Text style={styles.mBtnText}>CANCEL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Hazard detail bottom sheet */}
      <Modal visible={!!selectedHazard} transparent animationType="slide">
        <View style={styles.overlay}>
          {selectedHazard && (
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}>
                <Text style={[styles.sheetSev, { color: severityColor(selectedHazard.severity) }]}>
                  {selectedHazard.severity}
                </Text>
                <Text style={styles.sheetType}>
                  {selectedHazard.type?.replace('_', ' ').toUpperCase()}
                </Text>
              </View>

              <Text style={styles.sectionLabel}>HAZARD INFO</Text>
              <View style={styles.infoCard}>
                <InfoRow label="COORDINATES"  value={`${selectedHazard.lat.toFixed(5)}, ${selectedHazard.lon.toFixed(5)}`} />
                <InfoRow label="REPORTS"      value={String(selectedHazard.report_count ?? 1)} />
                <InfoRow label="CONFIDENCE"   value={`${((selectedHazard.confidence ?? 0) * 100).toFixed(0)}%`} />
                <InfoRow label="STATUS"       value={selectedHazard.status ?? 'CONFIRMED'} />
              </View>

              <Text style={styles.sectionLabel}>CONTRACTOR ACCOUNTABILITY</Text>
              <View style={styles.infoCard}>
                <InfoRow label="CONTRACTOR"       value={FAKE_CONTRACTOR.name} />
                <InfoRow label="CONTRACT NO."     value={FAKE_CONTRACTOR.contract} />
                <InfoRow label="ROAD QUALITY"     value={`${FAKE_CONTRACTOR.score}/100`} color="#EF4444" />
                <InfoRow label="WARRANTY BREACH"  value={`${FAKE_CONTRACTOR.breaches}×`} color="#EF4444" />
                <InfoRow label="ACTIVE CONTRACTS" value={FAKE_CONTRACTOR.activeContracts} />
                <InfoRow label="UNRESOLVED"       value={`${FAKE_CONTRACTOR.unresolved} days`} color="#F97316" />
              </View>

              <Text style={styles.sectionLabel}>ECONOMIC DAMAGE</Text>
              <View style={styles.infoCard}>
                <InfoRow label="VEHICLE DAMAGE"  value={FAKE_CONTRACTOR.vehicleDamage} />
                <InfoRow label="TRAFFIC COST"    value={FAKE_CONTRACTOR.trafficCost} color="#F97316" />
              </View>

              <TouchableOpacity
                style={[styles.mBtn, styles.mBtnPrimary, { marginTop: 8 }]}
                onPress={() => setSelectedHazard(null)}
              >
                <Text style={styles.mBtnText}>CLOSE</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

function InfoRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0A' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#1C1C1C',
  },
  title: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 3, fontFamily: 'monospace' },
  routeBtn: {
    backgroundColor: '#1C1C1C', borderRadius: 6, paddingHorizontal: 12,
    paddingVertical: 6, borderWidth: 1, borderColor: '#F97316',
  },
  routeBtnText: { color: '#F97316', fontSize: 10, fontFamily: 'monospace', letterSpacing: 1 },
  locStrip: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: '#0F0F0F', borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
  },
  locText: { color: '#555', fontSize: 10, fontFamily: 'monospace' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1C1C1C' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#F97316' },
  tabText: { color: '#555', fontSize: 10, fontFamily: 'monospace', letterSpacing: 1 },
  tabTextActive: { color: '#F97316' },
  list: { padding: 16, gap: 10, paddingBottom: 32 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { color: '#444', fontFamily: 'monospace', fontSize: 13 },
  emptySub: { color: '#333', fontFamily: 'monospace', fontSize: 11, textAlign: 'center' },
  card: {
    backgroundColor: '#111', borderRadius: 10, borderWidth: 1,
    borderColor: '#1E1E1E', padding: 14, flexDirection: 'row',
    alignItems: 'center', gap: 12,
  },
  badge: {
    width: 44, height: 44, borderRadius: 8, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontWeight: '800', fontSize: 11, fontFamily: 'monospace' },
  cardInfo: { flex: 1 },
  cardType: { color: '#ccc', fontSize: 12, fontWeight: '600', marginBottom: 2 },
  cardCoords: { color: '#444', fontSize: 10, fontFamily: 'monospace' },
  cardMeta: { color: '#555', fontSize: 10, fontFamily: 'monospace', marginTop: 2 },
  arrow: { color: '#333', fontSize: 20 },
  sectionLabel: {
    color: '#444', fontSize: 9, letterSpacing: 3,
    fontFamily: 'monospace', marginBottom: 8, marginTop: 4,
  },
  routeCard: {
    backgroundColor: '#111', borderRadius: 10, borderWidth: 1,
    borderColor: '#F97316', padding: 16, marginBottom: 16,
  },
  routeCardLabel: { color: '#444', fontSize: 9, letterSpacing: 3, fontFamily: 'monospace', marginBottom: 4 },
  routeCardDest: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1, marginBottom: 16 },
  routeStats: { flexDirection: 'row', gap: 24 },
  routeStat: {},
  routeStatVal: { color: '#F97316', fontSize: 28, fontWeight: '900' },
  routeStatLabel: { color: '#555', fontSize: 9, letterSpacing: 2, fontFamily: 'monospace' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#111', borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 24, borderTopWidth: 1, borderColor: '#222',
  },
  sheet: {
    backgroundColor: '#111', borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 20, borderTopWidth: 1, borderColor: '#222', maxHeight: '90%',
  },
  sheetHandle: {
    width: 40, height: 4, backgroundColor: '#333',
    borderRadius: 2, alignSelf: 'center', marginBottom: 16,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  sheetSev: { fontSize: 44, fontWeight: '900', lineHeight: 48 },
  sheetType: { color: '#666', fontFamily: 'monospace', fontSize: 11, letterSpacing: 2 },
  infoCard: {
    backgroundColor: '#0F0F0F', borderRadius: 8,
    borderWidth: 1, borderColor: '#1E1E1E',
    paddingHorizontal: 14, marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
  },
  infoLabel: { color: '#444', fontSize: 9, letterSpacing: 2, fontFamily: 'monospace' },
  infoValue: { color: '#ccc', fontSize: 11, fontFamily: 'monospace', fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
  modalTitle: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 2, fontFamily: 'monospace', marginBottom: 6 },
  modalSub: { color: '#555', fontSize: 11, fontFamily: 'monospace', marginBottom: 14 },
  input: {
    backgroundColor: '#1A1A1A', borderRadius: 8, borderWidth: 1,
    borderColor: '#333', color: '#fff', padding: 12,
    fontFamily: 'monospace', fontSize: 13, marginBottom: 14,
  },
  modalRow: { flexDirection: 'row', gap: 10 },
  mBtn: {
    flex: 1, backgroundColor: '#1C1C1C', borderRadius: 8,
    padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#333',
  },
  mBtnPrimary: { backgroundColor: '#7C2D12', borderColor: '#F97316' },
  mBtnText: { color: '#fff', fontFamily: 'monospace', fontWeight: '700', fontSize: 11, letterSpacing: 1 },
});