import { accelerometer, setUpdateIntervalForType, SensorTypes } from 'react-native-sensors';
import { Subscription } from 'rxjs';
import { postReport } from '../api/reports';
import { classifyImpact, impactToConfidence } from '../utils/impactClassifier';
import { useLocationStore } from '../store/useLocationStore';
import { useDetectionStore } from '../store/useDetectionStore';
import { IMPACT_DEBOUNCE_MS } from '../constants/thresholds';

class AccelerometerService {
  private subscription: Subscription | null = null;
  private lastImpactTime = 0;

  start() {
    if (this.subscription) return;

    setUpdateIntervalForType(SensorTypes.accelerometer, 100); // 10 Hz

    this.subscription = accelerometer.subscribe(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      useDetectionStore.getState().setAccelMagnitude(magnitude);

      const impact = classifyImpact(magnitude);
      if (impact === 'none') return;

      const now = Date.now();
      if (now - this.lastImpactTime < IMPACT_DEBOUNCE_MS) return; // debounce
      this.lastImpactTime = now;

      useDetectionStore.getState().recordImpact();
      this._reportImpact(impact, magnitude);
    });
  }

  stop() {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }

  private async _reportImpact(impact: 'S1' | 'S2' | 'S3', magnitude: number) {
    const { lat, lon } = useLocationStore.getState();
    if (!lat || !lon) return;

    const confidence = impactToConfidence(impact);
    try {
      await postReport({
        lat,
        lon,
        type: 'pothole',
        confidence,
        source: 'accelerometer',
      });
      if (__DEV__) console.log(`[Accel] Reported ${impact} @ ${lat},${lon} mag=${magnitude.toFixed(2)}`);
    } catch (e) {
      if (__DEV__) console.warn('[Accel] Report failed', e);
    }
  }
}

export default new AccelerometerService();
