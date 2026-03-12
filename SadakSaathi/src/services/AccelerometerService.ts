import { Accelerometer } from 'expo-sensors';
import { postReport } from '../api/reports';
import { classifyImpact, impactToConfidence } from '../utils/impactClassifier';
import { useLocationStore } from '../store/useLocationStore';
import { useDetectionStore } from '../store/useDetectionStore';
import { IMPACT_DEBOUNCE_MS } from '../constants/thresholds';

class AccelerometerService {
  private subscription: any = null;
  private lastImpactTime = 0;

  start() {
    if (this.subscription) return;
    Accelerometer.setUpdateInterval(100);

    this.subscription = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      useDetectionStore.getState().setAccelMagnitude(magnitude);

      const impact = classifyImpact(magnitude);
      if (impact === 'none') return;

      const now = Date.now();
      if (now - this.lastImpactTime < IMPACT_DEBOUNCE_MS) return;
      this.lastImpactTime = now;

      useDetectionStore.getState().recordImpact();
      this._reportImpact(impact, magnitude);
    });
  }

  stop() {
    this.subscription?.remove();
    this.subscription = null;
  }

  private async _reportImpact(impact: 'S1' | 'S2' | 'S3', magnitude: number) {
    const { lat, lon } = useLocationStore.getState();
    if (!lat || !lon) return;

    try {
      await postReport({
        lat,
        lon,
        type: 'pothole',
        confidence: impactToConfidence(impact),
        source: 'accelerometer',
      });
    } catch (e) {
      if (__DEV__) console.warn('[Accel] Report failed', e);
    }
  }
}

export default new AccelerometerService();