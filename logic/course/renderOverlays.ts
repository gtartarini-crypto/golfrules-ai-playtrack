
import React from 'react';
import { GeoEntity } from '../../types';

export const SETUP_PALETTE: Record<string, string> = {
  hole: '#10b981',
  tee: '#3b82f6',
  green: '#22c55e',
  area_buca: '#f97316',
  dr: '#06b6d4',
  pg: '#84cc16',
  buvette: '#a855f7',
  pp: '#ec4899',
  oob: '#ffffff',
  approach: '#fbbf24',
  executive: '#6366f1',
};

export const getLabelText = (type: string, holeNumber?: number) => {
    const labels: Record<string, string> = {
        hole: 'PIN',
        tee: 'TEE',
        green: 'GREEN',
        area_buca: 'AREA',
        dr: 'DRIVING RANGE',
        pg: 'PUTTING GREEN',
        buvette: 'BUVETTE',
        pp: 'PITCH & PUTT',
        oob: 'FUORI LIMITE',
        approach: 'APPROACH',
        executive: 'EXECUTIVE'
    };
    const base = labels[type] || type.toUpperCase();
    return (holeNumber !== undefined && holeNumber !== null) ? `${base} BUCA ${holeNumber}` : base;
};

export const getCentroid = (path: {lat: number, lng: number}[]) => {
    if (!path || path.length === 0) return null;
    let lat = 0, lng = 0;
    path.forEach(p => { lat += p.lat; lng += p.lng; });
    return { lat: lat / path.length, lng: lng / path.length };
};

export const renderOverlays = async (
  entities: GeoEntity<any>[],
  mapInstance: any,
  overlaysRef: React.MutableRefObject<Map<string, any>>,
  activeEntityId: string | null,
  isEditing: boolean,
  deleteMode: boolean,
  showPerimeters: boolean,
  setEntities: React.Dispatch<React.SetStateAction<GeoEntity<any>[]>>,
  setHasUnsavedChanges: (val: boolean) => void,
  setActiveEntityId: (id: string | null) => void,
  handleDelete: (id: string) => void
) => {
  if (!mapInstance) return;

  const currentIds = new Set(entities.map(e => e.id));
  entities.forEach(e => currentIds.add(`label-${e.id}`));

  overlaysRef.current.forEach((obj, id) => {
    if (!currentIds.has(id)) {
      if (obj && typeof obj.setMap === 'function') obj.setMap(null);
      else if (obj) obj.map = null;
      overlaysRef.current.delete(id);
    }
  });

  for (let index = 0; index < entities.length; index++) {
    const entity = entities[index];
    let obj = overlaysRef.current.get(entity.id);
    let labelObj = overlaysRef.current.get(`label-${entity.id}`);
    const isCurrentlyActive = entity.id === activeEntityId;
    const isOtherEditing = activeEntityId !== null && !isCurrentlyActive;
    const holeNum = entity.metadata?.holeNumber ?? (entity as any).holeNumber;
    const isHidden = !showPerimeters && !isCurrentlyActive && (entity.type === 'area_buca' || entity.type === 'oob');

    if (entity.location) {
      if (!obj) {
        const { AdvancedMarkerElement } = await (window as any).google.maps.importLibrary("marker");
        const container = document.createElement('div');
        container.style.width = '32px'; container.style.height = '32px';
        container.style.position = 'relative';
        
        const color = SETUP_PALETTE[entity.type];
        container.innerHTML = `
          <div class="marker-disk" style="
              position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
              background: ${color}; width: 28px; height: 28px; border-radius: 50%; 
              border: 2px solid white; display: flex; align-items: center; justify-content: center; 
              color: white; font-weight: 900; font-size: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.5); 
              transition: all 0.2s ease; cursor: pointer;
          ">${entity.type === 'hole' ? (holeNum || '') : (entity.type === 'buvette' ? 'B' : 'P')}</div>
          <div class="marker-label" style="
              position: absolute; top: -18px; left: 50%; transform: translateX(-50%);
              background: rgba(0,0,0,0.8); color: white; padding: 2px 6px; border-radius: 4px;
              font-size: 8px; font-weight: 900; white-space: nowrap; pointer-events: none;
              border: 1px solid rgba(255,255,255,0.2);
          ">${getLabelText(entity.type, holeNum)}</div>
        `;

        obj = new AdvancedMarkerElement({
          map: isHidden ? null : mapInstance,
          position: entity.location,
          content: container,
          gmpDraggable: isEditing && !deleteMode && !isOtherEditing,
          zIndex: isCurrentlyActive ? 4000 : 1000 + index
        });

        container.onclick = (ev) => {
          ev.stopPropagation();
          if (isOtherEditing) return; 
          if (deleteMode) handleDelete(entity.id);
          else if (isEditing) setActiveEntityId(entity.id);
        };

        obj.addListener('dragend', (e: any) => {
          setHasUnsavedChanges(true);
          setEntities(prev => prev.map(ent => ent.id === entity.id ? { ...ent, location: { lat: e.latLng.lat(), lng: e.latLng.lng() } } : ent));
        });
        overlaysRef.current.set(entity.id, obj);
      } else {
        obj.position = entity.location;
        obj.map = isHidden ? null : mapInstance;
        obj.gmpDraggable = isEditing && !deleteMode && !isOtherEditing;
        obj.zIndex = isCurrentlyActive ? 4000 : 1000 + index;
        const disk = obj.content.querySelector('.marker-disk');
        const lbl = obj.content.querySelector('.marker-label');
        if (disk) {
          disk.style.opacity = isOtherEditing ? '0.1' : '1';
          disk.style.background = deleteMode ? '#ef4444' : SETUP_PALETTE[entity.type];
          if (entity.type === 'hole') disk.textContent = String(holeNum || '');
        }
        if (lbl) {
          lbl.style.display = isOtherEditing ? 'none' : 'block';
          lbl.textContent = getLabelText(entity.type, holeNum);
        }
      }
    } else if (entity.path && entity.path.length > 0) {
      const isDrawingOpen = isCurrentlyActive;
      const isOOB = entity.type === 'oob';

      if (!obj || (obj.getPaths && isDrawingOpen) || (obj.getPath && !isDrawingOpen)) {
        if (obj) obj.setMap(null);
        const options = {
          strokeColor: isOOB ? '#ffffff' : SETUP_PALETTE[entity.type],
          strokeWeight: isCurrentlyActive ? 6 : (entity.type === 'area_buca' ? 5 : 3),
          map: isHidden ? null : mapInstance,
          editable: isEditing && !deleteMode && isCurrentlyActive,
          draggable: isEditing && !deleteMode && isCurrentlyActive,
          zIndex: isCurrentlyActive ? 4000 : index,
          strokeOpacity: 1.0,
          clickable: true,
          fillColor: SETUP_PALETTE[entity.type],
          fillOpacity: isOOB ? 0 : (isOtherEditing ? 0.05 : 0.45)
        };
        if (isDrawingOpen) obj = new (window as any).google.maps.Polyline({ ...options, path: entity.path });
        else obj = new (window as any).google.maps.Polygon({ ...options, paths: entity.path });

        const updatePath = () => {
          const pathArr = obj.getPath().getArray();
          const newPath = pathArr.map((p: any) => ({ lat: p.lat(), lng: p.lng() }));
          setHasUnsavedChanges(true);
          setEntities(prev => prev.map(ent => ent.id === entity.id ? { ...ent, path: newPath } : ent));
        };

        obj.addListener('click', (ev: any) => {
          if (ev.domEvent) ev.domEvent.stopPropagation();
          if (isOtherEditing) return;
          if (deleteMode) {
            if (ev.vertex !== undefined) {
              setEntities(prev => {
                setHasUnsavedChanges(true);
                return prev.map(ent => {
                  if (ent.id === entity.id && ent.path) {
                    const newP = [...ent.path]; newP.splice(ev.vertex, 1);
                    return newP.length < 2 ? null : { ...ent, path: newP };
                  }
                  return ent;
                }).filter(e => e !== null) as GeoEntity<any>[];
              });
            } else { handleDelete(entity.id); }
            return;
          }
          if (isEditing) setActiveEntityId(entity.id);
        });

        const pathObj = obj.getPath();
        if (pathObj) {
          ['set_at', 'insert_at', 'remove_at'].forEach(evt => (window as any).google.maps.event.addListener(pathObj, evt, updatePath));
        }
        obj.addListener('dragend', updatePath);
        overlaysRef.current.set(entity.id, obj);
      } else {
        obj.setPath(entity.path);
        obj.setMap(isHidden ? null : mapInstance);
        obj.setOptions({
          editable: isEditing && !deleteMode && isCurrentlyActive,
          draggable: isEditing && !deleteMode && isCurrentlyActive,
          fillOpacity: isOOB ? 0 : (isOtherEditing ? 0.05 : 0.45),
          strokeOpacity: isOtherEditing ? 0.1 : 1.0,
          zIndex: isCurrentlyActive ? 4000 : index
        });
      }

      const centroid = getCentroid(entity.path);
      if (centroid) {
        if (!labelObj) {
          const { AdvancedMarkerElement } = await (window as any).google.maps.importLibrary("marker");
          const labelDiv = document.createElement('div');
          labelDiv.style.pointerEvents = 'none';
          labelDiv.innerHTML = `
            <div style="
                background: rgba(0,0,0,0.7); color: white; padding: 2px 8px; border-radius: 100px;
                font-size: 9px; font-weight: 900; white-space: nowrap; border: 1.5px solid ${SETUP_PALETTE[entity.type]};
                box-shadow: 0 4px 12px rgba(0,0,0,0.5); text-transform: uppercase; letter-spacing: 0.5px;
            ">${getLabelText(entity.type, holeNum)}</div>
          `;
          labelObj = new AdvancedMarkerElement({
            position: centroid,
            map: isHidden ? null : mapInstance,
            content: labelDiv,
            zIndex: isCurrentlyActive ? 5000 : 2000
          });
          overlaysRef.current.set(`label-${entity.id}`, labelObj);
        } else {
          labelObj.position = centroid;
          labelObj.map = isHidden ? null : mapInstance;
          labelObj.zIndex = isCurrentlyActive ? 5000 : 2000;
          const labelTextDiv = labelObj.content.querySelector('div');
          if (labelTextDiv) {
            labelTextDiv.style.opacity = isOtherEditing ? '0.2' : '1';
            labelTextDiv.textContent = getLabelText(entity.type, holeNum);
            labelTextDiv.style.borderColor = SETUP_PALETTE[entity.type];
          }
        }
      }
    }
  }
};
