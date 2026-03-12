import { ACCEL_IMPACT_THRESHOLD, SEVERITY } from '../constants/thresholds';

export type ImpactClass = 'none' | 'S1' | 'S2' | 'S3';

/**
 * Classify raw accelerometer magnitude into pothole severity.
 * Returns 'none' if below threshold (speed bump / normal road).
 */
export function classifyImpact(magnitude: number): ImpactClass {
  if (magnitude < ACCEL_IMPACT_THRESHOLD) return 'none';
  if (magnitude < ACCEL_IMPACT_THRESHOLD * 1.4) return 'S1';
  if (magnitude < ACCEL_IMPACT_THRESHOLD * 1.9) return 'S2';
  return 'S3';
}

/**
 * Convert impact class to confidence score for the backend.
 */
export function impactToConfidence(impact: ImpactClass): number {
  switch (impact) {
    case 'S1': return 0.45;
    case 'S2': return 0.65;
    case 'S3': return 0.88;
    default:   return 0;
  }
}

/**
 * Get display color for a severity label from the backend.
 */
export function severityColor(severity: string): string {
  switch (severity?.toUpperCase()) {
    case 'S1': return SEVERITY.LOW.color;
    case 'S2': return SEVERITY.MEDIUM.color;
    case 'S3': return SEVERITY.HIGH.color;
    default:   return SEVERITY.LOW.color;
  }
}

/**
 * Haversine distance in metres between two GPS coords.
 */
export function haversineMetres(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
