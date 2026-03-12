import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, Animated,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useDetectionStore } from '../../store/useDetectionStore';
import OvershootService from '../../services/OvershootService';

const { width: W, height: H } = Dimensions.get('window');

// Fake YOLO detections for demo
const FAKE_DETECTIONS = [
  { id: 1, label: 'Pothole — S2', confidence: 0.87, x: 0.3, y: 0.55, w: 0.18, h: 0.10, color: '#F97316' },
  { id: 2, label: 'Road Crack',   confidence: 0.72, x: 0.6, y: 0.65, w: 0.14, h: 0.06, color: '#F59E0B' },
  { id: 3, label: 'Water Fill — S3', confidence: 0.91, x: 0.15, y: 0.60, w: 0.20, h: 0.12, color: '#EF4444' },
];

interface Detection {
  id: number; label: string; confidence: number;
  x: number; y: number; w: number; h: number; color: string;
}

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraActive, setCameraActive] = useState(false);
  const [facing] = useState<CameraType>('back');
  const [detections, setDetections] = useState<Detection[]>([]);
  const [sessionStats, setSessionStats] = useState({ detected: 0, reported: 0 });
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const { cameraEnabled, setCameraEnabled, alertMessage, alertLevel, clearAlert } = useDetectionStore();

  // Pulse animation for active detection box
  useEffect(() => {
    if (cameraActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.04, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [cameraActive]);

  // Cycle through fake detections for demo
  useEffect(() => {
    if (!cameraActive) { setDetections([]); return; }

    let idx = 0;
    const interval = setInterval(() => {
      // Show 1-2 random detections at a time
      const count = Math.floor(Math.random() * 2) + 1;
      const shuffled = [...FAKE_DETECTIONS].sort(() => Math.random() - 0.5);
      setDetections(shuffled.slice(0, count));
      setSessionStats(s => ({ detected: s.detected + count, reported: s.reported + 1 }));
      idx++;
    }, 1800);

    return () => clearInterval(interval);
  }, [cameraActive]);

  const handleToggle = () => {
    if (!cameraActive) {
      setCameraActive(true);
      setCameraEnabled(true);
    } else {
      setCameraActive(false);
      setCameraEnabled(false);
      setDetections([]);
      OvershootService.stopIntervalMode();
    }
  };

  if (!permission) return <View style={styles.root} />;

  if (!permission.granted) {
    return (
      <View style={styles.root}>
        <View style={styles.header}><Text style={styles.title}>OVERSHOOT CAMERA</Text></View>
        <View style={styles.permBox}>
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
        <Text style={styles.title}>OVERSHOOT CAMERA</Text>
        <View style={[styles.statusPill, cameraActive && styles.statusPillActive]}>
          <Text style={styles.statusPillText}>{cameraActive ? '● LIVE' : '○ OFF'}</Text>
        </View>
      </View>

      {/* Camera + overlay */}
      <View style={styles.cameraContainer}>
        {cameraActive ? (
          <>
            <CameraView style={styles.camera} facing={facing} />

            {/* YOLO bounding boxes overlay */}
            {detections.map(d => (
              <Animated.View
                key={d.id}
                style={[
                  styles.bbox,
                  {
                    left: d.x * W,
                    top: d.y * (H * 0.52),
                    width: d.w * W,
                    height: d.h * (H * 0.52),
                    borderColor: d.color,
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              >
                <View style={[styles.bboxLabel, { backgroundColor: d.color }]}>
                  <Text style={styles.bboxLabelText}>
                    {d.label}  {(d.confidence * 100).toFixed(0)}%
                  </Text>
                </View>
              </Animated.View>
            ))}

            {/* Scan line */}
            <View style={styles.scanLine} />

            {/* Corner brackets */}
            {['tl', 'tr', 'bl', 'br'].map(pos => (
              <View key={pos} style={[styles.corner, styles[pos as 'tl' | 'tr' | 'bl' | 'br']]} />
            ))}
          </>
        ) : (
          <View style={styles.cameraOff}>
            <Text style={styles.cameraOffIcon}>◎</Text>
            <Text style={styles.cameraOffText}>TAP START TO ACTIVATE</Text>
            <Text style={styles.cameraOffSub}>Overshoot AI will detect potholes in real-time</Text>
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

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{sessionStats.detected}</Text>
          <Text style={styles.statLabel}>DETECTED</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{sessionStats.reported}</Text>
          <Text style={styles.statLabel}>REPORTED</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statVal, { color: '#EF4444' }]}>
            {detections.filter(d => d.color === '#EF4444').length}
          </Text>
          <Text style={styles.statLabel}>CRITICAL</Text>
        </View>
      </View>

      {/* Active detections list */}
      {detections.length > 0 && (
        <View style={styles.detectionList}>
          {detections.map(d => (
            <View key={d.id} style={styles.detectionRow}>
              <View style={[styles.detectionDot, { backgroundColor: d.color }]} />
              <Text style={styles.detectionLabel}>{d.label}</Text>
              <Text style={[styles.detectionConf, { color: d.color }]}>
                {(d.confidence * 100).toFixed(0)}%
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Control button */}
      <TouchableOpacity
        style={[styles.btn, cameraActive && styles.btnDanger, styles.mainBtn]}
        onPress={handleToggle}
      >
        <Text style={styles.btnText}>
          {cameraActive ? '■  STOP DETECTION' : '▶  START DETECTION'}
        </Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Mount phone on handlebars · Overshoot AI scans every 500ms
        </Text>
      </View>
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
  title: {
    color: '#fff', fontSize: 14, fontWeight: '800',
    letterSpacing: 3, fontFamily: 'monospace',
  },
  statusPill: {
    backgroundColor: '#1C1C1C', borderRadius: 12, paddingHorizontal: 10,
    paddingVertical: 4, borderWidth: 1, borderColor: '#333',
  },
  statusPillActive: { borderColor: '#F97316', backgroundColor: '#1A0800' },
  statusPillText: { color: '#F97316', fontSize: 10, fontFamily: 'monospace' },
  cameraContainer: {
    height: H * 0.38,
    backgroundColor: '#0F0F0F',
    margin: 16, borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: '#222',
  },
  camera: { ...StyleSheet.absoluteFillObject },
  cameraOff: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  cameraOffIcon: { color: '#2A2A2A', fontSize: 48, marginBottom: 12 },
  cameraOffText: { color: '#F97316', fontSize: 11, fontFamily: 'monospace', letterSpacing: 2 },
  cameraOffSub: { color: '#333', fontSize: 10, fontFamily: 'monospace', marginTop: 6, textAlign: 'center', paddingHorizontal: 20 },
  bbox: {
    position: 'absolute', borderWidth: 2, borderRadius: 4,
  },
  bboxLabel: {
    position: 'absolute', top: -18, left: 0,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3,
  },
  bboxLabelText: { color: '#fff', fontSize: 9, fontFamily: 'monospace', fontWeight: '700' },
  scanLine: {
    position: 'absolute', left: 0, right: 0, height: 1,
    backgroundColor: '#F97316', opacity: 0.4, top: '50%',
  },
  tl: { position: 'absolute', top: 12, left: 12, width: 20, height: 20, borderTopWidth: 2, borderLeftWidth: 2, borderColor: '#F97316' },
  tr: { position: 'absolute', top: 12, right: 12, width: 20, height: 20, borderTopWidth: 2, borderRightWidth: 2, borderColor: '#F97316' },
  bl: { position: 'absolute', bottom: 12, left: 12, width: 20, height: 20, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: '#F97316' },
  br: { position: 'absolute', bottom: 12, right: 12, width: 20, height: 20, borderBottomWidth: 2, borderRightWidth: 2, borderColor: '#F97316' },
  corner: {},
  alertBanner: {
    marginHorizontal: 16, backgroundColor: '#1A0800',
    borderWidth: 1, borderColor: '#F97316', borderRadius: 8,
    padding: 10, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  alertText: { color: '#F97316', fontFamily: 'monospace', fontSize: 12, flex: 1 },
  alertDismiss: { color: '#F97316', fontSize: 14, marginLeft: 8 },
  statsRow: {
    flexDirection: 'row', marginHorizontal: 16,
    backgroundColor: '#111', borderRadius: 10,
    borderWidth: 1, borderColor: '#1E1E1E',
    marginBottom: 8,
  },
  statBox: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    borderRightWidth: 1, borderRightColor: '#1E1E1E',
  },
  statVal: { color: '#fff', fontSize: 22, fontWeight: '800' },
  statLabel: { color: '#555', fontSize: 8, letterSpacing: 2, fontFamily: 'monospace', marginTop: 2 },
  detectionList: {
    marginHorizontal: 16, backgroundColor: '#0F0F0F',
    borderRadius: 8, borderWidth: 1, borderColor: '#1E1E1E',
    paddingHorizontal: 14, marginBottom: 8,
  },
  detectionRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
    gap: 10,
  },
  detectionDot: { width: 8, height: 8, borderRadius: 4 },
  detectionLabel: { flex: 1, color: '#ccc', fontSize: 12, fontFamily: 'monospace' },
  detectionConf: { fontSize: 12, fontFamily: 'monospace', fontWeight: '700' },
  permBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  permText: { color: '#888', fontFamily: 'monospace', fontSize: 13 },
  btn: {
    backgroundColor: '#1C1C1C', borderRadius: 10, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#333',
  },
  btnPrimary: { backgroundColor: '#7C2D12', borderColor: '#F97316' },
  btnDanger: { backgroundColor: '#3A0A0A', borderColor: '#EF4444' },
  mainBtn: { marginHorizontal: 16, marginBottom: 8 },
  btnText: { color: '#fff', fontFamily: 'monospace', fontWeight: '700', letterSpacing: 2, fontSize: 12 },
  infoBox: {
    marginHorizontal: 16, marginBottom: 16, padding: 10,
    backgroundColor: '#111', borderRadius: 8, borderWidth: 1, borderColor: '#1E1E1E',
  },
  infoText: { color: '#444', fontSize: 10, fontFamily: 'monospace', textAlign: 'center' },
});