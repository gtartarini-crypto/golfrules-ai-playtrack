import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, BarChart3, Clock, Users, Calendar, 
  RefreshCw, ChevronRight, TrendingUp, Target, 
  Timer, Calculator, Play, Info, Loader2, User,
  TrendingDown, Zap
} from 'lucide-react';

import { UserProfile, LocalRulesData, Language } from '../../types';
import { subscribeActiveFlights, paceOfPlayService } from '../../services/firebase';

// 🔥 Nuovo servizio: legge solo dati aggregati dal backend
import { getAggregatedFlightStats } from '../../services/paceAnalyticsService';

interface PaceAnalyticsProps {
  user: UserProfile | null;
  localRulesData: LocalRulesData;
  onBack: () => void;
  lang: Language;
}

export const PaceAnalytics: React.FC<PaceAnalyticsProps> = ({ user, localRulesData, onBack, lang }) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'projection'>('stats');
  const [flights, setFlights] = useState<any[]>([]);
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [playerStats, setPlayerStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [paceConfig, setPaceConfig] = useState<Record<number, number>>({});

  // Projection States
  const [projStartTime, setProjStartTime] = useState("08:00");
  const [projInterval, setProjInterval] = useState(10);
  const [projNumFlights, setProjNumFlights] = useState(10);

  // 🔒 Blocco accesso se manca il club
  if (!user?.homeClubId) {
    return (
      <div className="h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <div className="bg-white border border-red-100 text-red-600 px-8 py-6 rounded-3xl shadow-sm max-w-md text-center space-y-3">
          <h1 className="text-lg font-black uppercase tracking-widest">
            Profilo incompleto
          </h1>
          <p className="text-sm font-medium">
            Il tuo account non ha un club associato (<code>homeClubId</code> mancante).
          </p>
          <p className="text-xs text-red-400">
            Contatta l’amministratore del club per completare la configurazione.
          </p>
        </div>
      </div>
    );
  }

  const clubId = user.homeClubId;

  // 🔥 Carica flight attivi + pace config
  useEffect(() => {
    const unsub = subscribeActiveFlights((data) => {
      const filtered = data.filter(f => f.clubId === clubId);
      setFlights(filtered);
    });

    const loadPace = async () => {
      const config = await paceOfPlayService.getConfig(clubId, 'default');
      if (config && config.holes) setPaceConfig(config.holes);
    };

    loadPace();
    return unsub;
  }, [clubId]);

  // 🔥 Quando selezioni un flight → carica KPI aggregati dal backend
  useEffect(() => {
    if (selectedFlightId) {
      fetchAggregatedStats(selectedFlightId);
    } else {
      setPlayerStats([]);
    }
  }, [selectedFlightId]);

  const fetchAggregatedStats = async (flightId: string) => {
    setIsLoading(true);
    try {
      const data = await getAggregatedFlightStats(flightId);
      setPlayerStats(data.players || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}m ${s}s`;
  };

  // 🔥 Projection (rimane invariata)
  const projectionData = useMemo(() => {
    if (!paceConfig || Object.keys(paceConfig).length === 0) return [];
    
    const results = [];
    const [startH, startM] = projStartTime.split(':').map(Number);
    
    for (let i = 0; i < projNumFlights; i++) {
      const flightStartTime = new Date();
      flightStartTime.setHours(startH, startM + (i * projInterval), 0, 0);
      
      const holeTimes = [];
      let cumulativeMinutes = 0;
      
      for (let h = 1; h <= 18; h++) {
        const holeMinutes = paceConfig[h] || 14;
        cumulativeMinutes += holeMinutes;
        const completionTime = new Date(flightStartTime.getTime() + cumulativeMinutes * 60000);
        holeTimes.push({
          hole: h,
          time: completionTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
      
      results.push({
        id: i + 1,
        start: flightStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        holes: holeTimes,
        finish: holeTimes[17].time,
        totalDuration: cumulativeMinutes
      });
    }
    return results;
  }, [paceConfig, projStartTime, projInterval, projNumFlights]);

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans overflow-hidden text-slate-900">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between z-30 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">Pace Analytics</h1>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-emerald-600 tracking-widest mt-1">
              <BarChart3 size={12} /> Analisi Performance Premium
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'stats' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Hole Stats
          </button>
          <button 
            onClick={() => setActiveTab('projection')}
            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'projection' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Pace Projection
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-6">
        {activeTab === 'stats' ? (
          <div className="h-full flex gap-6 overflow-hidden">
            
            {/* Sidebar */}
            <aside className="w-80 flex flex-col bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden shrink-0">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Flight Attivi</h3>
                <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black">{flights.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-hide">
                {flights.map(f => (
                  <button 
                    key={f.id}
                    onClick={() => setSelectedFlightId(f.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedFlightId === f.id ? 'bg-emerald-50 border-emerald-500/30 ring-2 ring-emerald-500/10' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-black text-xs">#{f.flightNumber || f.id.slice(-4)}</span>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${f.delayMinutes > 5 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {f.delayMinutes > 0 ? `+${f.delayMinutes}m` : 'OK'}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-700 uppercase truncate">{f.playerName}</p>
                    <p className="text-[8px] text-slate-400 font-medium mt-1">Buca Attuale: {f.currentHole || '-'}</p>
                  </button>
                ))}
              </div>
            </aside>

            {/* Main Content */}
            <section className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
              {!selectedFlightId ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-4">
                  <Users size={64} className="opacity-10" />
                  <p className="text-sm font-black uppercase tracking-widest">Seleziona un flight per visualizzare i dati</p>
                </div>
              ) : isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-emerald-600/50 gap-4">
                  <Loader2 size={48} className="animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Analisi telemetrica in corso...</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-8 space-y-12 scrollbar-hide">
                  {playerStats.map(player => (
                    <div key={player.playerId} className="space-y-8 animate-in fade-in duration-500">
                      
                      {/* Header KPI */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-sm">
                            <User size={24} />
                          </div>
                          <div>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{player.name}</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Analisi telemetrica individuale</p>
                          </div>
                        </div>

                        {/* 🔥 KPI dal backend */}
                        <div className="flex gap-6">
                          <div className="text-right">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tempo Totale</p>
                            <p className="text-sm font-black text-slate-900">{player.kpi?.totalTime || '--'}</p>
                          </div>
                          <div className="text-right border-l border-slate-100 pl-6">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ritardo</p>
                            <p className={`text-sm font-black ${player.kpi?.totalDelayMinutes > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                              {player.kpi?.totalDelayMinutes > 0 ? `+${player.kpi.totalDelayMinutes}m` : 'OK'}
                            </p>
                          </div>
                          <div className="text-right border-l border-slate-100 pl-6">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Criticità</p>
                            <p className="text-sm font-black text-orange-500">Buca {player.kpi?.slowestHole || '-'}</p>
                          </div>
                        </div>
                      </div>

                      {/* 🔥 Grafico tempi per buca */}
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tempi per Buca (Secondi)</h4>
                        <div className="h-32 flex items-end gap-1.5 px-2 bg-slate-50 rounded-2xl border border-slate-100 py-4">
                          {player.holes?.map(s => {
                            const target = (paceConfig[s.holeNumber] || 14) * 60;
                            const height = Math.min(100, (s.totalTimeSeconds / (target * 1.5)) * 100);
                            const isOver = s.totalTimeSeconds > target;
                            return (
                              <div key={s.holeNumber} className="flex-1 flex flex-col items-center gap-2 group relative">
                                <div 
                                  className={`w-full rounded-t-sm transition-all ${isOver ? 'bg-red-400 group-hover:bg-red-500' : 'bg-emerald-400 group-hover:bg-emerald-500'}`} 
                                  style={{ height: `${height}%` }}
                                />
                                <span className="text-[7px] font-black text-slate-400">H{s.holeNumber}</span>
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                  {formatSeconds(s.totalTimeSeconds)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* 🔥 Tabella dettagli buca */}
                      <div className="bg-white border border-slate-200 rounded-[1.5rem] overflow-hidden shadow-sm">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest border-b border-slate-100">
                            <tr>
                              <th className="px-6 py-4">Buca</th>
                              <th className="px-6 py-4">Tee</th>
                              <th className="px-6 py-4">Fairway</th>
                              <th className="px-6 py-4">Green</th>
                              <th className="px-6 py-4">Totale</th>
                              <th className="px-6 py-4 text-right pr-8">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {player.holes?.map(s => {
                              const target = paceConfig[s.holeNumber] || 14;
                              const totalMins = Math.floor(s.totalTimeSeconds / 60);
                              const diff = totalMins - target;
                              
                              return (
                                <tr key={s.holeNumber} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-6 py-4 font-black">H{s.holeNumber}</td>
                                  <td className="px-6 py-4 text-slate-500">{formatSeconds(s.teeTimeSeconds)}</td>
                                  <td className="px-6 py-4 text-slate-500">{formatSeconds(s.fairwayTimeSeconds)}</td>
                                  <td className="px-6 py-4 text-slate-500">{formatSeconds(s.greenTimeSeconds)}</td>
                                  <td className="px-6 py-4 font-black text-slate-900">{formatSeconds(s.totalTimeSeconds)}</td>
                                  <td className="px-6 py-4 text-right pr-8">
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${diff > 2 ? 'bg-red-100 text-red-600' : diff > 0 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                      {diff > 0 ? `+${diff}m` : 'In Time'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="h-full flex gap-8 overflow-hidden">

            {/* Projection Controls */}
            <aside className="w-80 space-y-6 shrink-0">
              <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-8">
                <div className="flex items-center gap-3 text-emerald-600">
                  <Calculator size={20} />
                  <h3 className="font-black text-xs uppercase tracking-widest">Proiezione Flussi</h3>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase px-1">Partenza Primo Flight</label>
                    <input 
                      type="time" 
                      value={projStartTime}
                      onChange={e => setProjStartTime(e.target.value)}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between px-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Intervallo (min)</label>
                      <span className="text-[10px] font-black text-emerald-600">{projInterval}m</span>
                    </div>
                    <input 
                      type="range" min="6" max="15" step="1"
                      value={projInterval}
                      onChange={e => setProjInterval(Number(e.target.value))}
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between px-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Numero Flight</label>
                      <span className="text-[10px] font-black text-emerald-600">{projNumFlights}</span>
                    </div>
                    <input 
                      type="range" min="1" max="50" step="1"
                      value={projNumFlights}
                      onChange={e => setProjNumFlights(Number(e.target.value))}
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 rounded-[2rem] p-8 text-white space-y-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <Zap size={18} className="text-amber-400" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest">Proiezione Target</h4>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase">Chiusura Ultimo Flight</p>
                    <p className="text-xl font-black text-emerald-400">{projectionData[projectionData.length - 1]?.finish || '--:--'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase">Durata Giro Prevista</p>
                    <p className="text-xl font-black text-white">4h 12m</p>
                  </div>
                </div>
              </div>
            </aside>

            {/* Projection Content */}
            <section className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                <div className="flex items-center gap-3 text-slate-900">
                  <Timer size={20} className="text-emerald-600" />
                  <h3 className="font-black text-sm uppercase tracking-widest">Timeline Chiusura Buche Teorica</h3>
                </div>
              </div>
              
              <div className="flex-1 overflow-x-auto scrollbar-hide">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-white sticky top-0 z-10 text-[9px] font-black uppercase tracking-widest text-slate-400 shadow-sm">
                    <tr>
                      <th className="px-6 py-5 border-b border-slate-100 bg-white">Flight</th>
                      <th className="px-6 py-5 border-b border-slate-100 bg-white">Start</th>
                      {[...Array(18)].map((_, i) => (
                        <th key={i} className="px-4 py-5 border-b border-slate-100 bg-slate-50/50 text-center">B{i+1}</th>
                      ))}
                      <th className="px-6 py-5 border-b border-slate-100 bg-emerald-50 text-emerald-600 text-center">Finish</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {projectionData.map(f => (
                      <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-5 font-black text-slate-400">FLIGHT {f.id}</td>
                        <td className="px-6 py-5 font-bold text-slate-900">{f.start}</td>
                        {f.holes.map(h => (
                          <td key={h.hole} className="px-4 py-5 text-[10px] text-center font-medium text-slate-600 border-x border-slate-50/20">{h.time}</td>
                        ))}
                        <td className="px-6 py-5 font-black text-emerald-600 bg-emerald-50/30 text-center">{f.finish}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Simplified Gantt Visualization */}
              <div className="p-8 border-t border-slate-100 bg-slate-50/30 shrink-0">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Visualizzazione Densità di Gioco</h4>
                <div className="space-y-3">
                  {projectionData.slice(0, 5).map(f => (
                    <div key={f.id} className="flex items-center gap-4">
                      <span className="text-[8px] font-black text-slate-400 w-12">FLIGHT {f.id}</span>
                      <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden relative">
                        <div 
                          className="absolute h-full bg-emerald-500 rounded-full"
                          style={{ 
                            left: `${(f.id - 1) * 3}%`, 
                            width: '60%' 
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between px-16 text-[8px] font-black text-slate-400 uppercase mt-2">
                    <span>08:00</span>
                    <span>10:00</span>
                    <span>12:00</span>
                    <span>14:00</span>
                    <span>16:00</span>
                    <span>18:00</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};
