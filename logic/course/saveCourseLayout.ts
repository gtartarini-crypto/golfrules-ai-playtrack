import { GeoEntity, LocalRulesData } from '../../types';

const GLOBAL_TYPES = ['dr', 'pg', 'buvette', 'pp', 'executive', 'oob'];

export const handleSaveAll = (
  entities: GeoEntity<any>[],
  selectedCourseId: string,
  localRulesData: LocalRulesData,
  onSave: (data: LocalRulesData) => void
) => {
  const courseEntities = entities.filter(ent => {
    const h = ent.metadata?.holeNumber ?? (ent as any).holeNumber;
    return (h !== undefined && h !== null) && !GLOBAL_TYPES.includes(ent.type);
  });
  
  const facilities = entities.filter(ent => {
    const h = ent.metadata?.holeNumber ?? (ent as any).holeNumber;
    return (h === undefined || h === null) || GLOBAL_TYPES.includes(ent.type);
  });
  
  onSave({ 
    ...localRulesData, 
    layouts: { 
      ...(localRulesData.layouts || {}), 
      [selectedCourseId]: { entities: courseEntities } 
    }, 
    facilities 
  });
};