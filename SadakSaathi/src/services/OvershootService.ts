import { AZURE_VISION_ENDPOINT, AZURE_VISION_KEY } from '@env';
import { postReport } from '../api/reports';
import { useLocationStore } from '../store/useLocationStore';
import { useDetectionStore } from '../store/useDetectionStore';
import { CAMERA_INFERENCE_INTERVAL_MS } from '../constants/thresholds';

const ANALYZE_URL = `${AZURE_VISION_ENDPOINT}/computervision/imageanalysis:analyze?api-version=2023-02-01-preview&features=tags,objects`;

export interface OvershootResult {
  hasPothole: boolean;
  confidence: number;
  label: string;
}

class OvershootService {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private busy = false;

  /**
   * Call this with a base64 JPEG frame from VisionCamera.
   * Used in one-shot mode from CameraScreen.
   */
  async analyzeFrame(base64Jpeg: string): Promise<OvershootResult> {
    const body = Buffer.from(base64Jpeg, 'base64');
    const res = await fetch(ANALYZE_URL, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_VISION_KEY,
        'Content-Type': 'application/octet-stream',
      },
      body,
    });

    if (!res.ok) throw new Error(`Overshoot API ${res.status}`);
    const json = await res.json();

    // Look for pothole/road-damage tags in the response
    const tags: Array<{ name: string; confidence: number }> =
      json.tagsResult?.values ?? [];

    const POTHOLE_KEYWORDS = ['pothole', 'road damage', 'crack', 'hole', 'damaged road'];
    let best = { name: 'none', confidence: 0 };

    for (const tag of tags) {
      if (
        POTHOLE_KEYWORDS.some(k => tag.name.toLowerCase().includes(k)) &&
        tag.confidence > best.confidence
      ) {
        best = tag;
      }
    }

    return {
      hasPothole: best.confidence > 0.6,
      confidence: best.confidence,
      label: best.name,
    };
  }

  /**
   * Start interval-based inference. CameraScreen passes frames via the
   * frameCallback so service stays UI-agnostic.
   */
  startIntervalMode(getFrame: () => string | null) {
    if (this.intervalId) return;
    this.intervalId = setInterval(async () => {
      if (this.busy) return;
      const frame = getFrame();
      if (!frame) return;

      this.busy = true;
      try {
        const result = await this.analyzeFrame(frame);
        if (result.hasPothole) {
          const { lat, lon } = useLocationStore.getState();
          if (lat && lon) {
            await postReport({
              lat,
              lon,
              type: 'pothole',
              confidence: result.confidence,
              source: 'camera',
            });
            useDetectionStore
              .getState()
              .setAlert('warning', `Pothole detected ahead — ${result.label}`, undefined);
          }
        }
      } catch (e) {
        if (__DEV__) console.warn('[OvershootService]', e);
      } finally {
        this.busy = false;
      }
    }, CAMERA_INFERENCE_INTERVAL_MS);
  }

  stopIntervalMode() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export default new OvershootService();
