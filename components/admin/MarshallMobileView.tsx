import React, { useEffect, useRef, useState } from 'react';
import {
  Users,
  Settings2,
  RefreshCw,
  Radio,
  User,
  Shield,
  X,
  LogOut
} from 'lucide-react';

import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';

import { dbData } from '../../services/firebase';
import { updateMarshallPosition } from '../../services/marshallService';
import { LocalRulesData, GeoEntity, UserProfile } from '../../types';
import { SupportChatManager } from './SupportChatManager';

interface FlightData {
  id: string;
  playerName: string;
  currentHole: number;
  delayMinutes: number;
  location: { lat: number; lng: number };
  status: string;
  lastUpdate: any;
  currentArea: string;
}

const MAP_STYLES_HIDE_POI = [
  {
    featureType: "poi",
    stylers: [{ visibility: "off" }]
  }
];

const formatName = (fullName: string) => {
  if (!fullName) return "Marshall";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return fullName;
  return `${parts[0][0]}.${parts[parts.length - 1]}`;
};

const extractCoords = (loc: any): { lat: number, lng: number } | null => {
  if (!loc) return null;
  const lat = loc.latitude !== undefined ? loc.latitude : (loc.lat !== undefined ? loc.lat : loc._lat);
  const lng = loc.longitude !== undefined ? loc.longitude : (loc.lng !== undefined ? loc.lng : loc._long);
  if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
    return { lat, lng };
  }
  return null;
};

interface MarshallMobileViewProps {
  userId: string;
  userDisplayName: string;
  isAuthenticated: boolean;
  isPlayTrackOn: boolean;
  clubId: string;
  localRulesData: LocalRulesData;
  onLogout: () => void;
  user?: UserProfile | null;
}

export const MarshallMobileView: React.FC<MarshallMobileViewProps> = ({
  userId,
  userDisplayName,
  isAuthenticated,
  isPlayTrackOn,
  clubId,
  localRulesData,
  onLogout,
  user
}) => {
  const [flights, setFlights] = useState<FlightData[]>([]);
  const [marshalls, setMarshalls] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isListExpanded, setIsListExpanded] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(localRulesData.subCourses?.[0]?.id || 'default');

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const holeMarkersRef = useRef<Map<string, any>>(new Map());

  const [showPoints, setShowPoints] = useState(true);
  const [showNames, setShowNames] = useState(true);
  const [showMarshall, setShowMarshall] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !clubId || !userId) return;
    const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          updateMarshallPosition(userId, userDisplayName, clubId, latitude, longitude);
        },
        null,
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [isAuthenticated, userId, clubId, userDisplayName]);

  useEffect(() => {
    if (!isAuthenticated || !clubId || !dbData) return;
    const qF = query(collection(dbData, 'active_flights'), where('status', '==', 'active'), where('clubId', '==', clubId));
    const qM = query(collection(dbData, 'marshall_positions'), where('clubId', '==', clubId));

    const unsubF = onSnapshot(qF, (snap) => {
        const active: FlightData[] = [];
        snap.forEach(d => {
            const data = d.data();
            const coords = extractCoords(data.location);
            if (coords) {
                active.push({
                    id: d.id, 
                    playerName: data.playerName || 'Player',
                    currentHole: data.currentHole || 0, 
                    delayMinutes: data.delayMinutes || 0,
                    location: coords,
                    status: data.status, 
                    lastUpdate: data.lastUpdate, 
                    currentArea: data.currentArea || ''
                });
            }
        });
        setFlights(active);
    });

    const unsubM = onSnapshot(qM, (snap) => {
        const activeMarshalls = snap.docs.map(d => {
          const data = d.data();
          const coords = extractCoords({ lat: data.lat, lng: data.lng });
          return coords ? { id: d.id, ...data, ...coords } : null;
        }).filter(Boolean);
        setMarshalls(activeMarshalls);
    });

    return () => { unsubF(); unsubM(); };
  }, [isAuthenticated, clubId]);

  useEffect(() => {
    if (!mapRef.current || !(window as any).google || mapInstanceRef.current) return;
    const initMap = async () => {
      const { Map } = await (window as any).google.maps.importLibrary("maps");
      mapInstanceRef.current = new Map(mapRef.current, {
          center: { lat: localRulesData.latitude || 45.7, lng: localRulesData.longitude || 9.0 },
          zoom: 16, 
          mapTypeId: 'hybrid', 
          disableDefaultUI: true, 
          mapId: 'MARSHALL_MOBILE_V3_PRO', 
          tilt: 0,
          styles: MAP_STYLES_HIDE_POI
      });
      setMapReady(true);
    };
    initMap();
  }, [localRulesData]);

  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !localRulesData.course) return;
    const renderHoles = async () => {
        const { AdvancedMarkerElement } = await (window as any).google.maps.importLibrary('marker');
        holeMarkersRef.current.forEach(m => m.map = null);
        holeMarkersRef.current.clear();
        const courseData = localRulesData.course[selectedCourseId];
        const entities = courseData?.entities || [];
        entities.forEach((ent: GeoEntity) => {
            if (ent.type === 'hole' && ent.location) {
                const holeNum = ent.metadata?.holeNumber || '';
                const div = document.createElement('div');
                div.innerHTML = `<div style="background:rgba(0,0,0,0.85); color:white; border:2px solid #10b981; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:10px; box-shadow:0 0 10px rgba(0,0,0,0.5);">${holeNum}</div>`;
                const marker = new AdvancedMarkerElement({ map: mapInstanceRef.current, position: ent.location, content: div, zIndex: 50 });
                holeMarkersRef.current.set(ent.id, marker);
            }
        });
    };
    renderHoles();
  }, [mapReady, selectedCourseId, localRulesData.course]);

  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    const renderMarkers = async () => {
      const { AdvancedMarkerElement } = await (window as any).google.maps.importLibrary('marker');
      const currentIdsInMap = new Set();
      marshalls.forEach(m => {
          const pos = { lat: Number(m.lat), lng: Number(m.lng) };
          const mLabelText = formatName(m.name || "Marshall");
          currentIdsInMap.add(m.id);
          if (markersRef.current.has(m.id)) {
              const marker = markersRef.current.get(m.id);
              marker.position = pos;
              marker.map = showMarshall ? mapInstanceRef.current : null;
          } else {
              const div = document.createElement('div');
              div.innerHTML = `<div style="position:relative;display:flex;flex-direction:column;align-items:center;"><div style="background:rgba(0,0,0,0.85);color:white;padding:2px 6px;border-radius:4px;font-size:8px;font-weight:900;text-transform:uppercase;margin-bottom:2px;border:1px solid rgba(59,130,246,0.5);">${mLabelText}</div><div style="color:#3b82f6;filter:drop-shadow(0 0 6px rgba(59,130,246,0.8));"><svg viewBox="0 0 24 24" style="width:22px;height:22px;fill:currentColor;stroke:white;stroke-width:1.5;"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg></div></div>`;
              const marker = new AdvancedMarkerElement({ map: showMarshall ? mapInstanceRef.current : null, position: pos, content: div, zIndex: 200 });
              markersRef.current.set(m.id, marker);
          }
      });
      flights.forEach(f => {
        const color = f.delayMinutes <= 0 ? '#10b981' : f.delayMinutes <= 10 ? '#f59e0b' : '#ef4444';
        const pos = f.location;
        const pName = formatName(f.playerName);
        currentIdsInMap.add(f.id);
        if (markersRef.current.has(f.id)) {
          const m = markersRef.current.get(f.id);
          m.position = pos; m.map = (showPoints || showNames) ? mapInstanceRef.current : null;
          const label = m.content.querySelector('.m-label');
          if (label) label.style.display = showNames ? 'flex' : 'none';
          const dot = m.content.querySelector('.m-dot');
          if (dot) { dot.style.display = showPoints ? 'block' : 'none'; dot.style.backgroundColor = color; }
          const delaySpan = m.content.querySelector('.m-delay');
          if (delaySpan) { delaySpan.textContent = f.delayMinutes > 0 ? `+${f.delayMinutes}m` : 'OK'; delaySpan.style.color = color; }
        } else {
          const div = document.createElement('div');
          div.innerHTML = `<div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;"><div class="m-label" style="display:${showNames ? 'flex' : 'none'};background:rgba(0,0,0,0.85);padding:2px 6px;border-radius:4px;gap:4px;border:1px solid rgba(255,255,255,0.2);"><span class="m-name" style="color:white;font-size:8px;font-weight:900;text-transform:uppercase;">${pName}</span><span class="m-delay" style="color:${color};font-size:8px;font-weight:900;">${f.delayMinutes > 0 ? `+${f.delayMinutes}m` : 'OK'}</span></div><div class="m-dot" style="display:${showPoints ? 'block' : 'none'};width:14px;height:14px;background-color:${color};border:2px solid white;border-radius:50%;box-shadow:0 0 8px ${color}cc;margin-top:2px;"></div></div>`;
          const marker = new AdvancedMarkerElement({ map: (showPoints || showNames) ? mapInstanceRef.current : null, position: pos, content: div, zIndex: 100 });
          markersRef.current.set(f.id, marker);
        }
      });
      markersRef.current.forEach((m, id) => { if (!currentIdsInMap.has(id)) { m.map = null; markersRef.current.delete(id); } });
    };
    renderMarkers();
  }, [flights, marshalls, showPoints, showNames, showMarshall, mapReady]);

  const handleForceRefresh = async () => {
    if (!dbData || flights.length === 0) return;
    setIsRefreshing(true);
    try {
      await Promise.all(flights.map(f => updateDoc(doc(dbData, 'active_flights', f.id), { forceRefresh: serverTimestamp() })));
    } catch (e) { console.error("Refresh error", e); }
    finally { setTimeout(() => setIsRefreshing(false), 1000); }
  };

  return (
    <div className="h-screen bg-slate-950 flex flex-col font-sans overflow-hidden relative text-white">
      <header className="bg-emerald-950/90 backdrop-blur-md border-b border-white/10 px-4 py-4 shrink-0 shadow-2xl z-30 flex items-center justify-between">
        <div className="flex flex-col">
            <h1 className="text-lg font-black uppercase tracking-tighter leading-none">PlayTrack – Staff</h1>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-1">{localRulesData.club || 'Golf Club'}</span>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={() => setIsSettingsOpen(true)} className="p-2.5 bg-white/5 rounded-xl border border-white/10"><Settings2 size={20} /></button>
            <button onClick={handleForceRefresh} disabled={isRefreshing} className="p-2.5 text-slate-950 bg-amber-500 rounded-xl shadow-lg"><RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} /></button>
            <button onClick={onLogout} className="p-2.5 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20"><LogOut size={20} /></button>
        </div>
      </header>

      <div className="flex-1 relative z-0">
        <div ref={mapRef} className="w-full h-full" />
        {isSettingsOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
                <div className="bg-slate-900 border border-white/10 w-full max-w-xs rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
                        <h3 className="text-xs font-black uppercase tracking-widest">Filtri Mappa</h3>
                        <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-white/5 rounded-lg"><X size={20} /></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="mb-4">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Seleziona Percorso</label>
                          <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} className="w-full bg-slate-800 border border-white/10 p-3 rounded-xl text-xs font-bold text-white outline-none">
                            {localRulesData.subCourses?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                        <IosToggle active={showPoints} label="Punti Flight" onClick={() => setShowPoints(!showPoints)} icon={<Radio size={14}/>} />
                        <IosToggle active={showNames} label="Nomi Giocatori" onClick={() => setShowNames(!showNames)} icon={<User size={14}/>} />
                        <IosToggle active={showMarshall} label="Staff Marshall" onClick={() => setShowMarshall(!showMarshall)} icon={<Shield size={14}/>} />
                    </div>
                    <button onClick={() => setIsSettingsOpen(false)} className="w-full py-5 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-widest">Chiudi</button>
                </div>
            </div>
        )}
      </div>

      {/* CHAT MANAGER FLOTTANTE (ADMIN SIDE) */}
      <SupportChatManager user={user || null} clubId={clubId} />

      <div className={`fixed bottom-0 inset-x-0 bg-slate-950 border-t border-white/10 transition-all duration-500 z-40 flex flex-col rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] ${isListExpanded ? 'h-[75vh]' : 'h-[85px]'}`}>
        <div onClick={() => setIsListExpanded(!isListExpanded)} className="py-4 flex flex-col items-center cursor-pointer">
            <div className="w-10 h-1.5 bg-white/10 rounded-full mb-4" />
            <div className="flex items-center justify-between px-6 w-full">
                <div className="flex items-center gap-2"><Users size={16} className="text-emerald-500"/><h3 className="text-[11px] font-black uppercase tracking-widest">Status Flight</h3></div>
                <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-lg text-[9px] font-black border border-emerald-500/20">{flights.length} LIVE</span>
            </div>
        </div>
        <div className={`flex-1 overflow-y-auto px-4 pb-12 space-y-2 ${isListExpanded ? 'opacity-100' : 'opacity-0 invisible'}`}>
            {flights.sort((a,b) => b.delayMinutes - a.delayMinutes).map(f => (
                <div key={f.id} className="bg-slate-900/50 border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-black text-xs text-emerald-400 border border-white/5">{f.currentHole}</div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black uppercase">{formatName(f.playerName)}</span>
                          <span className="text-[9px] text-slate-500">Buca {f.currentHole}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className={`text-xs font-black ${f.delayMinutes > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{f.delayMinutes > 0 ? `+${f.delayMinutes} min` : 'In Orario'}</span>
                    </div>
                </div>
            ))}
            {flights.length === 0 && (
              <div className="py-20 text-center opacity-30 flex flex-col items-center gap-2">
                <Users size={40} />
                <p className="text-[10px] font-black uppercase">Nessun giocatore attivo</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

const IosToggle = ({ active, label, icon, onClick }: any) => (
  <div className="flex items-center justify-between py-2 cursor-pointer group" onClick={onClick}>
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg transition-colors ${active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>{icon}</div>
      <span className="text-[11px] font-bold uppercase transition-colors group-hover:text-white">{label}</span>
    </div>
    <div className={`w-10 h-6 rounded-full p-1 transition-all ${active ? 'bg-emerald-500' : 'bg-slate-700'}`}>
      <div className={`w-4 h-4 bg-white rounded-full transition-all ${active ? 'translate-x-4' : 'translate-x-0'}`} />
    </div>
  </div>
);