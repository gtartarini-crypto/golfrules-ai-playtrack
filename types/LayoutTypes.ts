
import { GeoEntity } from '../types';

export interface CourseLayoutData {
  entities: GeoEntity<any>[];
}

export interface CourseData {
  layouts: GeoEntity<any>[];
  facilities: GeoEntity<any>[];
  geofences: GeoEntity<any>[];
}

export interface ClubFacilities {
  globalFacilities: GeoEntity<any>[];
}
