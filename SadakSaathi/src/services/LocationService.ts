import * as Location from 'expo-location';
import { useLocationStore } from '../store/useLocationStore';

class LocationService {
  private subscription: any = null;

  async start() {
    if (this.subscription) return;

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('[LocationService] Permission denied');
      return;
    }

    this.subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 5,
        timeInterval: 2000,
      },
      position => {
        const { latitude, longitude, heading, speed } = position.coords;
        useLocationStore
          .getState()
          .setLocation(latitude, longitude, heading ?? undefined, speed ?? undefined);
      },
    );
  }

  stop() {
    this.subscription?.remove();
    this.subscription = null;
  }
}

export default new LocationService();