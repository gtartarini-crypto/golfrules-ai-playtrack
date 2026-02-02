
import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Users, Radio, Clock, Eye, EyeOff, Shield, X, Map as MapIcon, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Language, UserProfile, LocalRulesData } from '../../types';
import { dbData, logDiagnostic } from '../../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface FlightData {
  id: string;
  playerName: string;
  hole: number;
  lat: number;
  lng: number;
  members: number;
  startTime: string;
  lastUpdate?: number;
  currentArea?: string;
  delayMinutes?: number;
}

interface PlayerMonitorMobileProps {
  user: UserProfile | null;
  localRulesData: LocalRulesData;
  onBack: () => void;
  lang: Language;
}

export const PlayerMonitorMobile: React.FC<PlayerMonitorMobileProps> = ({ user, localRulesData, onBack, lang }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const playerMarkersRef = useRef<Record<string, any>>({});
  const holeMarkersRef = useRef<Record<string, any>>({});
  
  const [flights, setFlights] = useState<FlightData[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [isLive, setIsLive] = useState(false);
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [isListOpen, setIsListOpen] = useState(false);
  
  const [showPlayers, setShowPlayers] = useState(true);
  const [showHoles, setShowHoles] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(localRulesData.subCourses?.[0]?.id || 'default');

  const lat = localRulesData.latitude;
  const lng = localRulesData.longitude;
  const hasCoords = lat !== undefined && lng !== undefined;

  const getPaceColor = (delay?: number) => {
    if (delay === undefined || delay <= 0) return '#10b981';
    if (delay <= 10) return '#f59e0b';
    return '#ef4444';
  };

  useEffect(() => {
    const clubId = user?.homeClubId;
    if (!clubId) {
        setStatus('ready');
        return;
    }

    const q = query(collection(dbData, "active_flights"), where("clubId", "==", clubId));
    setIsLive(true);
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const activeFlights: FlightData[] = [];
        const now = Date.now();
        const staleThreshold = 30 * 60 * 1000;

        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.status === 'active' && data.location && data.lastUpdate) {
                const lastMillis = data.lastUpdate.toMillis ? data.lastUpdate.toMillis() : data.lastUpdate;
                if (now - lastMillis < staleThreshold) {
                    activeFlights.push({
                        id: data.flightNumber || doc.id || '???',
                        playerName: data.playerName || 'Golfer',
                        hole: data.hole || data.currentHole || 1, 
                        lat: data.location.latitude,
                        lng: data.location.longitude,
                        members: data.members || 1, 
                        startTime: data.startTime || '00:00',
                        lastUpdate: lastMillis,
                        currentArea: data.currentArea || 'Outside Areas',
                        delayMinutes: data.delayMinutes || 0
                    });
                }
            }
        });
        setFlights(activeFlights);
        setStatus('ready');
    }, () => {
        setStatus('error');
        setIsLive(false);
    });

    return () => { unsubscribe(); setIsLive(false); };
  }, [user?.homeClubId]);

  useEffect(() => {
    if (!hasCoords || status === 'loading' || !mapRef.current || mapInstanceRef.current) return;
    
    mapInstanceRef.current = new (window as any).google.maps.Map(mapRef.current, {
        center: { lat, lng },
        zoom: 16,
        mapTypeId: 'hybrid',
        disableDefaultUI: true,
        zoomControl: false,
        mapId: 'PLAYER_MONITOR_MOBILE_V1', 
        tilt: 0
    });
  }, [hasCoords, status, lat, lng]);

  useEffect(() => {
      if (!mapInstanceRef.current || !localRulesData.layouts) return;

      const layout = localRulesData.layouts[selectedCourseId] || Object.values(localRulesData.layouts)[0] as any; 
      if (!layout || !layout.entities) return;

      Object.values(holeMarkersRef.current).forEach((m: any) => { if (m) m.map = null; });
      holeMarkersRef.current = {};

      const holeEntities = layout.entities.filter((e: any) => e.type === 'hole' && e.location);

      const renderHoles = async () => {
          const { AdvancedMarkerElement } = await (window as any).google.maps.importLibrary("marker");
          holeEntities.forEach((h: any) => {
              if (!showHoles) return;
              const container = document.createElement('div');
              container.style.width = '0px'; container.style.height = '0px'; container.style.position = 'relative';
              container.innerHTML = `
                <div style="
                    position: absolute; top: 0; left: 0; transform: translate(-50%, -50%);
                    background: rgba(0,0,0,0.9); color: white; border: 2px solid #10b981; 
                    width: 20px; height: 20px; border-radius: 50%; display: flex; 
                    align-items: center; justify-content: center; font-weight: 900; font-size: 10px;
                    box-shadow: 0 0 10px rgba(0,0,0,0.5); pointer-events: none;
                ">${h.metadata?.holeNumber || h.holeNumber || ''}</div>
              `;
              holeMarkersRef.current[h.id] = new AdvancedMarkerElement({ position: h.location, map: mapInstanceRef.current, content: container, zIndex: 1 });
          });
      };
      renderHoles();
  }, [localRulesData.layouts, showHoles, status, selectedCourseId]);

  useEffect(() => {
      if (!mapInstanceRef.current) return;

      const renderPlayers = async () => {
          const { AdvancedMarkerElement } = await (window as any).google.maps.importLibrary("marker");
          flights.forEach(f => {
              const pos = { lat: f.lat, lng: f.lng };
              const paceColor = getPaceColor(f.delayMinutes);
              const delayText = f.delayMinutes && f.delayMinutes > 0 ? `+${f.delayMinutes}m` : `${f.delayMinutes || 0}m`;

              if (playerMarkersRef.current[f.id]) {
                  const marker = playerMarkersRef.current[f.id];
                  marker.position = pos;
                  marker.map = showPlayers ? mapInstanceRef.current : null;
                  
                  const badge = marker.content.querySelector('.delay-badge');
                  if (badge) {
                    badge.style.background = paceColor;
                    badge.textContent = delayText;
                  }
                  const dot = marker.content.querySelector('.p-dot-mb');
                  if (dot) {
                    dot.style.backgroundColor = paceColor;
                    dot.style.boxShadow = `0 0 10px ${paceColor}b3`;
                  }
              } else {
                  const container = document.createElement('div');
                  container.innerHTML = `
                    <div style="display: flex; flex-direction: column; align-items: center; position: absolute; bottom: 0; left: 0; transform: translate(-50%, 0); cursor: pointer;">
                        <div class="delay-badge" style="background: ${paceColor}; color: white; padding: 1px 4px; border-radius: 4px; font-size: 8px; font-weight: 900; margin-bottom: 2px; border: 1px solid white;">${delayText}</div>
                        <div style="background: white; color: black; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 900; margin-bottom: 2px; box-shadow: 0 2px 8px rgba(0,0,0,0.4); white-space: nowrap;">#${f.id}</div>
                        <div class="p-dot-mb" style="width: 12px; height: 12px; background: ${paceColor}; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px ${paceColor}b3;"></div>
                    </div>
                  `;
                  playerMarkersRef.current[f.id] = new AdvancedMarkerElement({ position: pos, map: showPlayers ? mapInstanceRef.current : null, content: container, zIndex: 100 });
                  container.onclick = (e) => { e.stopPropagation(); setSelectedFlightId(f.id); };
              }
          });
          Object.keys(playerMarkersRef.current).forEach(id => {
              if (!flights.find(f => f.id === id)) {
                  if (playerMarkersRef.current[id]) playerMarkersRef.current[id].map = null;
                  delete playerMarkersRef.current[id];
              }
          });
      };
      renderPlayers();
  }, [flights, showPlayers]);

  return (
    <div className="h-screen bg-slate-950 flex flex-col font-sans overflow-hidden">
      <header className="bg-emerald-950 border-b border-white/10 flex items-center justify-between px-4 py-3 z-30 shadow-xl shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-1 text-white/50 hover:text-white bg-white/5 rounded-xl transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
              MONITOR LIVE
              {isLive && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />}
            </h1>
            <select 
              value={selectedCourseId} 
              onChange={e => setSelectedCourseId(e.target.value)}
              className="bg-transparent text-emerald-300 text-[10px] font-black uppercase outline-none truncate max-w-[120px]"
            >
              {localRulesData.subCourses?.map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => setShowPlayers(!showPlayers)} className={`p-2 rounded-lg transition-all ${showPlayers ? 'bg-emerald-500 text-white' : 'bg-white/5 text-white/30'}`}>
              {showPlayers ? <Eye size={16} /> : <EyeOff size={16} />}
           </button>
        </div>
      </header>

      <main className="flex-1 relative bg-slate-800">
        <div ref={mapRef} className="absolute inset-0 w-full h-full" />
        
        <button 
          onClick={() => setIsListOpen(true)}
          className="absolute bottom-6 right-6 z-20 bg-emerald-600 text-white p-4 rounded-2xl shadow-2xl active:scale-95 transition-all ring-4 ring-emerald-500/20"
        >
          <Users size={24} />
          {flights.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-950">
              {flights.length}
            </span>
          )}
        </button>

        {isListOpen && (
          <div className="absolute inset-0 z-40 flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsListOpen(false)} />
            <div className="relative bg-slate-900 rounded-t-[2.5rem] shadow-2xl border-t border-white/10 max-h-[80vh] flex flex-col animate-in slide-in-from-bottom duration-300">
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto my-4 shrink-0" onClick={() => setIsListOpen(false)} />
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                  <Users size={14} className="text-emerald-500" /> FLIGHT ATTIVI
                </h3>
                <button onClick={() => setIsListOpen(false)} className="p-2 text-slate-500"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {flights.map(f => {
                    const isLate = f.delayMinutes && f.delayMinutes > 10;
                    const isWarning = f.delayMinutes && f.delayMinutes > 0 && f.delayMinutes <= 10;
                    
                    return (
                        <div 
                            key={f.id} 
                            onClick={() => { 
                                setSelectedFlightId(f.id); 
                                mapInstanceRef.current?.panTo({lat: f.lat, lng: f.lng}); 
                                mapInstanceRef.current?.setZoom(19);
                                setIsListOpen(false);
                            }} 
                            className={`p-4 border-b border-white/5 flex items-center justify-between ${selectedFlightId === f.id ? 'bg-emerald-500/10' : 'active:bg-white/5'}`}
                        >
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className="font-black text-white text-sm">#{f.id}</span>
                                    <span className={`text-[8px] font-black px-1 py-0.5 rounded border ${
                                        isLate ? 'bg-red-500 text-white border-red-400' : 
                                        isWarning ? 'bg-amber-500 text-white border-amber-400' : 
                                        'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                    }`}>
                                        {f.delayMinutes && f.delayMinutes > 0 ? `+${f.delayMinutes}m` : 'OK'}
                                    </span>
                                </div>
                                <span className="text-[10px] text-slate-400 uppercase font-bold truncate max-w-[150px]">{f.playerName}</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded ${f.currentArea === 'Outside Areas' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-400/10 text-emerald-400'}`}>
                                    {f.currentArea === 'Outside Areas' ? 'Outside' : `Hole ${f.hole}`}
                                </span>
                                <span className="text-[9px] font-bold text-slate-500 mt-1 flex items-center gap-1"><Clock size={10} /> {f.startTime}</span>
                            </div>
                        </div>
                    );
                })}
                {flights.length === 0 && (
                  <div className="py-12 text-center text-slate-600 text-[10px] font-black uppercase tracking-widest">NESSUN FLIGHT</div>
                )}
              </div>
            </div>
          </div>
        )}

        {status === 'loading' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center z-50">
             <Loader2 size={48} className="animate-spin text-emerald-500 mb-4" />
             <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">CONNESSIONE LIVE...</span>
          </div>
        )}
      </main>
    </div>
  );
};
