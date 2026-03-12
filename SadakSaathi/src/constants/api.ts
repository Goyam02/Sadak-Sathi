import { BACKEND_URL, OPENROUTE_API_KEY } from '@env';

export const BASE_URL = BACKEND_URL ?? 'http://localhost:8000';

export const ENDPOINTS = {
  hazards: '/hazards',
  report:  '/report',
  health:  '/health',
} as const;

export const ORS_BASE_URL = 'https://api.openrouteservice.org';
export const ORS_API_KEY = OPENROUTE_API_KEY ?? '';