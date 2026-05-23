import { create } from 'zustand';

interface LocationState {
  userLocation: { lat: number; lng: number } | null;
  setUserLocation: (lat: number, lng: number) => void;
  clearUserLocation: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  userLocation: null,
  setUserLocation: (lat, lng) => set({ userLocation: { lat, lng } }),
  clearUserLocation: () => set({ userLocation: null }),
}));
