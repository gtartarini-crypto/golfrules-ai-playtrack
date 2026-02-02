import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Loader2, MapPin, Calendar, Users, BarChart3, RefreshCw, Flag } from 'lucide-react';
import { Language, LocalRulesData, UserProfile, GeoEntity } from '../../types';
import { dbData } from '../../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { getCourseLayout } from '../../services/layoutService';
import { isPointInPolygon } from '../../services/dataUtils';

interface FlightSession {
  id: string;
  playerName: string;
  currentHole: number;
  lat: number;
  lng: number;
  roundStartTime: any;
  actualStartTime: any;
  delayMinutes: number;
  flightNumber: string;
}

export const StatisticsOfRound: React.FC<{
  user: UserProfile | null,
  localRulesData: LocalRulesData,
  onBack: () => void,
  lang: Language
}> = ({ user, localRulesData, onBack, lang }) => {
  const [flights, setFlights] = useState<FlightSession[]>([]);
  const [geofences, setGeofences] = useState<GeoEntity<any>[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(localRulesData.subCourses?.[0]?.id || 'default');
  const [isLoading, setIsLoading] = useState(false);

  const clubId = user?.homeClubId;

  useEffect(() => {
    if (!clubId || !selectedCourseId) return;
    const loadGeo = async () => {
        const { geofences: geoData } = await getCourseLayout(clubId, selectedCourseId);
        setGeofences(geoData);
    };
    loadGeo();
  }, [clubId, selectedCourseId]);

  useEffect(() => {
    if (!clubId || !dbData) return;
    setIsLoading(true);
    const q = query(collection(dbData, "active_flights"), where("clubId", "==", clubId), where("status", "==", "active"));
    const unsub = onSnapshot(q, (snap) => {
        setFlights(snap.docs.map(d => ({
            id: d.id, ...d.data(),
            lat: d.data().location?.latitude,
            lng: d.data().location?.longitude
        }) as any));
        setIsLoading(false);
    });
    return unsub;
  }, [clubId]);

  const getHoleLabel = (lat: number, lng: number) => {
    const point = { lat, lng };
    const priority = ['green', 'tee', 'approach', 'hole', 'area_buca'];
    for (const type of priority) {
        const match = geofences.find(g => g.type === type && g.path && isPointInPolygon(point, g.path));
        if (match) {
            /* Fixed: removed incorrect property access match.holeNumber on line 64 */
            const n = match.metadata?.holeNumber;
            if (match.type === "hole" || match.type === "area_buca") return `Buca ${n}`;
            if (match.type === "tee") return `Tee ${n}`;
            if (match.type === "green") return `Green ${n}`;
            if (match.type === "approach") return `Approach ${n}`;
        }
    }
    return "Fuori percorso";
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans overflow-hidden text-slate-900">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-30 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">Statistics of Round</h1>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-emerald-600 tracking-widest mt-1">
              <BarChart3 size={12} /> Performance Sessioni Live
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
             <select 
               value={selectedCourseId}
               onChange={e => setSelectedCourseId(e.target.value)}
               className="bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl text-xs font-black uppercase outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
             >
                {localRulesData.subCourses?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 lg:p-6 w-full mx-auto">
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                <div className="flex items-center gap-3">
                   <Users size={20} className="text-emerald-600" />
                   <h3 className="font-black text-sm uppercase tracking-widest">Dettaglio Flight In Gioco</h3>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                    <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} /> Live Update
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-black uppercase text-[10px] tracking-widest">
                        <tr>
                            <th className="px-8 py-4">Flight</th>
                            <th className="px-6 py-4">Data Inizio</th>
                            <th className="px-6 py-4">Hole Label Live</th>
                            <th className="px-6 py-4">Tempo Totale</th>
                            <th className="px-6 py-4">Relative (Peace)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {flights.map((f) => {
                            const startTime = f.roundStartTime?.toMillis ? f.roundStartTime.toMillis() : Date.now();
                            const totalElapsed = Math.floor((Date.now() - startTime) / 60000);
                            const h = Math.floor(totalElapsed / 60);
                            const m = totalElapsed % 60;
                            const hLabel = getHoleLabel(f.lat, f.lng);

                            return (
                                <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-black text-slate-900">#{f.flightNumber || f.id.slice(-4)}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">{f.playerName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Calendar size={14} className="text-slate-400" />
                                            <span className="font-medium">{f.roundStartTime?.toMillis ? new Date(f.roundStartTime.toMillis()).toLocaleDateString() : '--'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                            <span className="font-bold text-emerald-600 uppercase text-xs">{hLabel}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-700 font-black">
                                            <Clock size={14} className="text-slate-400" />
                                            {h}h {m}m
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${f.delayMinutes > 10 ? 'bg-red-50 text-red-600 border-red-100' : f.delayMinutes > 0 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                            {f.delayMinutes > 0 ? `+${f.delayMinutes} min` : 'In Orario'}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                        {flights.length === 0 && !isLoading && (
                            <tr>
                                <td colSpan={5} className="p-16 text-center text-slate-400 font-black uppercase text-xs tracking-widest italic opacity-50">
                                    Nessuna sessione attiva rilevata.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </main>
    </div>
  );
};