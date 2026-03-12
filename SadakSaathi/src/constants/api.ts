import { BACKEND_URL } from '@env';

export const BASE_URL = BACKEND_URL ?? 'http://localhost:8000';

export const ENDPOINTS = {
  hazards: '/hazards',
  report:  '/report',
  health:  '/health',
} as const;
