import { create } from 'zustand';

export type AlertLevel = 'none' | 'warning' | 'critical';

interface DetectionState {
  // Toggles
  accelEnabled: boolean;
  cameraEnabled: boolean;

  // Live accel reading
  accelMagnitude: number;
  lastImpactAt: number | null;     // epoch ms of last detected impact
  impactCount: number;             // session total

  // Alert state
  alertLevel: AlertLevel;
  alertMessage: string;
  alertHazardId: number | null;

  // Actions
  setAccelEnabled: (v: boolean) => void;
  setCameraEnabled: (v: boolean) => void;
  setAccelMagnitude: (v: number) => void;
  recordImpact: () => void;
  setAlert: (level: AlertLevel, message: string, hazardId?: number) => void;
  clearAlert: () => void;
}

export const useDetectionStore = create<DetectionState>(set => ({
  accelEnabled: true,
  cameraEnabled: false,
  accelMagnitude: 0,
  lastImpactAt: null,
  impactCount: 0,
  alertLevel: 'none',
  alertMessage: '',
  alertHazardId: null,

  setAccelEnabled: v => set({ accelEnabled: v }),
  setCameraEnabled: v => set({ cameraEnabled: v }),
  setAccelMagnitude: v => set({ accelMagnitude: v }),
  recordImpact: () =>
    set(s => ({ lastImpactAt: Date.now(), impactCount: s.impactCount + 1 })),
  setAlert: (alertLevel, alertMessage, alertHazardId = null) =>
    set({ alertLevel, alertMessage, alertHazardId }),
  clearAlert: () =>
    set({ alertLevel: 'none', alertMessage: '', alertHazardId: null }),
}));
