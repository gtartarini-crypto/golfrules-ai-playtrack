import React, { useEffect, useRef, useState } from 'react';
import { 
  ArrowLeft, Users, Loader2, Clock, MapPin, Radio, Shield, Hash, Type, Pentagon, 
  ShieldAlert, HeartPulse, MessageCircleWarning, CheckCircle2, Navigation 
} from 'lucide-react';
import { Language, UserProfile, LocalRulesData, GeoEntity } from '../../types';
import { dbData } from '../../services/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy, serverTimestamp } from 'firebase/firestore';
import { subscribeMarshallPositions } from '../../services/marshallService';
import { getCourseLayout, getClubFacilities } from '../../services/layoutService';
import { isPointInPolygon } from '../../services/dataUtils';
import { SupportChatManager } from './SupportChatManager';

interface FlightData {
  id: string; playerName: string; hole: number; lat: number; lng: number;
  members: number; startTime: string; lastUpdate?: any; currentArea?: string; delayMinutes?: number; 
  flightNumber?: string;
  roundStartTime?: any;
  courseId?: string;
  clubId?: string;
}

const formatName = (fullName: string) => {
  if (!fullName) return "Player";
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

export const PlayerMonitor: React.FC<{
  user: UserProfile | null, localRulesData: LocalRulesData, onBack: () => void, lang: Language, navParams?: any
}> = ({ user, localRulesData, onBack, lang, navParams }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const playerMarkersRef = useRef<Record<string, any>>({});
  const marshallMarkersRef = useRef<Record<string, any>>({});
  const layoutOverlaysRef = useRef<any[]>([]);
  
  const [flights, setFlights] = useState<FlightData[]>([]);
  const [marshalls, setMarshalls] = useState<any[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]); // 🆘 Fase 3
  const [geofences, setGeofences] = useState<GeoEntity<any>[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [selectedCourseId, setSelectedCourseId] = useState<string>(localRulesData.subCourses?.[0]?.id || 'default');
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [isMobileListOpen, setIsMobileListOpen] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  
  const [showPlayerPoints, setShowPlayerPoints] = useState(true);
  const [showFlightNames, setShowFlightNames] = useState(false);
  const [showPlayerNames, setShowPlayerNames] = useState(true);
  const [showMarshalls, setShowMarshalls] = useState(true);
  const [showGeofences, setShowGeofences] = useState(false);

  const clubId = user?.homeClubId || '';

  // 🆘 FASE 3: Listener per Allerta e Richieste Assistenza - Fix Index error: client-side sort
  useEffect(() => {
    if (!clubId || !dbData) return;
    
    const q = query(
      collection(dbData, 'alerts'), 
      where('clubId', '==', clubId),
      where('status', '==', 'active')
    );

    const unsub = onSnapshot(q, (snap) => {
      const alerts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Ordinamento client-side per evitare l'errore di indice mancante su Firestore
      alerts.sort((a: any, b: any) => {
        const tsA = a.timestamp?.toMillis ? a.timestamp.toMillis() : (a.timestamp || 0);
        const tsB = b.timestamp?.toMillis ? b.timestamp.toMillis() : (b.timestamp || 0);
        return tsB - tsA;
      });
      setActiveAlerts(alerts);
    });

    return unsub;
  }, [clubId]);

  // 🆘 Gestione navigazione da SOS
  useEffect(() => {
    if (navParams?.flightId && flights.length > 0) {
      const target = flights.find(f => f.id === navParams.flightId);
      if (target && mapInstanceRef.current) {
        setSelectedFlightId(target.id);
        mapInstanceRef.current.panTo({ lat: target.lat, lng: target.lng });
        mapInstanceRef.current.setZoom(19);
      }
    }
  }, [navParams, flights, mapReady]);

  if (!user?.homeClubId) {
    return (
      <div className="h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <div className="bg-white border border-red-100 text-red-600 px-8 py-6 rounded-3xl shadow-sm max-w-md text-center space-y-3">
          <h1 className="text-lg font-black uppercase tracking-widest">Profilo incompleto</h1>
          <p className="text-sm font-medium">Il tuo account non ha un club associato.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!mapReady || !clubId || !selectedCourseId) return;

    const loadMapData = async () => {
        layoutOverlaysRef.current.forEach(o => { if (o.setMap) o.setMap(null); else if (o.map) o.map = null; });
        layoutOverlaysRef.current = [];

        try {
            const [{ layouts, geofences: geoData }, facilities] = await Promise.all([
                getCourseLayout(clubId, selectedCourseId),
                getClubFacilities(clubId)
            ]);
            
            setGeofences(geoData);
            const { AdvancedMarkerElement } = await (window as any).google.maps.importLibrary("marker");

            [...layouts, ...facilities].forEach(ent => {
                if (ent.path) {
                    const isGeofence = ent.type !== 'oob';
                    const poly = new (window as any).google.maps.Polygon({
                        paths: ent.path,
                        map: (showGeofences || !isGeofence) ? mapInstanceRef.current : null,
                        strokeColor: ent.type === 'oob' ? '#ffffff' : SETUP_OVERLAY_COLORS[ent.type] || '#10b981',
                        strokeWeight: 2,
                        fillColor: SETUP_OVERLAY_COLORS[ent.type] || '#10b981',
                        fillOpacity: isGeofence ? 0.05 : 0.1,
                        zIndex: 1
                    });
                    layoutOverlaysRef.current.push(poly);
                }
                if (ent.type === 'hole' && ent.location) {
                    const container = document.createElement('div');
                    container.innerHTML = `<div style="background:rgba(0,0,0,0.9);color:white;border:2px solid #10b981;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:8px;">${ent.metadata?.holeNumber || ''}</div>`;
                    const marker = new AdvancedMarkerElement({ position: ent.location, map: mapInstanceRef.current, content: container, zIndex: 2 });
                    layoutOverlaysRef.current.push(marker);
                }
            });
        } catch (e) { console.error("Layout error:", e); }
    };
    loadMapData();
  }, [selectedCourseId, mapReady, showGeofences, clubId]);

  useEffect(() => {
    if (!clubId || !dbData) return;
    
    const q = query(
      collection(dbData, "active_flights"), 
      where("clubId", "==", clubId), 
      where("status", "==", "active")
    );
    
    const unsub = onSnapshot(q, (snap) => {
        const activeFlights = snap.docs.map(d => {
            const data = d.data();
            const coords = extractCoords(data.location);
            if (!coords) return null;

            return {
                id: d.id,
                ...data,
                ...coords,
                hole: data.currentHole || 1,
                startTime: data.roundStartTime ? new Date(data.roundStartTime.toMillis()).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--'
            };
        }).filter(Boolean) as FlightData[];
        
        setFlights(activeFlights);
        setStatus('ready');
    }, (err) => {
        console.error("Monitor Listener Error:", err);
        setStatus('error');
    });

    return () => unsub();
  }, [clubId]);

  useEffect(() => { if (clubId) return subscribeMarshallPositions(clubId, setMarshalls); }, [clubId]);

  useEffect(() => {
    if (!mapRef.current || !(window as any).google || mapInstanceRef.current) return;
    mapInstanceRef.current = new (window as any).google.maps.Map(mapRef.current, {
        center: { lat: localRulesData.latitude || 45.7, lng: localRulesData.longitude || 9.0 },
        zoom: 16, mapTypeId: 'hybrid', disableDefaultUI: true, zoomControl: true, mapId: 'MONITOR_V3_REALTIME', tilt: 0
    });
    setMapReady(true);
  }, [localRulesData]);

  useEffect(() => {
      if (!mapReady || !mapInstanceRef.current) return;
      const render = async () => {
          const { AdvancedMarkerElement } = await (window as any).google.maps.importLibrary("marker");
          
          marshalls.forEach(m => {
              const coords = extractCoords({ lat: m.lat, lng: m.lng });
              if (!coords) return;
              const pos = coords;
              const mName = formatName(m.name || "Marshall").toUpperCase();

              if (!marshallMarkersRef.current[m.id]) {
                  const container = document.createElement('div');
                  container.innerHTML = `<div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
                    <div class="m-name-label" style="background:rgba(0,0,0,0.85); color:white; padding:2px 6px; border-radius:4px; font-size:8px; font-weight:900; white-space:nowrap; border:1px solid #3b82f6; text-transform:uppercase;">${mName}</div>
                    <div style="width:18px;height:18px;background:#3b82f6;border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;box-shadow:0 0 10px rgba(59,130,246,0.5);"><svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg></div>
                  </div>`;
                  marshallMarkersRef.current[m.id] = new AdvancedMarkerElement({ position: pos, map: showMarshalls ? mapInstanceRef.current : null, content: container, zIndex: 999 });
              } else { 
                  marshallMarkersRef.current[m.id].position = pos; 
                  marshallMarkersRef.current[m.id].map = showMarshalls ? mapInstanceRef.current : null; 
                  const label = marshallMarkersRef.current[m.id].content.querySelector('.m-name-label');
                  if (label) label.textContent = mName;
              }
          });

          flights.forEach(f => {
              const pos = {lat: f.lat, lng: f.lng};
              const paceColor = (f.delayMinutes ?? 0) > 10 ? '#ef4444' : (f.delayMinutes ?? 0) > 0 ? '#f59e0b' : '#10b981';
              const pName = formatName(f.playerName);
              
              if (!playerMarkersRef.current[f.id]) {
                  const div = document.createElement('div');
                  div.style.cursor = 'pointer';
                  playerMarkersRef.current[f.id] = new AdvancedMarkerElement({ 
                      position: pos, 
                      map: (showPlayerPoints || showFlightNames || showPlayerNames) ? mapInstanceRef.current : null, 
                      content: div, 
                      zIndex: 100 
                  });
                  div.onclick = (e) => { 
                      e.stopPropagation(); 
                      setSelectedFlightId(f.id); 
                      mapInstanceRef.current?.panTo(pos); 
                      mapInstanceRef.current?.setZoom(19); 
                  };
              }
              
              const marker = playerMarkersRef.current[f.id];
              marker.position = pos;
              marker.map = (showPlayerPoints || showFlightNames || showPlayerNames) ? mapInstanceRef.current : null;
              marker.content.innerHTML = `
                  <div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
                      ${showFlightNames ? `<div style="background:rgba(0,0,0,0.85); color:white; padding:1px 5px; border-radius:4px; font-size:7px; font-weight:900; white-space:nowrap; border:1px solid rgba(255,255,255,0.2);">FLIGHT ${f.flightNumber || f.id.slice(-4)}</div>` : ''}
                      ${showPlayerNames ? `<div style="background:white; color:black; padding:2px 6px; border-radius:4px; font-size:9px; font-weight:900; white-space:nowrap; box-shadow:0 2px 8px rgba(0,0,0,0.3); border:1px solid ${paceColor};">${pName.toUpperCase()} ${f.members > 1 ? `(${f.members})` : ''}</div>` : ''}
                      ${showPlayerPoints ? `<div style="width:14px;height:14px;background:${paceColor};border:2px solid white;border-radius:50%;box-shadow:0 0 12px ${paceColor}cc;"></div>` : ''}
                  </div>
              `;
          });
          
          Object.keys(playerMarkersRef.current).forEach(id => { if (!flights.find(f => f.id === id)) { if (playerMarkersRef.current[id]) playerMarkersRef.current[id].map = null; delete playerMarkersRef.current[id]; } });
      };
      render();
  }, [flights, marshalls, showPlayerPoints, showFlightNames, showPlayerNames, showMarshalls, mapReady]);

  const getCurrentGeofence = (lat: number, lng: number) => {
    const point = { lat, lng };
    const priority = ['green', 'tee', 'approach', 'hole', 'area_buca'];
    for (const type of priority) {
        const match = geofences.find(g => g.type === type && g.path && isPointInPolygon(point, g.path));
        if (match) return match;
    }
    return null;
  };

  // 🆘 FASE 3: Funzione per gestire le allerte
  const handleAlertAction = async (alertId: string, action: 'map' | 'resolve') => {
    const alert = activeAlerts.find(a => a.id === alertId);
    if (!alert) return;

    if (action === 'map') {
      const flight = flights.find(f => f.id === alert.flightId);
      if (flight && mapInstanceRef.current) {
        setSelectedFlightId(flight.id);
        mapInstanceRef.current.panTo({ lat: flight.lat, lng: flight.lng });
        mapInstanceRef.current.setZoom(19);
      } else {
        alert("Giocatore non più rilevato sulla mappa.");
      }
    } else if (action === 'resolve') {
      if (!dbData) return;
      try {
        await updateDoc(doc(dbData, 'alerts', alertId), { 
          status: 'handled', 
          handledAt: serverTimestamp(),
          handledBy: user?.displayName 
        });
      } catch (e) {
        console.error("Errore chiusura allerta", e);
      }
    }
  };

  const AlertsPanel = () => (
    <div className="flex flex-col h-full bg-slate-900 overflow-hidden border-t border-white/5">
      <div className="p-4 border-b border-white/10 bg-red-500/10 flex justify-between items-center shrink-0">
        <h3 className="text-[10px] font-black uppercase text-red-400 tracking-widest flex items-center gap-2">
          <ShieldAlert size={14} className="animate-pulse" /> Rescue & SOS
        </h3>
        <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[9px] font-black">{activeAlerts.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide p-2 space-y-2">
        {activeAlerts.map((alert) => (
          <div key={alert.id} className={`p-3 rounded-xl border transition-all ${alert.type === 'HEALTH' ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-amber-500/5 border-amber-500/20'}`}>
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                {alert.type === 'HEALTH' ? <HeartPulse size={16} className="text-red-500 animate-pulse" /> : <MessageCircleWarning size={16} className="text-amber-500" />}
                <span className={`text-[10px] font-black uppercase tracking-tighter ${alert.type === 'HEALTH' ? 'text-red-400' : 'text-amber-400'}`}>
                  {alert.type === 'HEALTH' ? 'Emergenza Medica' : alert.issueDetail || 'Assistenza'}
                </span>
              </div>
              <span className="text-[8px] font-bold text-slate-500">{alert.timestamp?.toMillis ? new Date(alert.timestamp.toMillis()).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--'}</span>
            </div>
            
            <div className="flex flex-col mb-3">
               <span className="text-[11px] font-black text-white uppercase truncate">{alert.userName}</span>
               <span className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1 mt-1">
                 <MapPin size={8} className="text-emerald-500" /> {alert.areaContext}
               </span>
            </div>

            <div className="flex gap-2">
               <button 
                onClick={() => handleAlertAction(alert.id, 'map')}
                className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-black uppercase text-white flex items-center justify-center gap-1.5 transition-all"
               >
                 <Navigation size={12} /> Vai su Mappa
               </button>
               <button 
                onClick={() => handleAlertAction(alert.id, 'resolve')}
                className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-1.5 transition-all ${alert.type === 'HEALTH' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}
               >
                 <CheckCircle2 size={12} /> Risolto
               </button>
            </div>
          </div>
        ))}
        {activeAlerts.length === 0 && (
          <div className="py-10 text-center opacity-10 flex flex-col items-center gap-2">
            <ShieldAlert size={32} />
            <p className="text-[9px] font-black uppercase">Nessuna segnalazione</p>
          </div>
        )}
      </div>
    </div>
  );

  const FlightsList = () => (
    <div className="flex flex-col h-full bg-slate-900 overflow-hidden">
      <div className="p-4 border-b border-white/10 bg-black/40 flex justify-between items-center shrink-0">
        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Users size={14} className="text-emerald-500" /> Flight Attivi</h3>
        <span className="bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full text-[9px] font-black">{flights.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide p-2 space-y-1">
        {flights.map((f) => {
            const geo = getCurrentGeofence(f.lat, f.lng);
            let holeLabel = "Fuori percorso";
            if (geo) {
                const n = geo.metadata?.holeNumber;
                if (geo.type === "hole" || geo.type === "area_buca") holeLabel = `Buca ${n}`;
                if (geo.type === "tee") holeLabel = `Tee ${n}`;
                if (geo.type === "green") holeLabel = `Green ${n}`;
                if (geo.type === "approach") holeLabel = `Approach ${n}`;
            }

            const startTime = f.roundStartTime?.toMillis ? f.roundStartTime.toMillis() : Date.now();
            const totalElapsed = Math.floor((Date.now() - startTime) / 60000);
            const totalH = Math.floor(totalElapsed / 60);
            const totalM = totalElapsed % 60;

            return (
                <div key={f.id} onClick={() => { setSelectedFlightId(f.id); mapInstanceRef.current?.panTo({ lat: f.lat, lng: f.lng }); mapInstanceRef.current?.setZoom(19); if (window.innerWidth < 768) setIsMobileListOpen(false); }} className={`p-3 rounded-xl cursor-pointer transition-all border ${selectedFlightId === f.id ? "bg-emerald-50/20 border-emerald-500/50 shadow-lg" : "bg-white/5 border-transparent hover:bg-white/10"}`}>
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-black text-xs text-white">#{f.flightNumber || f.id.slice(-4)}</span>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-lg border ${f.delayMinutes && f.delayMinutes > 10 ? 'bg-red-600 text-white border-red-400' : f.delayMinutes && f.delayMinutes > 0 ? 'bg-amber-600 text-white border-amber-400' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}`}>
                        Pace: {f.delayMinutes && f.delayMinutes > 0 ? `+${f.delayMinutes}m` : 'OK'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-200 truncate uppercase font-black tracking-tight leading-none mb-1">{formatName(f.playerName)}</span>
                    <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-1 text-[8px] font-bold text-emerald-400 uppercase tracking-tighter"><MapPin size={8} /> {holeLabel}</div>
                        <div className="flex items-center gap-1 text-[8px] font-bold text-slate-500 uppercase tracking-tighter"><Clock size={8} /> {totalH}h {totalM}m</div>
                    </div>
                  </div>
                </div>
            );
        })}
        {flights.length === 0 && <div className="flex flex-col items-center justify-center py-20 text-center opacity-20"><Users size={32} className="mb-4" /><p className="text-[9px] uppercase font-black tracking-widest">Nessun Flight</p></div>}
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-slate-950 flex flex-col font-sans overflow-hidden">
      <header className="bg-emerald-950 border-b border-white/10 px-4 py-3 flex items-center justify-between z-30 shadow-xl shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 text-white/50 hover:text-white bg-white/5 rounded-xl transition-colors"><ArrowLeft size={22} /></button>
          <div className="flex flex-col"><h1 className="text-xs font-black text-white uppercase tracking-widest leading-none">Marshall Dashboard</h1><select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)} className="bg-transparent text-emerald-300 text-[10px] font-black uppercase outline-none mt-1">{localRulesData.subCourses?.map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>)}</select></div>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
            <ToggleBtn active={showPlayerPoints} onClick={() => setShowPlayerPoints(!showPlayerPoints)} icon={<Radio size={14}/>} label="PUNTO" />
            <ToggleBtn active={showFlightNames} onClick={() => setShowFlightNames(!showFlightNames)} icon={<Hash size={14}/>} label="FLIGHT" />
            <ToggleBtn active={showPlayerNames} onClick={() => setShowPlayerNames(!showPlayerNames)} icon={<Type size={14}/>} label="NOME" />
            <ToggleBtn active={showMarshalls} onClick={() => setShowMarshalls(!showMarshalls)} icon={<Shield size={14}/>} iconClass="text-blue-400" label="MARSHALL" />
            <ToggleBtn active={showGeofences} onClick={() => setShowGeofences(!showGeofences)} icon={<Pentagon size={14}/>} label="GEOFENCE" />
        </div>
      </header>
      <div className="flex-1 flex relative overflow-hidden">
        {/* SIDEBAR DIVISA IN DUE SEZIONI: FLIGHT E SOS - LARGHEZZA RIDOTTA DEL 20% RISPETTO A PRIMA (da 410px a 328px) */}
        <aside className="hidden lg:flex w-[328px] border-r border-white/5 flex-col shadow-2xl z-20">
          <div className="flex-1 overflow-hidden"><FlightsList /></div>
          <div className="h-2/5 overflow-hidden"><AlertsPanel /></div>
        </aside>

        <main className="flex-1 relative bg-slate-800"><div ref={mapRef} className="absolute inset-0 w-full h-full" />
           <button onClick={() => setIsMobileListOpen(true)} className="lg:hidden absolute bottom-6 right-6 z-20 bg-emerald-600 text-white p-4 rounded-2xl shadow-2xl active:scale-95 transition-all ring-4 ring-emerald-500/20"><Users size={24} />{flights.length > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-950">{flights.length}</span>}</button>
           
           {isMobileListOpen && (
             <div className="lg:hidden absolute inset-0 z-40 flex flex-col justify-end">
               <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileListOpen(false)} />
               <div className="relative bg-slate-900 rounded-t-[2rem] shadow-2xl border-t border-white/10 h-[70vh] flex flex-col animate-in slide-in-from-bottom duration-500">
                 <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto my-4 shrink-0" onClick={() => setIsMobileListOpen(false)} />
                 <div className="flex-1 overflow-hidden">
                    <div className="h-full flex flex-col">
                       <div className="flex-1"><FlightsList /></div>
                       <div className="h-1/3"><AlertsPanel /></div>
                    </div>
                 </div>
               </div>
             </div>
           )}
           {status === 'loading' && <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm flex flex-col items-center justify-center z-50 text-emerald-500 font-black uppercase tracking-widest"><Loader2 className="animate-spin mb-4" size={32}/>Syncing Live Data...</div>}
           
           {/* 🔥 SUPPORTO CHAT FLOTTANTE PER ADMIN */}
           <SupportChatManager user={user} clubId={clubId} />
        </main>
      </div>
    </div>
  );
};

const ToggleBtn = ({ active, onClick, icon, label, iconClass }: any) => (
    <button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border shrink-0 ${active ? 'bg-emerald-50 text-slate-950 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-white/5 text-white/40 border-white/10 hover:text-white/60'}`}>
      <span className={active ? '' : iconClass}>{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
);
const SETUP_OVERLAY_COLORS: Record<string, string> = { hole: '#10b981', tee: '#3b82f6', green: '#22c55e', area_buca: '#f97316', dr: '#06b6d4', pg: '#84cc16', buvette: '#a855f7', pp: '#ec4899', oob: '#ffffff' };
export default PlayerMonitor;