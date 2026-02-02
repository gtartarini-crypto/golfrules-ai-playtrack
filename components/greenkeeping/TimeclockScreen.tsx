import React, { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Clock, User, ChevronDown, ChevronUp, FileSpreadsheet, Calendar, MapPin, Filter } from 'lucide-react';
import { Language, StaffWorker, UserProfile, AppView } from '../../types';
import { staffWorkersService } from '../../services/staffWorkers.service';
import { timeclockService } from '../../services/timeclock.service';
import { TimeclockEntry } from '../../types/StaffTypes';
import * as XLSX from 'xlsx';

interface Props {
  clubId: string;
  onBack: () => void;
  lang: Language;
  user: UserProfile | null;
  onNavigate?: (view: AppView, params?: any) => void;
}

interface WorkerShift {
  date: string;
  clockIn: Date | null;
  clockOut: Date | null;
  durationMinutes: number;
  timestamp: number;
}

export const TimeclockScreen: React.FC<Props> = ({ clubId, onBack, lang, user, onNavigate }) => {
  const [workers, setWorkers] = useState<StaffWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedWorkerId, setExpandedWorkerId] = useState<string | null>(null);
  const [workerHistory, setWorkerHistory] = useState<Record<string, WorkerShift[]>>({});
  const [loadingHistory, setLoadingHistory] = useState<string | null>(null);
  
  // Selezione Mese
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
  ];

  const loadWorkers = async () => {
    setLoading(true);
    try {
      const data = await staffWorkersService.getWorkersByClub(clubId);
      setWorkers(data.filter(w => !w.disabled));
    } catch (err) {
      console.error("Error loading workers:", err);
    } finally {
      setLoading(false);
    }
  };

  const processShifts = (entries: TimeclockEntry[]): WorkerShift[] => {
    const sorted = [...entries].sort((a, b) => {
      const tsA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
      const tsB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
      return tsA - tsB;
    });

    const shifts: WorkerShift[] = [];
    let currentIn: TimeclockEntry | null = null;

    sorted.forEach((entry) => {
      if (entry.type === 'clock_in') {
        currentIn = entry;
      } else if (entry.type === 'clock_out' && currentIn) {
        const inDate = currentIn.timestamp?.toMillis ? new Date(currentIn.timestamp.toMillis()) : new Date();
        const outDate = entry.timestamp?.toMillis ? new Date(entry.timestamp.toMillis()) : new Date();
        
        shifts.push({
          date: inDate.toLocaleDateString(),
          clockIn: inDate,
          clockOut: outDate,
          durationMinutes: Math.floor((outDate.getTime() - inDate.getTime()) / 60000),
          timestamp: inDate.getTime()
        });
        currentIn = null;
      }
    });

    if (currentIn) {
      const inDate = (currentIn as any).timestamp?.toMillis ? new Date((currentIn as any).timestamp.toMillis()) : new Date();
      shifts.push({
        date: inDate.toLocaleDateString(),
        clockIn: inDate,
        clockOut: null,
        durationMinutes: 0,
        timestamp: inDate.getTime()
      });
    }

    return shifts.reverse();
  };

  const toggleWorker = async (workerId: string) => {
    if (expandedWorkerId === workerId) {
      setExpandedWorkerId(null);
      return;
    }

    setExpandedWorkerId(workerId);
    // Ricarichiamo sempre per assicurarci che il filtro mese sia applicato o ricarichiamo se necessario
    setLoadingHistory(workerId);
    try {
      // Usiamo 'month' per ora, ma poi filtriamo localmente per il mese selezionato
      const history = await timeclockService.getHistory(clubId, workerId, 'month');
      setWorkerHistory(prev => ({
        ...prev,
        [workerId]: processShifts(history)
      }));
    } catch (err) {
      console.error("Error loading history:", err);
    } finally {
      setLoadingHistory(null);
    }
  };

  const getFilteredHistory = (workerId: string) => {
    const history = workerHistory[workerId] || [];
    return history.filter(s => {
      const d = new Date(s.timestamp);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  };

  const calculateTotalTime = (shifts: WorkerShift[]) => {
    const totalMins = shifts.reduce((acc, s) => acc + s.durationMinutes, 0);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${h}h ${m}m`;
  };

  const exportWorkerExcel = (worker: StaffWorker) => {
    const history = getFilteredHistory(worker.uid);
    const data = history.map(s => ({
      'Nome': worker.firstName,
      'Cognome': worker.lastName,
      'Data': s.date,
      'Ora Inizio': s.clockIn ? s.clockIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
      'Ora Fine': s.clockOut ? s.clockOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'In corso',
      'Durata': `${Math.floor(s.durationMinutes / 60)}h ${s.durationMinutes % 60}m`,
      'Minuti Totali': s.durationMinutes
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Timbrature");
    XLSX.writeFile(wb, `Timbrature_${worker.lastName}_${months[selectedMonth]}_${selectedYear}.xlsx`);
  };

  useEffect(() => {
    loadWorkers();
  }, [clubId]);

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 px-6 py-5 flex items-center justify-between gap-3 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack} 
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
          >
            <ArrowLeft size={20}/>
          </button>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tight text-slate-900">Registro Presenze</h1>
            <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">
              Monitoraggio Timbrature Staff
            </p>
          </div>
        </div>

        {/* Month Selector in Header Area */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <Filter size={14} className="text-slate-400 ml-1" />
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="bg-transparent text-[10px] font-black uppercase outline-none cursor-pointer text-slate-700"
          >
            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="bg-transparent text-[10px] font-black uppercase outline-none cursor-pointer text-slate-700"
          >
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center opacity-40">
            <Loader2 size={40} className="animate-spin text-emerald-600 mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">Caricamento Operai...</p>
          </div>
        ) : workers.length === 0 ? (
          <div className="py-20 text-center text-slate-400 font-black uppercase text-xs tracking-widest italic">
            Nessun operaio attivo trovato nel circolo
          </div>
        ) : (
          workers.map(worker => {
            const isExpanded = expandedWorkerId === worker.uid;
            const history = getFilteredHistory(worker.uid);
            
            return (
              <div 
                key={worker.uid} 
                className="bg-white border border-slate-200 rounded-[1.5rem] shadow-sm overflow-hidden transition-all duration-300"
              >
                {/* WORKER ROW (ACCORDION HEADER) */}
                <div 
                  onClick={() => toggleWorker(worker.uid)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 shadow-inner">
                      <User size={24}/>
                    </div>
                    <div>
                      <h3 className="font-black text-sm uppercase leading-none text-slate-900">
                        {worker.displayName || `${worker.firstName} ${worker.lastName}`}
                      </h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mt-1.5 tracking-widest flex items-center gap-1">
                        <MapPin size={10} className="text-emerald-500" /> {worker.role || 'Operaio'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {isExpanded && !loadingHistory && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); exportWorkerExcel(worker); }}
                        className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all border border-emerald-100 shadow-sm"
                        title="Esporta Excel Mese"
                      >
                        <FileSpreadsheet size={18} />
                      </button>
                    )}
                    <div className="text-slate-300">
                      {isExpanded ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                    </div>
                  </div>
                </div>

                {/* EXPANDED CONTENT (ACCORDION BODY) */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 animate-in slide-in-from-top-2 duration-300">
                    {loadingHistory === worker.uid ? (
                      <div className="p-8 flex justify-center items-center gap-3">
                        <Loader2 className="animate-spin text-emerald-500" size={16} />
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Caricamento storico...</span>
                      </div>
                    ) : (
                      <div className="p-4 space-y-4">
                        {/* KPI TURNI */}
                        <div className="flex justify-between items-center px-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
                           <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-slate-400" />
                              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                                Totale {months[selectedMonth]}:
                              </span>
                           </div>
                           <span className="text-sm font-black text-emerald-600">{calculateTotalTime(history)}</span>
                        </div>

                        {/* LISTA TIMBRATURE */}
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                           <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 border-b border-slate-100 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                                 <tr>
                                    <th className="px-4 py-3">Data</th>
                                    <th className="px-4 py-3">Inizio</th>
                                    <th className="px-4 py-3">Fine</th>
                                    <th className="px-4 py-3 text-right">Durata</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                 {history.length === 0 ? (
                                   <tr>
                                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">Nessuna timbrata in {months[selectedMonth]}</td>
                                   </tr>
                                 ) : (
                                   history.map((s, idx) => (
                                     <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 font-bold text-slate-600">{s.date}</td>
                                        <td className="px-4 py-3">
                                           <div className="flex items-center gap-2">
                                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                              <span className="font-black text-slate-900">{s.clockIn?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                           </div>
                                        </td>
                                        <td className="px-4 py-3">
                                           <div className="flex items-center gap-2">
                                              <div className={`w-1.5 h-1.5 rounded-full ${s.clockOut ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'}`} />
                                              <span className={`font-black ${s.clockOut ? 'text-slate-900' : 'text-amber-600 italic'}`}>
                                                 {s.clockOut ? s.clockOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'In corso'}
                                              </span>
                                           </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                           <span className="font-black text-emerald-600">
                                              {Math.floor(s.durationMinutes / 60)}h {s.durationMinutes % 60}m
                                           </span>
                                        </td>
                                     </tr>
                                   ))
                                 )}
                              </tbody>
                           </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>
    </div>
  );
};