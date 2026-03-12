import client from './client';
import { ENDPOINTS } from '../constants/api';

export interface Hazard {
  id: number;
  type: string;
  severity: string;
  lat: number;
  lon: number;
  confidence?: number;
  report_count?: number;
  status?: string;
}

export interface GetHazardsParams {
  lat: number;
  lon: number;
  radius?: number; // metres, default 500 on backend
}

export const getHazards = async (params: GetHazardsParams): Promise<Hazard[]> => {
  const response = await client.get<Hazard[]>(ENDPOINTS.hazards, { params });
  return response.data;
};
