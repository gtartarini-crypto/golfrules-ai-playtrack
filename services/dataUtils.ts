
import { GeoPoint } from 'firebase/firestore';

/**
 * Algoritmo di Ray-casting per determinare se un punto è all'interno di un poligono.
 */
export const isPointInPolygon = (point: {lat: number, lng: number}, polygon: {lat: number, lng: number}[]) => {
    let isInside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lat, yi = polygon[i].lng;
        const xj = polygon[j].lat, yj = polygon[j].lng;
        
        const intersect = ((yi > point.lng) !== (yj > point.lng))
            && (point.lat < (xj - xi) * (point.lng - yi) / (yj - yi) + xi);
        if (intersect) isInside = !isInside;
    }
    return isInside;
};

/**
 * Converte dati in formato Firestore-friendly.
 */
export const toFirestoreGeo = (data: any): any => {
  if (data === null || data === undefined) return null;
  if (data instanceof GeoPoint) return data;
  if (Array.isArray(data)) return data.map(item => toFirestoreGeo(item));
  if (typeof data === 'object') {
    const converted: any = {};
    const forbidden = ['_lat', '_long'];
    Object.keys(data).forEach(key => {
      if (!forbidden.includes(key)) converted[key] = toFirestoreGeo(data[key]);
    });
    const latVal = data.latitude !== undefined ? data.latitude : data.lat;
    const lngVal = data.longitude !== undefined ? data.longitude : data.lng;
    if (latVal !== undefined && lngVal !== undefined) {
      const lat = parseFloat(latVal);
      const lng = parseFloat(lngVal);
      if (!isNaN(lat) && !isNaN(lng)) {
        converted.location = new GeoPoint(lat, lng);
        converted.latitude = lat;
        converted.longitude = lng;
      }
    }
    return converted;
  }
  return data;
};

/**
 * Converte dati da Firestore al frontend.
 */
export const fromFirestoreGeo = (data: any): any => {
  if (data === null || data === undefined) return null;
  if (data instanceof GeoPoint) return { lat: data.latitude, lng: data.longitude };
  if (Array.isArray(data)) return data.map(item => fromFirestoreGeo(item));
  if (typeof data === 'object') {
    const converted: any = {};
    Object.keys(data).forEach(key => {
      converted[key] = fromFirestoreGeo(data[key]);
    });
    if (data.location instanceof GeoPoint) {
        converted.latitude = data.location.latitude;
        converted.longitude = data.location.longitude;
    }
    return converted;
  }
  return data;
};
