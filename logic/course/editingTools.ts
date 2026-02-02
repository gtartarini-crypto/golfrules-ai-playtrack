
import React from 'react';
import { GeoEntity } from '../../types';

export const handleDelete = (
  id: string,
  setEntities: React.Dispatch<React.SetStateAction<GeoEntity<any>[]>>,
  setHasUnsavedChanges: (val: boolean) => void,
  setHistory: React.Dispatch<React.SetStateAction<GeoEntity<any>[][]>>,
  activeEntityId: string | null,
  setActiveEntityId: (id: string | null) => void
) => {
  setEntities(prev => {
    setHasUnsavedChanges(true);
    setHistory(h => [...h, prev].slice(-20));
    return prev.filter(e => e.id !== id);
  });
  if (activeEntityId === id) setActiveEntityId(null);
};

export const handleUndoPoint = (
  activeEntityId: string | null,
  setActiveEntityId: (id: string | null) => void,
  setEntities: React.Dispatch<React.SetStateAction<GeoEntity<any>[]>>,
  setHasUnsavedChanges: (val: boolean) => void,
  history: GeoEntity<any>[][],
  setHistory: React.Dispatch<React.SetStateAction<GeoEntity<any>[][]>>
) => {
  if (activeEntityId) {
    setEntities(prev => {
      setHasUnsavedChanges(true);
      return prev.map(ent => {
        if (ent.id === activeEntityId && ent.path) {
          const newP = ent.path.slice(0, -1);
          if (newP.length === 0) {
            setTimeout(() => setActiveEntityId(null), 0);
            return ent;
          }
          return { ...ent, path: newP };
        }
        return ent;
      }).filter(ent => ent.id !== activeEntityId || (ent.path && ent.path.length > 0)) as GeoEntity<any>[];
    });
  } else if (history.length > 0) {
    setEntities(history[history.length - 1]);
    setHistory(prev => prev.slice(0, -1));
    setHasUnsavedChanges(true);
  }
};
