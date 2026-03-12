import client from './client';
import { ENDPOINTS } from '../constants/api';

export type ReportSource = 'accelerometer' | 'camera' | 'human';

export interface ReportRequest {
  lat: number;
  lon: number;
  type: string;        // e.g. "pothole", "water_filled", "debris"
  confidence: number;  // 0.0 – 1.0
  source: ReportSource;
}

export interface ReportResponse {
  hazard_id: number;
  clustered: boolean;
  confidence: number;
  severity: string;
  status: string;
}

export const postReport = async (data: ReportRequest): Promise<ReportResponse> => {
  const response = await client.post<ReportResponse>(ENDPOINTS.report, data);
  return response.data;
};
