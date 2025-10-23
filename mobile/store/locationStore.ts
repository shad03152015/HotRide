import { create } from 'zustand';
import * as Location from 'expo-location';

/**
 * Location state management with Zustand
 */

interface LocationState {
  hasLocationPermission: boolean;
  currentLocation: {
    latitude: number;
    longitude: number;
  } | null;
  isLoadingLocation: boolean;

  setLocationPermission: (hasPermission: boolean) => void;
  setCurrentLocation: (location: { latitude: number; longitude: number }) => void;
  requestLocationPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<void>;
  setLoadingLocation: (loading: boolean) => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  hasLocationPermission: false,
  currentLocation: null,
  isLoadingLocation: false,

  setLocationPermission: (hasPermission: boolean) => {
    set({ hasLocationPermission: hasPermission });
  },

  setCurrentLocation: (location: { latitude: number; longitude: number }) => {
    set({ currentLocation: location });
  },

  setLoadingLocation: (loading: boolean) => {
    set({ isLoadingLocation: loading });
  },

  requestLocationPermission: async () => {
    try {
      set({ isLoadingLocation: true });

      // Request foreground location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();

      const granted = status === 'granted';
      set({ hasLocationPermission: granted });

      if (granted) {
        // Get current location
        await get().getCurrentLocation();
      }

      return granted;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    } finally {
      set({ isLoadingLocation: false });
    }
  },

  getCurrentLocation: async () => {
    try {
      set({ isLoadingLocation: true });

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      set({
        currentLocation: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
      });
    } catch (error) {
      console.error('Error getting current location:', error);
    } finally {
      set({ isLoadingLocation: false });
    }
  },
}));
