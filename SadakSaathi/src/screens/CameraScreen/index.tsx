import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useDetectionStore } from '../../store/useDetectionStore';
import OvershootService from '../../services/OvershootService';

// NOTE: react-native-vision-camera is installed but Camera import
// may need device permission flow — kept simple for demo.
// Swap 'any' for the real Camera ref type once confirmed working.

export default function CameraScreen() {
  const { cameraEnabled, alertMessage, alertLevel, setCameraEnabled } = useDetectionStore();
  const latestFrameRef = useRef<string | null>(null);

  const handleToggle = useCallback(() => {
    if (!cameraEnabled) {
      setCameraEnabled(true);
      OvershootService.startIntervalMode(() => latestFrameRef.current);
    } else {
      setCameraEnabled(false);
      OvershootService.stopIntervalMode();
    }
  }, [cameraEnabled]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>OVERSHOOT CAMERA</Text>
      </View>

      {/* Camera preview placeholder — replace with VisionCamera <Camera> component */}
      <View style={styles.preview}>
        <Text style={styles.previewText}>
          {cameraEnabled ? '◉  LIVE INFERENCE ACTIVE' : '○  CAMERA OFF'}
        </Text>
        <Text style={styles.previewSub}>
          {cameraEnabled
            ? 'Overshoot API scanning for potholes…'
            : 'Enable to start visual hazard detection'}
        </Text>
      </View>

      {alertLevel !== 'none' && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertText}>⚠  {alertMessage}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, cameraEnabled && styles.buttonActive]}
        onPress={handleToggle}
      >
        <Text style={styles.buttonText}>
          {cameraEnabled ? 'STOP DETECTION' : 'START DETECTION'}
        </Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Mount your phone on handlebars for best results.{'\n'}
          Overshoot API analyzes frames every 500ms.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0A' },
  header: {
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
  preview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222',
    backgroundColor: '#0F0F0F',
  },
  previewText: {
    color: '#F97316',
    fontSize: 14,
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  previewSub: {
    color: '#444',
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 8,
    textAlign: 'center',
  },
  alertBanner: {
    marginHorizontal: 20,
    backgroundColor: '#1A0A00',
    borderWidth: 1,
    borderColor: '#F97316',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  alertText: {
    color: '#F97316',
    fontFamily: 'monospace',
    fontSize: 13,
  },
  button: {
    marginHorizontal: 20,
    backgroundColor: '#1C1C1C',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  buttonActive: {
    backgroundColor: '#7C2D12',
    borderColor: '#F97316',
  },
  buttonText: {
    color: '#fff',
    fontFamily: 'monospace',
    fontWeight: '700',
    letterSpacing: 2,
    fontSize: 13,
  },
  infoBox: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 14,
    backgroundColor: '#111',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#222',
  },
  infoText: {
    color: '#555',
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
});
