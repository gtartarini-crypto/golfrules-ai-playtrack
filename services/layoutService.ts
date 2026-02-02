import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { dbData } from './firebase';
import { GeoEntity } from '../types';
import { fromFirestoreGeo, toFirestoreGeo } from './dataUtils';

const GLOBAL_TYPES = ['dr', 'pg', 'buvette', 'pp', 'executive', 'oob'];

/**
 * Recupera il layout di un percorso e le facility globali del club
 */
export const getCourseLayout = async (clubId: string, courseId: string): Promise<{
  layouts: GeoEntity<any>[];
  geofences: GeoEntity<any>[];
}> => {
  if (!dbData || !clubId || !courseId) return { layouts: [], geofences: [] };

  try {
    // 1. Tenta lettura nel nuovo path specifico del percorso
    const courseRef = doc(dbData, 'clubs', clubId, 'course', courseId);
    const courseSnap = await getDoc(courseRef);

    if (courseSnap.exists()) {
      const data = courseSnap.data();
      return {
        layouts: fromFirestoreGeo(data.layouts || []),
        geofences: fromFirestoreGeo(data.geofences || [])
      };
    }

    // 2. Fallback legacy: legge dal campo layouts nel documento radice del club
    const clubRef = doc(dbData, 'clubs', clubId);
    const clubSnap = await getDoc(clubRef);

    if (clubSnap.exists()) {
      const clubData = clubSnap.data();
      const legacyLayouts = clubData.layouts || {};
      const courseData = legacyLayouts[courseId];

      if (courseData && courseData.entities) {
        const entities = fromFirestoreGeo(courseData.entities);
        return {
          layouts: entities,
          geofences: entities.filter((e: GeoEntity) => !!e.path)
        };
      }
    }
  } catch (e) {
    console.error("[LayoutService] Error fetching course layout:", e);
  }

  return { layouts: [], geofences: [] };
};

/**
 * Recupera le facility globali del club
 */
export const getClubFacilities = async (clubId: string): Promise<GeoEntity<any>[]> => {
  if (!dbData || !clubId) return [];
  try {
    const clubRef = doc(dbData, 'clubs', clubId);
    const snap = await getDoc(clubRef);
    if (snap.exists()) {
      return fromFirestoreGeo(snap.data().facilities || []);
    }
  } catch (e) {
    console.error("[LayoutService] Error fetching facilities:", e);
  }
  return [];
};

/**
 * Salva il layout del percorso, deriva i geofence e aggiorna le facility globali
 */
export const saveCourseLayout = async (
  clubId: string, 
  courseId: string, 
  allEntities: GeoEntity<any>[]
) => {
  if (!dbData || !clubId || !courseId) return;

  try {
    // Separazione entità
    const courseEntities = allEntities.filter(ent => 
      (ent.metadata?.holeNumber !== undefined) || 
      !GLOBAL_TYPES.includes(ent.type)
    );
    
    const globalFacilities = allEntities.filter(ent => 
      GLOBAL_TYPES.includes(ent.type) && ent.metadata?.holeNumber === undefined
    );

    // Derivazione Geofences (solo poligoni del percorso)
    const geofences = courseEntities.filter(ent => !!ent.path);

    // 1. Salvataggio documento percorso
    const courseRef = doc(dbData, 'clubs', clubId, 'course', courseId);
    await setDoc(courseRef, {
      layouts: toFirestoreGeo(courseEntities),
      geofences: toFirestoreGeo(geofences),
      updated_at: serverTimestamp()
    }, { merge: true });

    // 2. Salvataggio/Update facility globali nel documento club
    const clubRef = doc(dbData, 'clubs', clubId);
    await setDoc(clubRef, {
      facilities: toFirestoreGeo(globalFacilities),
      updated_at: serverTimestamp()
    }, { merge: true });

  } catch (e) {
    console.error("[LayoutService] Error saving course layout:", e);
    throw e;
  }
};
