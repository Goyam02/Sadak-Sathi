import { create } from 'zustand';
import { Hazard } from '../api/hazards';

interface HazardState {
  hazards: Hazard[];
  lastFetched: number | null;
  isLoading: boolean;
  nearestHazard: Hazard | null;
  setHazards: (hazards: Hazard[]) => void;
  setLoading: (v: boolean) => void;
  setNearestHazard: (h: Hazard | null) => void;
}

export const useHazardStore = create<HazardState>(set => ({
  hazards: [],
  lastFetched: null,
  isLoading: false,
  nearestHazard: null,
  setHazards: hazards => set({ hazards, lastFetched: Date.now() }),
  setLoading: isLoading => set({ isLoading }),
  setNearestHazard: nearestHazard => set({ nearestHazard }),
}));
