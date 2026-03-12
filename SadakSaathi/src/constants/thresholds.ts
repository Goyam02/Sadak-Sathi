import {
  ACCEL_THRESHOLD,
  CLUSTER_RADIUS_M,
  HAZARD_POLL_INTERVAL_MS,
  ALERT_DISTANCE_M,
} from '@env';

// Accelerometer: minimum m/s² vertical spike to classify as impact
export const ACCEL_IMPACT_THRESHOLD = parseFloat(ACCEL_THRESHOLD ?? '12');

// Metres radius within which two reports are considered the same pothole
export const CLUSTER_RADIUS = parseInt(CLUSTER_RADIUS_M ?? '8', 10);

// Map screen polls /hazards every N milliseconds
export const HAZARD_POLL_INTERVAL = parseInt(HAZARD_POLL_INTERVAL_MS ?? '15000', 10);

// Voice alert fires when user is within this many metres of a hazard
export const ALERT_DISTANCE = parseInt(ALERT_DISTANCE_M ?? '400', 10);

// Severity thresholds (confidence score from backend)
export const SEVERITY = {
  LOW:      { min: 0,   max: 0.4,  label: 'S1', color: '#F59E0B' },
  MEDIUM:   { min: 0.4, max: 0.7,  label: 'S2', color: '#F97316' },
  HIGH:     { min: 0.7, max: 0.9,  label: 'S3', color: '#EF4444' },
  CRITICAL: { min: 0.9, max: 1.0,  label: 'S3+', color: '#DC2626' },
} as const;

// Accelerometer: how many ms to debounce after an impact event
export const IMPACT_DEBOUNCE_MS = 3000;

// Camera: send frame to Overshoot every N ms when mounted
export const CAMERA_INFERENCE_INTERVAL_MS = 500;
