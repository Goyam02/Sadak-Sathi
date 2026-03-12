import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, Dimensions, FlatList,
} from 'react-native';
import WebView from 'react-native-webview';
import { useHazardStore } from '../../store/useHazardStore';
import { useLocationStore } from '../../store/useLocationStore';
import { useNearbyHazards } from '../../hooks/useNearbyHazards';
import { severityColor } from '../../utils/impactClassifier';
import { Hazard } from '../../api/hazards';
import DemoModeBanner from '../../components/DemoModeBanner';
import PotholeImage from '../../components/PotholeImage';
import {
  useDemoStore, DEMO_HAZARDS, DEMO_LOCATION,
  DEMO_CONTRACTORS,
} from '../../store/useDemoStore';

const { width: W } = Dimensions.get('window');
const MAP_H = 320;

const ROUTE_A: [number, number][] = [
  [28.6325, 77.2198], [28.6321, 77.2198], [28.6315, 77.2210],
  [28.6308, 77.2187], [28.6295, 77.2175], [28.6287, 77.2170],
];
const ROUTE_B: [number, number][] = [
  [28.6325, 77.2198], [28.6335, 77.2175], [28.6355, 77.2175],
  [28.6355, 77.2225], [28.6325, 77.2225], [28.6295, 77.2225], [28.6287, 77.2170],
];

function buildLeafletHTML(
  hazards: Hazard[],
  userLat: number,
  userLon: number,
): string {
  const hazardJSON = JSON.stringify(
    hazards.map(h => ({
      id: h.id,
      lat: h.lat,
      lon: h.lon,
      severity: h.severity,
      type: h.type,
      confidence: h.confidence,
      report_count: h.report_count,
    }))
  );
  const routeAJSON = JSON.stringify(ROUTE_A);
  const routeBJSON = JSON.stringify(ROUTE_B);

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body, #map { width: 100%; height: 100%; background: #0D1117; }
  .leaflet-tile-pane { filter: brightness(0.75) saturate(0.6) hue-rotate(180deg) invert(1); }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
(function() {
  var map = L.map('map', {
    center: [${userLat}, ${userLon}],
    zoom: 15,
    zoomControl: false,
    attributionControl: false,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
  }).addTo(map);

  // User location blue dot
  var userMarker = L.circleMarker([${userLat}, ${userLon}], {
    radius: 8,
    fillColor: '#3B82F6',
    color: '#fff',
    weight: 2,
    fillOpacity: 1,
  }).addTo(map);

  // Pulse ring around user
  L.circleMarker([${userLat}, ${userLon}], {
    radius: 16,
    fillColor: 'transparent',
    color: '#3B82F655',
    weight: 2,
    fillOpacity: 0,
  }).addTo(map);

  // Destination pin
  L.circleMarker([28.6287, 77.2170], {
    radius: 7,
    fillColor: '#22C55E',
    color: '#fff',
    weight: 2,
    fillOpacity: 1,
  }).addTo(map).bindTooltip('Saket Metro', { permanent: false, direction: 'top' });

  // Routes
  var routeA = L.polyline(${routeAJSON}, {
    color: '#F97316',
    weight: 5,
    opacity: 1,
  }).addTo(map);

  var routeB = L.polyline(${routeBJSON}, {
    color: '#22C55E40',
    weight: 3,
    opacity: 0.5,
  }).addTo(map);

  // Severity colors
  var SEV_COLORS = { S3: '#EF4444', S2: '#F97316', S1: '#EAB308' };
  var SEV_RADIUS = { S3: 10, S2: 8, S1: 6 };

  // Hazard pins
  var hazards = ${hazardJSON};
  hazards.forEach(function(h) {
    var color = SEV_COLORS[h.severity] || '#EF4444';
    var radius = SEV_RADIUS[h.severity] || 8;
    var marker = L.circleMarker([h.lat, h.lon], {
      radius: radius,
      fillColor: color,
      color: 'rgba(255,255,255,0.5)',
      weight: 1.5,
      fillOpacity: 0.9,
    }).addTo(map);
    marker.on('click', function() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'hazardTapped', id: h.id }));
    });
  });

  // Route switching
  window.showRoute = function(route) {
    if (route === 'A') {
      routeA.setStyle({ color: '#F97316', weight: 5, opacity: 1 });
      routeB.setStyle({ color: '#22C55E', weight: 3, opacity: 0.35 });
    } else {
      routeB.setStyle({ color: '#22C55E', weight: 5, opacity: 1 });
      routeA.setStyle({ color: '#F97316', weight: 3, opacity: 0.35 });
    }
  };

  // Live user location update (called from RN)
  window.updateUserLocation = function(lat, lon) {
    userMarker.setLatLng([lat, lon]);
  };
})();
</script>
</body>
</html>`;
}

// ─── Sub-components ────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}
function InfoCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.infoCard}>{children}</View>;
}
function InfoRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function MapScreen() {
  useNearbyHazards();
  const { isDemoMode } = useDemoStore();
  const { hazards } = useHazardStore();
  const { lat, lon } = useLocationStore();

  const [activeRoute, setActiveRoute] = useState<'A' | 'B'>('A');
  const [activeTab, setActiveTab] = useState<'map' | 'list'>('map');
  const [selectedHazard, setSelectedHazard] = useState<Hazard | null>(null);
  const [routeStarted, setRouteStarted] = useState(false);

  const webviewRef = useRef<WebView>(null);

  const displayHazards = isDemoMode ? DEMO_HAZARDS : hazards;
  const displayLat = isDemoMode ? DEMO_LOCATION.lat : (lat ?? DEMO_LOCATION.lat);
  const displayLon = isDemoMode ? DEMO_LOCATION.lon : (lon ?? DEMO_LOCATION.lon);

  const leafletHTML = useMemo(
    () => buildLeafletHTML(displayHazards as Hazard[], displayLat, displayLon),
    [displayHazards, displayLat, displayLon]
  );

  // Sync active route
  useEffect(() => {
    webviewRef.current?.injectJavaScript(`showRoute('${activeRoute}'); true;`);
  }, [activeRoute]);

  // Sync live GPS (only in live mode)
  useEffect(() => {
    if (!isDemoMode && lat != null && lon != null) {
      webviewRef.current?.injectJavaScript(
        `updateUserLocation(${lat}, ${lon}); true;`
      );
    }
  }, [lat, lon, isDemoMode]);

  function handleWebViewMessage(event: { nativeEvent: { data: string } }) {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'hazardTapped') {
        const found = displayHazards.find(h => h.id === msg.id);
        if (found) setSelectedHazard(found as Hazard);
      }
    } catch (_) {}
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>HAZARD MAP</Text>
        <View style={styles.destPill}>
          <Text style={styles.destText}>→ Saket Metro</Text>
        </View>
      </View>

      <DemoModeBanner />

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['map', 'list'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, activeTab === t && styles.tabActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
              {t === 'map' ? 'MAP VIEW' : `HAZARD LIST (${displayHazards.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'map' ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

          {/* Leaflet Map */}
          <View style={[styles.mapContainer, { height: MAP_H }]}>
            <WebView
              ref={webviewRef}
              source={{ html: leafletHTML }}
              style={styles.webview}
              originWhitelist={['*']}
              javaScriptEnabled
              domStorageEnabled
              onMessage={handleWebViewMessage}
              scrollEnabled={false}
              bounces={false}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
            />
          </View>

          {/* Route selector */}
          <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
            <Text style={styles.sectionLabel}>SELECT ROUTE</Text>
            <View style={styles.routeCards}>

              {/* Route A */}
              <TouchableOpacity
                style={[styles.routeCard, activeRoute === 'A' && styles.routeCardActiveA]}
                onPress={() => setActiveRoute('A')}
              >
                <View style={styles.routeCardHeader}>
                  <View style={[styles.routeLetter, { backgroundColor: '#F97316' }]}>
                    <Text style={styles.routeLetterText}>A</Text>
                  </View>
                  <Text style={styles.routeCardLabel}>DIRECT</Text>
                  {activeRoute === 'A' && <Text style={styles.activeCheck}>✓</Text>}
                </View>
                <View style={styles.routeCardStats}>
                  <View style={styles.rstat}>
                    <Text style={styles.rstatVal}>2.1</Text>
                    <Text style={styles.rstatUnit}>KM</Text>
                  </View>
                  <View style={styles.rstat}>
                    <Text style={styles.rstatVal}>8</Text>
                    <Text style={styles.rstatUnit}>MIN</Text>
                  </View>
                </View>
                <Text style={styles.routeWarning}>⚠ 3 hazards on route</Text>
              </TouchableOpacity>

              {/* Route B */}
              <TouchableOpacity
                style={[styles.routeCard, activeRoute === 'B' && styles.routeCardActiveB]}
                onPress={() => setActiveRoute('B')}
              >
                <View style={styles.routeCardHeader}>
                  <View style={[styles.routeLetter, { backgroundColor: '#22C55E' }]}>
                    <Text style={styles.routeLetterText}>B</Text>
                  </View>
                  <Text style={styles.routeCardLabel}>SAFE DETOUR</Text>
                  {activeRoute === 'B' && <Text style={[styles.activeCheck, { color: '#22C55E' }]}>✓</Text>}
                </View>
                <View style={styles.routeCardStats}>
                  <View style={styles.rstat}>
                    <Text style={styles.rstatVal}>3.4</Text>
                    <Text style={styles.rstatUnit}>KM</Text>
                  </View>
                  <View style={styles.rstat}>
                    <Text style={styles.rstatVal}>12</Text>
                    <Text style={styles.rstatUnit}>MIN</Text>
                  </View>
                </View>
                <Text style={styles.routeSafe}>✓ No hazards on route</Text>
              </TouchableOpacity>

            </View>

            {/* Go button */}
            <TouchableOpacity
              style={[styles.goBtn, activeRoute === 'A' ? styles.goBtnWarn : styles.goBtnSafe]}
              onPress={() => setRouteStarted(r => !r)}
            >
              <Text style={styles.goBtnText}>
                {routeStarted ? '■ STOP NAVIGATION' : `▶ START ROUTE ${activeRoute}`}
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      ) : (
        <FlatList
          data={displayHazards}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item, index }) => {
            const color = severityColor(item.severity);
            return (
              <TouchableOpacity style={styles.listCard} onPress={() => setSelectedHazard(item as Hazard)}>
                <PotholeImage index={index} style={{ height: 80, width: 100, borderRadius: 6 }} severity={item.severity} confidence={item.confidence} />
                <View style={styles.listCardInfo}>
                  <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
                    <Text style={[styles.badgeText, { color }]}>{item.severity}</Text>
                  </View>
                  <Text style={styles.listCardType}>{item.type?.replace(/_/g, ' ').toUpperCase()}</Text>
                  <Text style={styles.listCardCoords}>{item.lat.toFixed(5)}, {item.lon.toFixed(5)}</Text>
                  <Text style={styles.listCardMeta}>{item.report_count ?? 1} reports · {((item.confidence ?? 0) * 100).toFixed(0)}% conf</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Hazard Detail Modal */}
      <Modal visible={!!selectedHazard} transparent animationType="slide">
        <View style={styles.overlay}>
          {selectedHazard && (() => {
            const c = DEMO_CONTRACTORS[selectedHazard.id] ?? DEMO_CONTRACTORS[1];
            const color = severityColor(selectedHazard.severity);
            const idx = DEMO_HAZARDS.findIndex(h => h.id === selectedHazard.id);
            return (
              <ScrollView style={styles.sheet}>
                <View style={styles.sheetHandle} />
                <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
                  <PotholeImage index={idx >= 0 ? idx : 0} style={{ height: 160, width: '100%' }} severity={selectedHazard.severity} confidence={selectedHazard.confidence} />
                </View>
                <View style={styles.sheetHeader}>
                  <Text style={[styles.sheetSev, { color }]}>{selectedHazard.severity}</Text>
                  <View>
                    <Text style={styles.sheetType}>{selectedHazard.type?.replace(/_/g, ' ').toUpperCase()}</Text>
                    <Text style={styles.sheetStatus}>{selectedHazard.status}</Text>
                  </View>
                </View>
                <SectionLabel label="HAZARD INFO" />
                <InfoCard>
                  <InfoRow label="COORDINATES" value={`${selectedHazard.lat.toFixed(5)}, ${selectedHazard.lon.toFixed(5)}`} />
                  <InfoRow label="REPORTS" value={String(selectedHazard.report_count ?? 1)} />
                  <InfoRow label="CONFIDENCE" value={`${((selectedHazard.confidence ?? 0) * 100).toFixed(0)}%`} />
                  <InfoRow label="STATUS" value={selectedHazard.status ?? 'CONFIRMED'} />
                </InfoCard>
                <SectionLabel label="CONTRACTOR ACCOUNTABILITY" />
                <InfoCard>
                  <InfoRow label="CONTRACTOR" value={c.name} />
                  <InfoRow label="CONTRACT NO." value={c.contract} />
                  <InfoRow label="JE RESPONSIBLE" value={c.je} />
                  <InfoRow label="ROAD QUALITY" value={`${c.score}/100`} color={c.score < 40 ? '#EF4444' : '#F59E0B'} />
                  <InfoRow label="WARRANTY BREACH" value={`${c.breaches}×`} color="#EF4444" />
                  <InfoRow label="UNRESOLVED" value={`${c.unresolved} days`} color="#F97316" />
                </InfoCard>
                <SectionLabel label="ECONOMIC DAMAGE" />
                <InfoCard>
                  <InfoRow label="TOTAL DAMAGE" value={c.totalDamage} color="#EF4444" />
                  <InfoRow label="VEHICLE DAMAGE" value={c.vehicleDamage} />
                  <InfoRow label="TRAFFIC COST" value={c.trafficCost} color="#F97316" />
                </InfoCard>
                <TouchableOpacity style={[styles.mBtn, styles.mBtnPrimary, { margin: 16 }]} onPress={() => setSelectedHazard(null)}>
                  <Text style={styles.mBtnText}>CLOSE</Text>
                </TouchableOpacity>
              </ScrollView>
            );
          })()}
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1C1C1C' },
  title: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 3, fontFamily: 'monospace' },
  destPill: { backgroundColor: '#1A1A1A', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#22C55E55' },
  destText: { color: '#22C55E', fontSize: 10, fontFamily: 'monospace' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1C1C1C' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#F97316' },
  tabText: { color: '#555', fontSize: 10, fontFamily: 'monospace', letterSpacing: 1 },
  tabTextActive: { color: '#F97316' },
  mapContainer: { marginHorizontal: 16, marginTop: 12, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#1E2A3A' },
  webview: { flex: 1, backgroundColor: '#0D1117' },
  sectionLabel: { color: '#444', fontSize: 9, letterSpacing: 3, fontFamily: 'monospace', paddingHorizontal: 0, marginTop: 4, marginBottom: 6 },
  routeCards: { flexDirection: 'row', gap: 10 },
  routeCard: { flex: 1, backgroundColor: '#111', borderRadius: 10, borderWidth: 1, borderColor: '#222', padding: 12 },
  routeCardActiveA: { borderColor: '#F97316', backgroundColor: '#1A0D00' },
  routeCardActiveB: { borderColor: '#22C55E', backgroundColor: '#001A09' },
  routeCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  routeLetter: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  routeLetterText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  routeCardLabel: { color: '#888', fontSize: 9, fontFamily: 'monospace', letterSpacing: 1, flex: 1 },
  activeCheck: { color: '#F97316', fontSize: 12, fontWeight: '700' },
  routeCardStats: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  rstat: {},
  rstatVal: { color: '#fff', fontSize: 18, fontWeight: '800', lineHeight: 20 },
  rstatUnit: { color: '#444', fontSize: 8, fontFamily: 'monospace', letterSpacing: 1 },
  routeWarning: { color: '#EF4444', fontSize: 9, fontFamily: 'monospace' },
  routeSafe: { color: '#22C55E', fontSize: 9, fontFamily: 'monospace' },
  goBtn: { borderRadius: 10, padding: 16, alignItems: 'center', borderWidth: 1, marginTop: 12 },
  goBtnWarn: { backgroundColor: '#1A0800', borderColor: '#F97316' },
  goBtnSafe: { backgroundColor: '#001A09', borderColor: '#22C55E' },
  goBtnText: { color: '#fff', fontFamily: 'monospace', fontWeight: '700', letterSpacing: 2, fontSize: 11 },
  listCard: { flexDirection: 'row', backgroundColor: '#111', borderRadius: 10, borderWidth: 1, borderColor: '#1E1E1E', overflow: 'hidden', gap: 12 },
  listCardInfo: { flex: 1, paddingVertical: 10, paddingRight: 12, gap: 4 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 1 },
  badgeText: { fontSize: 9, fontFamily: 'monospace', fontWeight: '800' },
  listCardType: { color: '#ccc', fontSize: 12, fontWeight: '600' },
  listCardCoords: { color: '#444', fontSize: 9, fontFamily: 'monospace' },
  listCardMeta: { color: '#555', fontSize: 9, fontFamily: 'monospace' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#111', borderTopLeftRadius: 16, borderTopRightRadius: 16, borderTopWidth: 1, borderColor: '#222', maxHeight: '92%' },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 16 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16, marginBottom: 16 },
  sheetSev: { fontSize: 52, fontWeight: '900', lineHeight: 56 },
  sheetType: { color: '#888', fontFamily: 'monospace', fontSize: 11, letterSpacing: 2 },
  sheetStatus: { color: '#F97316', fontFamily: 'monospace', fontSize: 9, letterSpacing: 1, marginTop: 4 },
  infoCard: { backgroundColor: '#0F0F0F', borderRadius: 8, borderWidth: 1, borderColor: '#1E1E1E', paddingHorizontal: 16, marginHorizontal: 16, marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  infoLabel: { color: '#444', fontSize: 9, letterSpacing: 2, fontFamily: 'monospace' },
  infoValue: { color: '#ccc', fontSize: 11, fontFamily: 'monospace', fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
  mBtn: { borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  mBtnPrimary: { backgroundColor: '#7C2D12', borderColor: '#F97316' },
  mBtnText: { color: '#fff', fontFamily: 'monospace', fontWeight: '700', fontSize: 11, letterSpacing: 1 },
});