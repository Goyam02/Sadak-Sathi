import { useEffect, useRef } from 'react';
import { getHazards } from '../api/hazards';
import { useLocationStore } from '../store/useLocationStore';
import { useHazardStore } from '../store/useHazardStore';
import { haversineMetres } from '../utils/impactClassifier';
import { HAZARD_POLL_INTERVAL, ALERT_DISTANCE } from '../constants/thresholds';

/**
 * Polls /hazards on an interval whenever location is available.
 * Updates hazardStore and calculates nearestHazard.
 */
export function useNearbyHazards(radiusMetres = 500) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { lat, lon } = useLocationStore.getState();
      if (!lat || !lon) return;

      const store = useHazardStore.getState();
      store.setLoading(true);
      try {
        const hazards = await getHazards({ lat, lon, radius: radiusMetres });
        store.setHazards(hazards);

        // Find nearest
        let nearest = null;
        let minDist = Infinity;
        for (const h of hazards) {
          const d = haversineMetres(lat, lon, h.lat, h.lon);
          if (d < minDist) { minDist = d; nearest = h; }
        }
        store.setNearestHazard(minDist <= ALERT_DISTANCE ? nearest : null);
      } catch (e) {
        if (__DEV__) console.warn('[useNearbyHazards]', e);
      } finally {
        useHazardStore.getState().setLoading(false);
      }
    };

    fetch();
    timerRef.current = setInterval(fetch, HAZARD_POLL_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [radiusMetres]);
}
