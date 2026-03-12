import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { useDetectionStore } from '../../../store/useDetectionStore';
import AccelerometerService from '../../../services/AccelerometerService';

export default function DetectionToggle() {
  const { accelEnabled, cameraEnabled, setAccelEnabled, setCameraEnabled, impactCount } =
    useDetectionStore();

  const handleAccel = (val: boolean) => {
    setAccelEnabled(val);
    val ? AccelerometerService.start() : AccelerometerService.stop();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>DETECTION MODULES</Text>

      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.title}>Accelerometer</Text>
          <Text style={styles.sub}>Impact-based pothole detection</Text>
          {accelEnabled && (
            <Text style={styles.badge}>{impactCount} impacts this session</Text>
          )}
        </View>
        <Switch
          value={accelEnabled}
          onValueChange={handleAccel}
          trackColor={{ false: '#333', true: '#7C2D12' }}
          thumbColor={accelEnabled ? '#F97316' : '#666'}
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.title}>Camera (Overshoot)</Text>
          <Text style={styles.sub}>Visual pothole detection — mount required</Text>
        </View>
        <Switch
          value={cameraEnabled}
          onValueChange={setCameraEnabled}
          trackColor={{ false: '#333', true: '#7C2D12' }}
          thumbColor={cameraEnabled ? '#F97316' : '#666'}
        />
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
  sectionLabel: {
    color: '#444',
    fontSize: 9,
    letterSpacing: 3,
    fontFamily: 'monospace',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  info: { flex: 1, marginRight: 12 },
  title: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 2 },
  sub: { color: '#555', fontSize: 11, fontFamily: 'monospace' },
  badge: {
    color: '#F97316',
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#1E1E1E',
    marginVertical: 16,
  },
});
