import React, { useEffect, useRef, useState, useMemo } from 'react';
import { ArrowLeft, Save, Pentagon, Coffee, Flag, BoxSelect, Target, Spline, TriangleAlert, Trash2, Undo2, MapPin, CheckCircle2, Eye, EyeOff, MousePointer2 } from 'lucide-react';
import { Language, UserProfile, LocalRulesData, GeoEntity } from '../../types';

// Modular Logic Imports
import { loadEntitiesFromProps } from '../../logic/course/loadEntities';
import { handleSaveAll } from '../../logic/course/saveCourseLayout';
import { handleDelete, handleUndoPoint } from '../../logic/course/editingTools';
import { handleHoleSelection } from '../../logic/course/holeSelection';
import { renderOverlays, SETUP_PALETTE } from '../../logic/course/renderOverlays';

type SetupMode = 'hole' | 'tee' | 'area_buca' | 'green' | 'dr' | 'pg' | 'buvette' | 'pp' | 'oob' | 'approach' | 'executive';
const GLOBAL_TYPES = ['dr', 'pg', 'buvette', 'pp', 'executive', 'oob'];

export const CourseSetup: React.FC<{
  user: UserProfile | null,
  localRulesData: LocalRulesData,
  onBack: () => void,
  lang: Language,
  onSave: (data: LocalRulesData) => void
}> = ({ localRulesData, onBack, lang, onSave }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const overlaysRef = useRef<Map<string, any>>(new Map());
  
  const [selectedCourseId, setSelectedCourseId] = useState<string>(localRulesData.subCourses?.[0]?.id || 'default');
  const [mode, setMode] = useState<SetupMode>('hole');
  const [isEditing, setIsEditing] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [showPerimeters, setShowPerimeters] = useState(true);
  
  const [entities, setEntities] = useState<GeoEntity<any>[]>([]);
  const [activeEntityId, setActiveEntityId] = useState<string | null>(null);
  const [selectedHole, setSelectedHole] = useState<number>(1);
  const [history, setHistory] = useState<GeoEntity<any>[][]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const stateRef = useRef({ isEditing, deleteMode, entities, selectedHole, mode, activeEntityId });
  useEffect(() => {
    stateRef.current = { isEditing, deleteMode, entities, selectedHole, mode, activeEntityId };
  }, [isEditing, deleteMode, entities, selectedHole, mode, activeEntityId]);

  const loadEntities = () => {
    const loadedEntities = loadEntitiesFromProps(localRulesData, selectedCourseId);
    setEntities(loadedEntities);
    setHistory([]);
    setActiveEntityId(null);
    setHasUnsavedChanges(false);
  };

  useEffect(() => {
    loadEntities();
    const currentSub = localRulesData.subCourses?.find(c => c.id === selectedCourseId);
    if (currentSub) setSelectedHole(currentSub.startHole || 1);
  }, [selectedCourseId, localRulesData.club, localRulesData.layouts, localRulesData.courseLayout]);

  useEffect(() => {
    if (!mapRef.current || !(window as any).google || mapInstanceRef.current) return;
    
    mapInstanceRef.current = new (window as any).google.maps.Map(mapRef.current, {
      center: { lat: localRulesData.latitude || 45.7123, lng: localRulesData.longitude || 9.0234 },
      zoom: 17,
      mapTypeId: 'hybrid',
      mapId: 'COURSE_SETUP_PRO_V30',
      disableDefaultUI: true,
      zoomControl: true,
      tilt: 0
    });

    mapInstanceRef.current.addListener('click', (e: any) => {
      const s = stateRef.current;
      if (!s.isEditing || s.deleteMode) return;

      const clickLat = e.latLng.lat();
      const clickLng = e.latLng.lng();

      setEntities(prev => {
        const isPointType = ['hole', 'buvette'].includes(s.mode);
        
        if (isPointType) {
            setHasUnsavedChanges(true);
            setHistory(h => [...h, prev].slice(-20));
            const isGlobal = s.mode === 'buvette';
            const existingIdx = prev.findIndex(ent => ent.type === s.mode && (isGlobal ? false : (ent.metadata?.holeNumber === s.selectedHole || (ent as any).holeNumber === s.selectedHole)));
            
            const newEntity = {
                id: `${s.mode}-${isGlobal ? 'global' : s.selectedHole}-${Date.now()}`,
                type: s.mode,
                location: { lat: clickLat, lng: clickLng },
                metadata: { holeNumber: isGlobal ? undefined : s.selectedHole, createdAt: new Date().toISOString() }
            };

            if (existingIdx > -1 && s.mode === 'hole') {
                const updated = [...prev];
                updated[existingIdx] = newEntity;
                return updated;
            }
            return [...prev, newEntity];
        } else {
            if (s.activeEntityId) {
                const entity = prev.find(ent => ent.id === s.activeEntityId);
                if (entity && entity.type === s.mode) {
                    if (entity.path && entity.path.length >= 3) {
                        const first = entity.path[0];
                        const dist = (window as any).google.maps.geometry.spherical.computeDistanceBetween(
                            e.latLng,
                            new (window as any).google.maps.LatLng(first.lat, first.lng)
                        );
                        if (dist < (400000 / Math.pow(2, mapInstanceRef.current.getZoom()))) {
                            setActiveEntityId(null);
                            return prev;
                        }
                    }
                    setHasUnsavedChanges(true);
                    return prev.map(ent => (ent.id === s.activeEntityId ? { ...ent, path: [...(ent.path || []), { lat: clickLat, lng: clickLng }] } : ent));
                }
            }
            
            setHasUnsavedChanges(true);
            setHistory(h => [...h, prev].slice(-20));
            const newId = `${s.mode}-${Date.now()}`;
            setActiveEntityId(newId);
            const needsHole = !GLOBAL_TYPES.includes(s.mode);
            return [...prev, {
                id: newId,
                type: s.mode,
                path: [{ lat: clickLat, lng: clickLng }],
                metadata: { holeNumber: needsHole ? s.selectedHole : undefined, createdAt: new Date().toISOString() }
            }];
        }
      });
    });
  }, []);

  useEffect(() => {
    renderOverlays(
      entities,
      mapInstanceRef.current,
      overlaysRef,
      activeEntityId,
      isEditing,
      deleteMode,
      showPerimeters,
      setEntities,
      setHasUnsavedChanges,
      setActiveEntityId,
      (id) => handleDelete(id, setEntities, setHasUnsavedChanges, setHistory, activeEntityId, setActiveEntityId)
    );
  }, [entities, isEditing, deleteMode, activeEntityId, showPerimeters]);

  const onSaveAll = () => {
    handleSaveAll(entities, selectedCourseId, localRulesData, onSave);
    setHasUnsavedChanges(false); 
    setIsEditing(false); 
    setActiveEntityId(null);
  };

  const handleDiscardChanges = () => {
    if (!hasUnsavedChanges || window.confirm("Annullare le modifiche?")) {
        loadEntities(); setIsEditing(false); setActiveEntityId(null); setDeleteMode(false);
    }
  };

  const holeNumbers = useMemo(() => {
    const sub = localRulesData.subCourses?.find(c => c.id === selectedCourseId) || { startHole: 1, holesCount: 18 };
    return Array.from({ length: sub.holesCount }, (_, i) => sub.startHole + i);
  }, [selectedCourseId, localRulesData]);

  return (
    <div className="h-screen bg-slate-950 flex flex-col font-sans overflow-hidden">
      <header className="bg-emerald-950 border-b border-white/10 px-4 py-2.5 flex items-center justify-between z-30 shadow-2xl">
        <div className="flex items-center gap-4">
          <button onClick={() => hasUnsavedChanges ? (window.confirm("Esci senza salvare?") && onBack()) : onBack()} className="p-2 text-white/50 hover:text-white transition-colors bg-white/5 rounded-xl"><ArrowLeft size={20} /></button>
          <div className="flex flex-col">
            <h1 className="text-xs font-black text-white uppercase tracking-widest leading-none">{localRulesData.club}</h1>
            <div className="flex items-center gap-2 mt-1">
              <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)} className="bg-slate-900 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border border-white/10 outline-none">
                  {localRulesData.subCourses?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing && (
              <button onClick={() => setShowPerimeters(!showPerimeters)} className={`p-2 rounded-xl border transition-all ${showPerimeters ? 'bg-white/10 text-white border-white/20' : 'bg-amber-500/20 text-amber-500 border-amber-500/40'}`}>
                {showPerimeters ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
          )}
          {isEditing ? (
            <div className="flex items-center gap-2">
              <button onClick={handleDiscardChanges} className="px-3 py-1.5 text-white/60 text-[10px] font-black uppercase hover:text-white transition-colors">Esci</button>
              <button onClick={onSaveAll} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl"><Save size={14} /> Salva Tutto</button>
            </div>
          ) : (
            <button onClick={() => setIsEditing(true)} className="bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">Modifica Mappa</button>
          )}
        </div>
      </header>

      <div className="bg-slate-900 border-b border-white/5 p-2 flex flex-col gap-2 z-20 shadow-xl">
        {isEditing && (
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                   <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase flex items-center gap-2 ${deleteMode ? 'bg-red-500 text-white' : 'bg-emerald-500/10 text-emerald-500'}`}>
                       {deleteMode ? <Trash2 size={12}/> : (activeEntityId ? <Spline size={12}/> : <MousePointer2 size={12}/>)}
                       {deleteMode ? 'MODALITÀ ELIMINA' : (activeEntityId ? 'DISEGNO IN CORSO...' : 'SELEZIONA STRUMENTO')}
                   </div>
                </div>
                <button 
                   onClick={() => { setDeleteMode(!deleteMode); setActiveEntityId(null); }} 
                   className={`flex items-center gap-2 px-6 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-xl ${deleteMode ? 'bg-white text-slate-950 ring-2 ring-white/20' : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white'}`}
                >
                    <Trash2 size={14} /> {deleteMode ? 'FINE ELIMINAZIONE' : 'ELIMINA OGGETTI'}
                </button>
            </div>
        )}

        {isEditing && !deleteMode && (
          <div className="flex flex-col gap-1.5 border-t border-white/5 pt-1.5">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 px-2">
                <ModeBtn active={mode === 'dr' && !activeEntityId} onClick={() => { setMode('dr'); setActiveEntityId(null); }} icon={<Target size={14}/>} label="DR" color="bg-cyan-500" />
                <ModeBtn active={mode === 'pg' && !activeEntityId} onClick={() => { setMode('pg'); setActiveEntityId(null); }} icon={<Flag size={14}/>} label="PG" color="bg-lime-500" />
                <ModeBtn active={mode === 'buvette' && !activeEntityId} onClick={() => { setMode('buvette'); setActiveEntityId(null); }} icon={<Coffee size={14}/>} label="BUVETTE" color="bg-purple-500" />
                <ModeBtn active={mode === 'pp' && !activeEntityId} onClick={() => { setMode('pp'); setActiveEntityId(null); }} icon={<Target size={14}/>} label="PITCH & PUTT" color="bg-pink-500" />
                <ModeBtn active={mode === 'oob'} onClick={() => { setMode('oob'); setActiveEntityId(null); }} icon={<TriangleAlert size={14}/>} label="OOB" color="bg-rose-500" />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 px-2 border-t border-white/5">
                <span className="text-[8px] font-black text-slate-600 uppercase pr-2">Buca {selectedHole}:</span>
                <ModeBtn active={mode === 'hole' && !activeEntityId} onClick={() => { setMode('hole'); setActiveEntityId(null); }} icon={<MapPin size={14}/>} label="PIN" color="bg-emerald-500" />
                <ModeBtn active={mode === 'tee' && !activeEntityId} onClick={() => { setMode('tee'); setActiveEntityId(null); }} icon={<BoxSelect size={14}/>} label="TEE" color="bg-blue-500" />
                <ModeBtn active={mode === 'green' && !activeEntityId} onClick={() => { setMode('green'); setActiveEntityId(null); }} icon={<Pentagon size={14}/>} label="GREEN" color="bg-emerald-400" />
                <ModeBtn active={mode === 'area_buca' && !activeEntityId} onClick={() => { setMode('area_buca'); setActiveEntityId(null); }} icon={<Spline size={14}/>} label="PERIMETRO" color="bg-orange-500" />
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex relative bg-black">
        <div ref={mapRef} className="absolute inset-0 w-full h-full" />
        {isEditing && (
          <div className="absolute top-4 left-4 right-4 pointer-events-none flex flex-col items-center gap-3">
              {(activeEntityId || history.length > 0) && (
                <div className="flex items-center gap-2 pointer-events-auto">
                  <button onClick={() => handleUndoPoint(activeEntityId, setActiveEntityId, setEntities, setHasUnsavedChanges, history, setHistory)} className="bg-slate-900 text-white px-4 py-2 rounded-xl border border-white/10 text-[9px] font-black uppercase shadow-2xl flex items-center gap-2"><Undo2 size={16} /> ANNULLA</button>
                  {activeEntityId && (
                      <button onClick={() => setActiveEntityId(null)} className="bg-emerald-500 text-slate-950 px-6 py-2 rounded-xl font-black text-[9px] uppercase shadow-2xl flex items-center gap-2 active:scale-95 animate-pulse"><CheckCircle2 size={16} /> CHIUDI AREA</button>
                  )}
                </div>
              )}
          </div>
        )}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/75 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-2xl overflow-x-auto max-w-[95vw] scrollbar-hide">
          {holeNumbers.map(n => (
            <button key={n} onClick={() => handleHoleSelection(n, entities, mapInstanceRef.current, setActiveEntityId, setSelectedHole)} className={`w-8 h-8 flex-shrink-0 rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${selectedHole === n ? 'bg-emerald-500 text-slate-950 scale-110' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>{n}</button>
          ))}
        </div>
      </div>
    </div>
  );
};

const ModeBtn = ({ active, onClick, label, color, icon }: any) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all flex-shrink-0 shadow-lg ${active ? `${color} text-slate-950 border-white scale-105 z-10` : 'bg-slate-800 text-white/40 border-transparent hover:bg-slate-700 hover:text-white'}`}>
    {icon}
    <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">{label}</span>
  </button>
);