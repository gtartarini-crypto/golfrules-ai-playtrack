import React, { useEffect, useState, useMemo } from 'react';
import { 
  ArrowLeft, Loader2, User, Phone, Mail, FileText, MapPin, 
  Calendar, ShieldAlert, IdCard, Clock, ChevronDown, 
  ChevronRight, Filter, Download, Briefcase, Timer
} from 'lucide-react';
import { Language, StaffWorker, UserProfile } from '../../types';
import { staffWorkersService } from '../../services/staffWorkers.service';
import { timeclockService } from '../../services/timeclock.service';
import { TimeclockEntry } from '../../types/StaffTypes';
import { format, getYear, getMonth } from 'date-fns';
import { it, enUS } from 'date-fns/locale';

interface Props {
  uid: string;
  clubId: string;
  onBack: () => void;
  lang: Language;
  user: UserProfile | null;
}

export const WorkerProfileScreen: React.FC<Props> = ({ uid, clubId, onBack, lang, user }) => {
  const [worker, setWorker] = useState<StaffWorker | null>(null);
  const [entries, setEntries] = useState<TimeclockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const dateLocale = lang === 'it' ? it : enUS;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [workerData, historyData] = await Promise.all([
          staffWorkersService.getWorker(uid),
          timeclockService.getTimeclockEntries(clubId) 
        ]);
        
        const workerEntries = historyData.filter(e => e.workerUid === uid);
        setWorker(workerData);
        setEntries(workerEntries);
      } catch (e) {
        console.error("Error loading worker detail:", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [uid, clubId]);

  const monthlyStats = useMemo(() => {
    const months: Record<number, { 
      name: string, 
      entries: any[], 
      totalMinutes: number 
    }> = {};

    for (let i = 0; i < 12; i++) {
      months[i] = {
        name: format(new Date(selectedYear, i, 1), 'MMMM', { locale: dateLocale }),
        entries: [],
        totalMinutes: 0
      };
    }

    const sortedEntries = [...entries].sort((a, b) => {
      const tsA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
      const tsB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
      return tsA - tsB;
    });

    let currentIn: TimeclockEntry | null = null;

    sortedEntries.forEach(entry => {
      const entryDate = entry.timestamp?.toMillis ? new Date(entry.timestamp.toMillis()) : new Date();
      if (getYear(entryDate) !== selectedYear) return;

      if (entry.type === 'clock_in') {
        currentIn = entry;
      } else if (entry.type === 'clock_out' && currentIn) {
        const inDate = currentIn.timestamp?.toMillis ? new Date(currentIn.timestamp.toMillis()) : new Date();
        const outDate = entry.timestamp?.toMillis ? new Date(entry.timestamp.toMillis()) : new Date();
        const duration = Math.floor((outDate.getTime() - inDate.getTime()) / 60000);
        const monthIdx = getMonth(inDate);

        months[monthIdx].entries.push({
          date: inDate,
          dayName: format(inDate, 'EEEE', { locale: dateLocale }),
          formattedDate: format(inDate, 'dd/MM/yyyy'),
          in: format(inDate, 'HH:mm'),
          out: format(outDate, 'HH:mm'),
          duration
        });
        months[monthIdx].totalMinutes += duration;
        currentIn = null;
      }
    });

    return Object.values(months)
      .filter(m => m.entries.length > 0)
      .reverse();
  }, [entries, selectedYear, dateLocale]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 size={48} className="animate-spin text-emerald-600" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Analisi Registro Presenze...</p>
      </div>
    );
  }

  if (!worker) return <div className="p-12 text-center font-black">OPERAIO NON TROVATO</div>;

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans overflow-hidden">
      {/* HEADER HD */}
      <header className="bg-white border-b border-slate-200 px-10 py-6 flex items-center justify-between shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors text-slate-500">
            <ArrowLeft size={24}/>
          </button>
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
               <User size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 leading-none">
                {worker.firstName} {worker.lastName}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                 <span className="text-[10px] font-black px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 uppercase tracking-widest">
                    {worker.role === 'greenkeeper' ? 'Supervisor / GK' : 'Grounds Staff'}
                 </span>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <MapPin size={12} /> ID: {worker.uid.slice(-6).toUpperCase()}
                 </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <Calendar size={16} className="text-slate-400 ml-2" />
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="bg-transparent text-xs font-black uppercase outline-none cursor-pointer pr-4 text-slate-900"
              >
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
           </div>
           <button className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-black transition-all">
              <Download size={16} /> Esporta Report
           </button>
        </div>
      </header>

      {/* CONTENUTO HD FULL WIDTH */}
      <main className="flex-1 overflow-hidden flex flex-row">
        
        {/* SIDEBAR INFO (Compact) */}
        <aside className="w-96 border-r border-slate-200 bg-white overflow-y-auto p-10 space-y-8 scrollbar-hide shrink-0">
           <section className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Contatti & Emergenza</h3>
              <div className="space-y-4">
                 <InfoRow icon={<Phone size={16}/>} label="Cellulare" value={worker.mobile} isLink={`tel:${worker.mobile}`} />
                 <InfoRow icon={<Mail size={16}/>} label="Email" value={worker.email} isLink={`mailto:${worker.email}`} />
                 <InfoRow icon={<IdCard size={16}/>} label="Codice Fiscale" value={worker.niNumber} uppercase />
              </div>
           </section>

           <section className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Dati Aziendali</h3>
              <div className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                 <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Note Interne</p>
                 <p className="text-xs text-slate-600 leading-relaxed italic">{worker.notes || 'Nessuna nota registrata.'}</p>
              </div>
              {worker.medicalInfo && (
                <div className="p-5 bg-rose-50 rounded-[1.5rem] border border-rose-100 flex gap-3">
                   <ShieldAlert size={18} className="text-rose-500 shrink-0" />
                   <div>
                      <p className="text-[10px] font-black text-rose-900 uppercase mb-1">Info Mediche</p>
                      <p className="text-xs text-rose-800 font-bold leading-relaxed">{worker.medicalInfo}</p>
                   </div>
                </div>
              )}
           </section>

           <div className="pt-10">
              <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.3em]">Sistema PlayTrack Cloud</p>
           </div>
        </aside>

        {/* REGISTRO TIMESHEET (Full HD Width) */}
        <section className="flex-1 overflow-y-auto p-10 scrollbar-hide space-y-8 bg-slate-50/50">
           
           <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                <Clock className="text-emerald-600" /> Registro Presenze {selectedYear}
              </h2>
           </div>

           {monthlyStats.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 opacity-40">
                <FileText size={48} />
                <p className="text-[10px] font-black uppercase mt-4">Nessun dato registrato nell'anno {selectedYear}</p>
              </div>
           ) : (
             monthlyStats.map((month, mIdx) => (
               <div key={mIdx} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden mb-10">
                  {/* Mese Header */}
                  <div className="px-8 py-5 bg-slate-900 text-white flex items-center justify-between">
                     <h4 className="font-black uppercase tracking-widest text-sm">{month.name}</h4>
                     <div className="flex items-center gap-6">
                        <div className="text-right">
                           <p className="text-[8px] font-black text-slate-400 uppercase">Totale Ore</p>
                           <p className="text-sm font-black text-emerald-400">{Math.floor(month.totalMinutes / 60)}h {month.totalMinutes % 60}m</p>
                        </div>
                        <div className="text-right border-l border-white/10 pl-6">
                           <p className="text-[8px] font-black text-slate-400 uppercase">Turni</p>
                           <p className="text-sm font-black">{month.entries.length}</p>
                        </div>
                     </div>
                  </div>

                  {/* Tabella Turni del Mese */}
                  <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                           <tr>
                              <th className="px-8 py-4">Giorno</th>
                              <th className="px-6 py-4">Data</th>
                              <th className="px-6 py-4">Check-In</th>
                              <th className="px-6 py-4">Check-Out</th>
                              <th className="px-6 py-4 text-right pr-8">Durata Turno</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {month.entries.map((shift, sIdx) => (
                              <tr key={sIdx} className="hover:bg-slate-50/50 transition-colors group">
                                 <td className="px-8 py-4">
                                    <span className="font-black text-slate-900 uppercase text-xs">{shift.dayName}</span>
                                 </td>
                                 <td className="px-6 py-4 text-slate-500 font-medium">{shift.formattedDate}</td>
                                 <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                       <span className="font-bold text-slate-800">{shift.in}</span>
                                    </div>
                                 </td>
                                 <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                       <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                       <span className="font-bold text-slate-800">{shift.out}</span>
                                    </div>
                                 </td>
                                 <td className="px-6 py-4 text-right pr-8">
                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-black text-[10px] border border-emerald-100">
                                       {Math.floor(shift.duration / 60)}h {shift.duration % 60}m
                                    </span>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
             ))
           )}
        </section>
      </main>
    </div>
  );
};

const InfoRow = ({ icon, label, value, isLink, uppercase }: any) => (
  <div className="flex items-start gap-4">
     <div className="p-2.5 bg-slate-100 text-slate-400 rounded-xl">
        {icon}
     </div>
     <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        {isLink ? (
          <a href={isLink} className="text-sm font-bold text-emerald-600 hover:underline">{value || '—'}</a>
        ) : (
          <p className={`text-sm font-bold text-slate-800 ${uppercase ? 'uppercase' : ''}`}>{value || '—'}</p>
        )}
     </div>
  </div>
);