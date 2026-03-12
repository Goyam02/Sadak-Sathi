import Geolocation from '@react-native-community/geolocation';
import { useLocationStore } from '../store/useLocationStore';

class LocationService {
  private watchId: number | null = null;

  start() {
    if (this.watchId !== null) return;

    Geolocation.requestAuthorization();

    this.watchId = Geolocation.watchPosition(
      position => {
        const { latitude, longitude, heading, speed } = position.coords;
        useLocationStore
          .getState()
          .setLocation(latitude, longitude, heading ?? undefined, speed ?? undefined);
      },
      error => {
        if (__DEV__) console.warn('[LocationService] error', error);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 5,       // update every 5 metres
        interval: 2000,          // Android: every 2s
        fastestInterval: 1000,
      },
    );
  }

  stop() {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }
}

export default new LocationService();
