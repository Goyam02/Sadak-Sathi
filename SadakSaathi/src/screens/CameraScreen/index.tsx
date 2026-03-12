import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, Animated,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useDetectionStore } from '../../store/useDetectionStore';
import { useDemoStore, DEMO_CAMERA_DETECTIONS } from '../../store/useDemoStore';
import DemoModeBanner from '../../components/DemoModeBanner';
import OvershootService from '../../services/OvershootService';

const { width: W, height: H } = Dimensions.get('window');
const CAM_H = H * 0.40;

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraActive, setCameraActive] = useState(false);
  const [detections, setDetections] = useState<typeof DEMO_CAMERA_DETECTIONS>([]);
  const [sessionStats, setSessionStats] = useState({ detected: 0, reported: 0 });
  const { isDemoMode } = useDemoStore();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;
  const { cameraEnabled, setCameraEnabled, alertMessage, alertLevel, clearAlert } = useDetectionStore();

  // Pulse bounding boxes
  useEffect(() => {
    if (!cameraActive) { pulseAnim.setValue(1); return; }
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [cameraActive]);

  // Scan line animation
  useEffect(() => {
    if (!cameraActive) { scanAnim.setValue(0); return; }
    Animated.loop(
      Animated.timing(scanAnim, { toValue: 1, duration: 2000, useNativeDriver: true })
    ).start();
  }, [cameraActive]);

  // Demo: cycle detections realistically
  useEffect(() => {
    if (!cameraActive || !isDemoMode) return;
    let tick = 0;
    const interval = setInterval(() => {
      tick++;
      // Vary which detections show each cycle for realism
      const count = tick % 5 === 0 ? 0 : Math.floor(Math.random() * 3) + 1;
      const shuffled = [...DEMO_CAMERA_DETECTIONS].sort(() => Math.random() - 0.5);
      const shown = shuffled.slice(0, count);
      setDetections(shown);
      if (count > 0) {
        setSessionStats(s => ({ detected: s.detected + count, reported: s.reported + 1 }));
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [cameraActive, isDemoMode]);

  const handleToggle = () => {
    if (!cameraActive) {
      setCameraActive(true);
      setCameraEnabled(true);
      if (!isDemoMode) OvershootService.startIntervalMode(() => null);
    } else {
      setCameraActive(false);
      setCameraEnabled(false);
      setDetections([]);
      OvershootService.stopIntervalMode();
    }
  };

  const scanY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, CAM_H],
  });

  if (!permission) return <View style={styles.root} />;

  if (!permission.granted) {
    return (
      <View style={styles.root}>
        <View style={styles.header}><Text style={styles.title}>YOLO Detection CAMERA</Text></View>
        <DemoModeBanner />
        <View style={styles.permBox}>
          <Text style={styles.permIcon}>◎</Text>
          <Text style={styles.permText}>Camera permission required</Text>
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={requestPermission}>
            <Text style={styles.btnText}>GRANT PERMISSION</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>YOLO Detection CAMERA</Text>
        <View style={[styles.statusPill, cameraActive && styles.statusPillActive]}>
          <Text style={styles.statusPillText}>{cameraActive ? '● SCANNING' : '○ IDLE'}</Text>
        </View>
      </View>

      <DemoModeBanner />

      {/* Camera + overlay */}
      <View style={[styles.cameraContainer, { height: CAM_H }]}>
        {cameraActive ? (
          <>
            <CameraView style={StyleSheet.absoluteFill} facing={'back' as CameraType} />

            {/* Scan line */}
            <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanY }] }]} />

            {/* Corner brackets */}
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />

            {/* YOLO bounding boxes */}
            {detections.map(d => (
              <Animated.View
                key={d.id}
                style={[
                  styles.bbox,
                  {
                    left: d.x * W,
                    top: d.y * CAM_H,
                    width: d.w * W,
                    height: d.h * CAM_H,
                    borderColor: d.color,
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              >
                <View style={[styles.bboxLabel, { backgroundColor: d.color + 'EE' }]}>
                  <Text style={styles.bboxText}>{d.label}  {(d.confidence * 100).toFixed(0)}%</Text>
                </View>
              </Animated.View>
            ))}

            {/* FPS indicator */}
            <View style={styles.fpsTag}>
              <Text style={styles.fpsText}>YOLOv8-nano  8fps  {isDemoMode ? 'DEMO' : 'LIVE'}</Text>
            </View>
          </>
        ) : (
          <View style={styles.cameraOff}>
            <Text style={styles.cameraOffIcon}>◎</Text>
            <Text style={styles.cameraOffText}>TAP START TO ACTIVATE</Text>
            <Text style={styles.cameraOffSub}>
              Mount phone on handlebars · Overshoot AI detects potholes 4-5s ahead
            </Text>
          </View>
        )}
      </View>

      {/* Alert banner */}
      {alertLevel !== 'none' && (
        <TouchableOpacity style={styles.alertBanner} onPress={clearAlert}>
          <Text style={styles.alertText}>⚠  {alertMessage}</Text>
          <Text style={styles.alertDismiss}>✕</Text>
        </TouchableOpacity>
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { val: sessionStats.detected, label: 'DETECTED', color: '#F97316' },
          { val: sessionStats.reported, label: 'REPORTED', color: '#F59E0B' },
          { val: detections.filter(d => d.color === '#EF4444').length, label: 'CRITICAL NOW', color: '#EF4444' },
        ].map(s => (
          <View key={s.label} style={styles.statBox}>
            <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Active detections list */}
      {detections.length > 0 && (
        <View style={styles.detList}>
          {detections.map(d => (
            <View key={d.id} style={styles.detRow}>
              <View style={[styles.detDot, { backgroundColor: d.color }]} />
              <Text style={styles.detLabel}>{d.label}</Text>
              <Text style={[styles.detConf, { color: d.color }]}>{(d.confidence * 100).toFixed(0)}%</Text>
            </View>
          ))}
        </View>
      )}

      {/* Button */}
      <TouchableOpacity
        style={[styles.btn, cameraActive ? styles.btnStop : styles.btnPrimary, styles.mainBtn]}
        onPress={handleToggle}
      >
        <Text style={styles.btnText}>
          {cameraActive ? '■  STOP DETECTION' : '▶  START DETECTION'}
        </Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          {isDemoMode
            ? 'DEMO MODE — YOLO detections cycling in real-time'
            : 'LIVE MODE — YOLO detections cycling every 500ms'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0A' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#1C1C1C',
  },
  title: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 3, fontFamily: 'monospace' },
  statusPill: { backgroundColor: '#1C1C1C', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#333' },
  statusPillActive: { borderColor: '#EF4444', backgroundColor: '#1A0000' },
  statusPillText: { color: '#EF4444', fontSize: 10, fontFamily: 'monospace' },
  cameraContainer: { backgroundColor: '#0F0F0F', marginHorizontal: 16, marginVertical: 10, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#222' },
  cameraOff: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  cameraOffIcon: { color: '#2A2A2A', fontSize: 44 },
  cameraOffText: { color: '#F97316', fontSize: 11, fontFamily: 'monospace', letterSpacing: 2 },
  cameraOffSub: { color: '#333', fontSize: 10, fontFamily: 'monospace', textAlign: 'center', paddingHorizontal: 24 },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 1.5, backgroundColor: '#F97316', opacity: 0.6 },
  corner: { position: 'absolute', width: 22, height: 22 },
  tl: { top: 12, left: 12, borderTopWidth: 2, borderLeftWidth: 2, borderColor: '#F97316' },
  tr: { top: 12, right: 12, borderTopWidth: 2, borderRightWidth: 2, borderColor: '#F97316' },
  bl: { bottom: 12, left: 12, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: '#F97316' },
  br: { bottom: 12, right: 12, borderBottomWidth: 2, borderRightWidth: 2, borderColor: '#F97316' },
  bbox: { position: 'absolute', borderWidth: 2, borderRadius: 3 },
  bboxLabel: { position: 'absolute', top: -18, left: 0, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 },
  bboxText: { color: '#fff', fontSize: 9, fontFamily: 'monospace', fontWeight: '700' },
  fpsTag: { position: 'absolute', bottom: 8, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  fpsText: { color: '#555', fontSize: 8, fontFamily: 'monospace' },
  alertBanner: {
    marginHorizontal: 16, backgroundColor: '#1A0800', borderWidth: 1,
    borderColor: '#F97316', borderRadius: 8, padding: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6,
  },
  alertText: { color: '#F97316', fontFamily: 'monospace', fontSize: 12, flex: 1 },
  alertDismiss: { color: '#F97316', fontSize: 14 },
  statsRow: { flexDirection: 'row', marginHorizontal: 16, backgroundColor: '#111', borderRadius: 10, borderWidth: 1, borderColor: '#1E1E1E', marginBottom: 8 },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRightWidth: 1, borderRightColor: '#1E1E1E' },
  statVal: { fontSize: 22, fontWeight: '800' },
  statLabel: { color: '#555', fontSize: 8, letterSpacing: 2, fontFamily: 'monospace', marginTop: 2 },
  detList: { marginHorizontal: 16, backgroundColor: '#0F0F0F', borderRadius: 8, borderWidth: 1, borderColor: '#1E1E1E', paddingHorizontal: 14, marginBottom: 8 },
  detRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1A1A1A', gap: 10 },
  detDot: { width: 8, height: 8, borderRadius: 4 },
  detLabel: { flex: 1, color: '#ccc', fontSize: 12, fontFamily: 'monospace' },
  detConf: { fontSize: 12, fontFamily: 'monospace', fontWeight: '700' },
  permBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  permIcon: { color: '#333', fontSize: 48 },
  permText: { color: '#888', fontFamily: 'monospace', fontSize: 13 },
  btn: { backgroundColor: '#1C1C1C', borderRadius: 10, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  btnPrimary: { backgroundColor: '#7C2D12', borderColor: '#F97316' },
  btnStop: { backgroundColor: '#1A0000', borderColor: '#EF4444' },
  mainBtn: { marginHorizontal: 16, marginBottom: 8 },
  btnText: { color: '#fff', fontFamily: 'monospace', fontWeight: '700', letterSpacing: 2, fontSize: 12 },
  infoBox: { marginHorizontal: 16, marginBottom: 12, padding: 10, backgroundColor: '#111', borderRadius: 8, borderWidth: 1, borderColor: '#1E1E1E' },
  infoText: { color: '#444', fontSize: 10, fontFamily: 'monospace', textAlign: 'center' },
});
