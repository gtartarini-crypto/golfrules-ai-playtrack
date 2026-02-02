import { GeoEntity, LocalRulesData } from '../../types';

export const loadEntitiesFromProps = (
  localRulesData: LocalRulesData,
  selectedCourseId: string
): GeoEntity<any>[] => {
  console.log("[CourseSetup] Attempting to load entities for ID:", selectedCourseId);

  // 1. Percorso corretto delle geofence nel database
  //    Es: /clubs/club_pinetina/course/club_pinetina_2250
  let rawLayout =
    localRulesData.course?.[selectedCourseId] ||   // percorso reale
    localRulesData.courseLayout ||                 // fallback moderno
    null;

  // 2. Fallback legacy (solo se necessario)
  if (!rawLayout) {
    console.warn("[CourseSetup] No specific layout for ID, trying legacy fallbacks...");
    const layoutsMap = localRulesData.layouts || {};
    rawLayout =
      layoutsMap[selectedCourseId] ||
      layoutsMap['default'] ||
      layoutsMap['pinetina_18'] ||
      null;
  }

  // 3. Normalizzazione del dato
  let courseSpecific: GeoEntity<any>[] = [];

  if (Array.isArray(rawLayout)) {
    courseSpecific = rawLayout;
  } else if (rawLayout && typeof rawLayout === 'object') {
    courseSpecific = rawLayout.entities || [];
  }

  // 4. Normalizzazione metadati holeNumber
  courseSpecific = courseSpecific.map(ent => {
    const holeAtRoot = (ent as any).holeNumber;
    if (holeAtRoot !== undefined && ent.metadata?.holeNumber === undefined) {
      return { ...ent, metadata: { ...ent.metadata, holeNumber: holeAtRoot } };
    }
    return ent;
  });

  // 5. Facilities globali
  const globalFacilities = localRulesData.facilities || [];

  return [...courseSpecific, ...globalFacilities];
};
