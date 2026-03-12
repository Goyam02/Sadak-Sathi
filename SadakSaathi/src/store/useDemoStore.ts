import { create } from 'zustand';
import { Hazard } from '../api/hazards';

// ─── DEMO HAZARDS (real Delhi GPS coords) ────────────────────────────────────
export const DEMO_HAZARDS: Hazard[] = [
  { id: 1,  type: 'pothole',             severity: 'S3', lat: 28.63210, lon: 77.21980, confidence: 0.94, report_count: 23, status: 'CRITICAL_CONFIRMED' },
  { id: 2,  type: 'water_filled',        severity: 'S3', lat: 28.63150, lon: 77.22100, confidence: 0.91, report_count: 17, status: 'CRITICAL_CONFIRMED' },
  { id: 3,  type: 'pothole',             severity: 'S2', lat: 28.63080, lon: 77.21870, confidence: 0.74, report_count: 11, status: 'CONFIRMED'          },
  { id: 4,  type: 'pothole_cluster',     severity: 'S2', lat: 28.63320, lon: 77.22050, confidence: 0.68, report_count: 8,  status: 'CONFIRMED'          },
  { id: 5,  type: 'road_edge_crumble',   severity: 'S2', lat: 28.63440, lon: 77.21760, confidence: 0.71, report_count: 6,  status: 'CONFIRMED'          },
  { id: 6,  type: 'construction_debris', severity: 'S1', lat: 28.63500, lon: 77.22200, confidence: 0.55, report_count: 4,  status: 'UNCONFIRMED'        },
  { id: 7,  type: 'pothole',             severity: 'S1', lat: 28.62990, lon: 77.21650, confidence: 0.48, report_count: 3,  status: 'UNCONFIRMED'        },
  { id: 8,  type: 'pothole',             severity: 'S3', lat: 28.63600, lon: 77.22310, confidence: 0.89, report_count: 19, status: 'CRITICAL_CONFIRMED' },
  { id: 9,  type: 'water_filled',        severity: 'S2', lat: 28.62870, lon: 77.21920, confidence: 0.76, report_count: 9,  status: 'CONFIRMED'          },
  { id: 10, type: 'pothole',             severity: 'S1', lat: 28.63700, lon: 77.21500, confidence: 0.44, report_count: 2,  status: 'CANDIDATE'          },
];

// ─── DEMO CONTRACTORS ────────────────────────────────────────────────────────
export const DEMO_CONTRACTORS: Record<number, {
  name: string; contract: string; score: number; breaches: number;
  activeContracts: string; unresolved: number; vehicleDamage: string;
  trafficCost: string; totalDamage: string; dlpEnd: string; je: string;
}> = {
  1:  { name: 'M/s Delhi Road Works Pvt Ltd',  contract: 'PWD/2023/DRW/4471',  score: 28, breaches: 7, activeContracts: '₹31 Cr',  unresolved: 41, vehicleDamage: '₹8.4L',  trafficCost: '₹6.3L/day', totalDamage: '₹2.58 Cr', dlpEnd: 'Mar 2025', je: 'Sh. R.K. Sharma' },
  2:  { name: 'M/s Delhi Road Works Pvt Ltd',  contract: 'PWD/2023/DRW/4471',  score: 28, breaches: 7, activeContracts: '₹31 Cr',  unresolved: 41, vehicleDamage: '₹8.4L',  trafficCost: '₹6.3L/day', totalDamage: '₹2.58 Cr', dlpEnd: 'Mar 2025', je: 'Sh. R.K. Sharma' },
  3:  { name: 'M/s Bharat Nirman Infra Ltd',   contract: 'PWD/2022/BNI/2209',  score: 44, breaches: 3, activeContracts: '₹18 Cr',  unresolved: 19, vehicleDamage: '₹3.1L',  trafficCost: '₹2.8L/day', totalDamage: '₹0.87 Cr', dlpEnd: 'Jun 2025', je: 'Sh. A.K. Verma'  },
  4:  { name: 'M/s Bharat Nirman Infra Ltd',   contract: 'PWD/2022/BNI/2209',  score: 44, breaches: 3, activeContracts: '₹18 Cr',  unresolved: 19, vehicleDamage: '₹3.1L',  trafficCost: '₹2.8L/day', totalDamage: '₹0.87 Cr', dlpEnd: 'Jun 2025', je: 'Sh. A.K. Verma'  },
  5:  { name: 'M/s Capital Construction Co.', contract: 'MCD/2023/CCC/0881',   score: 61, breaches: 1, activeContracts: '₹9.4 Cr', unresolved: 7,  vehicleDamage: '₹1.2L',  trafficCost: '₹0.9L/day', totalDamage: '₹0.21 Cr', dlpEnd: 'Sep 2025', je: 'Sh. P. Mehta'    },
  6:  { name: 'M/s Capital Construction Co.', contract: 'MCD/2023/CCC/0881',   score: 61, breaches: 1, activeContracts: '₹9.4 Cr', unresolved: 7,  vehicleDamage: '₹1.2L',  trafficCost: '₹0.9L/day', totalDamage: '₹0.21 Cr', dlpEnd: 'Sep 2025', je: 'Sh. P. Mehta'    },
  7:  { name: 'M/s Apex Roads & Highways',    contract: 'NHAI/2023/ARH/1102',  score: 72, breaches: 0, activeContracts: '₹44 Cr',  unresolved: 3,  vehicleDamage: '₹0.6L',  trafficCost: '₹0.4L/day', totalDamage: '₹0.04 Cr', dlpEnd: 'Dec 2025', je: 'Sh. S. Gupta'    },
  8:  { name: 'M/s Delhi Road Works Pvt Ltd',  contract: 'PWD/2023/DRW/4471',  score: 28, breaches: 7, activeContracts: '₹31 Cr',  unresolved: 41, vehicleDamage: '₹8.4L',  trafficCost: '₹6.3L/day', totalDamage: '₹2.58 Cr', dlpEnd: 'Mar 2025', je: 'Sh. R.K. Sharma' },
  9:  { name: 'M/s Bharat Nirman Infra Ltd',   contract: 'PWD/2022/BNI/2209',  score: 44, breaches: 3, activeContracts: '₹18 Cr',  unresolved: 19, vehicleDamage: '₹3.1L',  trafficCost: '₹2.8L/day', totalDamage: '₹0.87 Cr', dlpEnd: 'Jun 2025', je: 'Sh. A.K. Verma'  },
  10: { name: 'M/s Apex Roads & Highways',    contract: 'NHAI/2023/ARH/1102',  score: 72, breaches: 0, activeContracts: '₹44 Cr',  unresolved: 3,  vehicleDamage: '₹0.6L',  trafficCost: '₹0.4L/day', totalDamage: '₹0.04 Cr', dlpEnd: 'Dec 2025', je: 'Sh. S. Gupta'    },
};

// ─── DEMO LOCATION ───────────────────────────────────────────────────────────
export const DEMO_LOCATION = { lat: 28.6325, lon: 77.2198 };

// ─── DEMO ROUTE ──────────────────────────────────────────────────────────────
export const DEMO_ROUTE_INFO = {
  destination:     'Saket Metro Station',
  distanceKm:      3.4,
  durationMin:     11,
  safeDistanceKm:  4.1,
  safeDurationMin: 14,
};

// ─── DEMO CAMERA DETECTIONS ──────────────────────────────────────────────────
export const DEMO_CAMERA_DETECTIONS = [
  { id: 1, label: 'Pothole — S3',      confidence: 0.94, x: 0.28, y: 0.52, w: 0.22, h: 0.13, color: '#EF4444' },
  { id: 2, label: 'Water-Filled — S3', confidence: 0.91, x: 0.55, y: 0.58, w: 0.18, h: 0.10, color: '#EF4444' },
  { id: 3, label: 'Road Crack — S2',   confidence: 0.76, x: 0.10, y: 0.62, w: 0.20, h: 0.07, color: '#F97316' },
  { id: 4, label: 'Pothole — S2',      confidence: 0.73, x: 0.62, y: 0.45, w: 0.16, h: 0.09, color: '#F97316' },
  { id: 5, label: 'Road Edge Crumble', confidence: 0.68, x: 0.38, y: 0.70, w: 0.24, h: 0.06, color: '#F59E0B' },
  { id: 6, label: 'Debris on Road',    confidence: 0.61, x: 0.15, y: 0.48, w: 0.14, h: 0.08, color: '#F59E0B' },
];

// ─── DEMO ACCEL SEQUENCE ─────────────────────────────────────────────────────
export const DEMO_ACCEL_SEQUENCE = [
  9.82, 9.85, 9.81, 9.84, 9.83,
  9.87, 9.90, 9.88, 9.86,
  10.2, 10.8, 11.4, 12.1,
  18.7,                          // IMPACT S2
  14.2, 11.8, 10.4, 9.95, 9.86,
  9.83, 9.81, 9.84, 9.82,
  9.88, 10.1, 10.6, 11.2, 11.9,
  21.4,                          // IMPACT S3
  16.8, 13.2, 11.0, 10.1, 9.88,
  9.82, 9.84, 9.83, 9.81, 9.85,
];

// ─── DEMO MORNING BRIEF ──────────────────────────────────────────────────────
export const DEMO_MORNING_BRIEF = {
  newOvernightPotholes: 2,
  recommendedLeaveTime: '8:10 PM',
  alternateRoute:       'Alternate B — adds 5 min, 0 hazards',
  rainForecast:         'Rain at 8 AM — wet road severity HIGH',
  trafficAlert:         'Heavy traffic from 8:45 AM at Dhaula Kuan',
};

// ─── STORE ───────────────────────────────────────────────────────────────────
interface DemoState {
  isDemoMode: boolean;
  toggleMode: () => void;
  setMode: (v: boolean) => void;
}

export const useDemoStore = create<DemoState>(set => ({
  isDemoMode: true,
  toggleMode: () => set(s => ({ isDemoMode: !s.isDemoMode })),
  setMode: (isDemoMode) => set({ isDemoMode }),
}));
