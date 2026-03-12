import { create } from 'zustand';

interface LocationState {
  lat: number | null;
  lon: number | null;
  heading: number | null;
  speed: number | null;          // m/s
  lastUpdated: number | null;    // epoch ms
  setLocation: (lat: number, lon: number, heading?: number, speed?: number) => void;
}

export const useLocationStore = create<LocationState>(set => ({
  lat: null,
  lon: null,
  heading: null,
  speed: null,
  lastUpdated: null,
  setLocation: (lat, lon, heading = null, speed = null) =>
    set({ lat, lon, heading, speed, lastUpdated: Date.now() }),
}));
