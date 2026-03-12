import { ORS_BASE_URL, ORS_API_KEY } from '../constants/api';

export interface Coordinate {
  lat: number;
  lon: number;
}

export interface RouteResult {
  coordinates: Array<{ latitude: number; longitude: number }>;
  distanceKm: number;
  durationMin: number;
}

export async function getRoute(
  from: Coordinate,
  to: Coordinate,
): Promise<RouteResult> {
  const url = `${ORS_BASE_URL}/v2/directions/driving-car/geojson`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': ORS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      coordinates: [
        [from.lon, from.lat],
        [to.lon,   to.lat],
      ],
    }),
  });

  if (!response.ok) throw new Error(`ORS error ${response.status}`);
  const json = await response.json();

  const feature = json.features[0];
  const coords = feature.geometry.coordinates.map(
    ([lon, lat]: [number, number]) => ({ latitude: lat, longitude: lon }),
  );
  const summary = feature.properties.summary;

  return {
    coordinates: coords,
    distanceKm: summary.distance / 1000,
    durationMin: summary.duration / 60,
  };
}