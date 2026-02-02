import React, { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, FileSpreadsheet, Calendar, User, Download, ChevronRight } from 'lucide-react';
import { Language, StaffWorker, UserProfile } from '../../types';
import { TimeclockEntry } from '../../types/StaffTypes';
import { staffWorkersService } from '../../services/staffWorkers.service';
import { timeclockService } from '../../services/timeclock.service';
import * as XLSX from 'xlsx';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

interface Props {
  clubId: string;
  onBack: () => void;
  lang: Language;
  user: UserProfile | null;
}

type ExportPeriod = 'day' | 'week' | 'month' | 'custom';

export const TimeclockExportPanel: React.FC<Props> = ({ clubId, onBack, lang, user }) => {
  const [workers, setWorkers] = useState<StaffWorker[]>([]);
  const [entries, setEntries] = useState<TimeclockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  const [period, setPeriod] = useState<ExportPeriod>('month');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const loadData = async () => {
    setLoading(true);
    try {
      const workersData = await staffWorkersService.getWorkersByClub(clubId);
      const normalizedWorkers = workersData.map(w => ({
        ...w,
        clubId: w.clubId || clubId
      }));

      const entriesData = await timeclockService.getTimeclockEntries(clubId);

      setWorkers(normalizedWorkers.filter(w => !w.disabled));
      setEntries(entriesData);
    } catch (err) {
      console.error("Error loading export data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [clubId]);

  const getFilteredEntries = () => {
    const now = new Date();
    let range: { start: Date; end: Date };

    switch (period) {
      case 'day':
        range = { start: startOfDay(now), end: endOfDay(now) };
        break;
      case 'week':
        range = { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
        break;
      case 'month':
        range = { start: startOfMonth(now), end: endOfMonth(now) };
        break;
      case 'custom':
        range = { start: startOfDay(new Date(startDate)), end: endOfDay(new Date(endDate)) };
        break;
      default:
        range = { start: startOfMonth(now), end: endOfMonth(now) };
    }

    return entries.filter(entry => {
      const ts = entry.timestamp?.toMillis ? entry.timestamp.toMillis() : 0;
      if (ts === 0) return false;
      return isWithinInterval(new Date(ts), range);
    });
  };

  const exportExcel = async () => {
    setExporting(true);
    try {
      const filtered = getFilteredEntries();
      const exportData: any[] = [];
      const workerGroups: Record<string, TimeclockEntry[]> = {};

      filtered.forEach(e => {
        if (!workerGroups[e.workerUid]) workerGroups[e.workerUid] = [];
        workerGroups[e.workerUid].push(e);
      });

      Object.keys(workerGroups).forEach(wUid => {
        const worker = workers.find(w => w.uid === wUid);
        const wEntries = workerGroups[wUid].sort((a, b) => {
          const tsA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
          const tsB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
          return tsA - tsB;
        });

        let currentIn: TimeclockEntry | null = null;
        wEntries.forEach(entry => {
          if (entry.type === 'clock_in') {
            currentIn = entry;
          } else if (entry.type === 'clock_out' && currentIn) {
            const inTs = currentIn.timestamp?.toMillis ? currentIn.timestamp.toMillis() : 0;
            const outTs = entry.timestamp?.toMillis ? entry.timestamp.toMillis() : 0;
            const dur = Math.floor((outTs - inTs) / 60000);

            exportData.push({
              'Nome e Cognome': worker?.displayName || `${worker?.firstName} ${worker?.lastName}`,
              'Data': format(new Date(inTs), 'dd/MM/yyyy'),
              'Ora Inizio': format(new Date(inTs), 'HH:mm'),
              'Ora Fine': format(new Date(outTs), 'HH:mm'),
              'Durata (Ore e minuti)': `${Math.floor(dur / 60)}h ${dur % 60}m`
            });
            currentIn = null;
          }
        });

        if (currentIn) {
          const inTs = currentIn.timestamp?.toMillis ? currentIn.timestamp.toMillis() : 0;
          exportData.push({
            'Nome e Cognome': worker?.displayName || `${worker?.firstName} ${worker?.lastName}`,
            'Data': format(new Date(inTs), 'dd/MM/yyyy'),
            'Ora Inizio': format(new Date(inTs), 'HH:mm'),
            'Ora Fine': 'In corso',
            'Durata (Ore e minuti)': '—'
          });
        }
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Report Presenze");
      worksheet['!cols'] = [{wch: 30}, {wch: 15}, {wch: 12}, {wch: 12}, {wch: 25}];
      const fileName = `Report_Presenze_${period.toUpperCase()}_${format(new Date(), 'yyyyMMdd')}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (err) {
      console.error("Export failure:", err);
      alert("Errore durante la generazione del file Excel.");
    } finally {
      setExporting(false);
    }
  };

  const filteredCount = getFilteredEntries().length;

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 px-6 py-5 flex items-center gap-3 shrink-0 shadow-sm">
        <button 
          onClick={onBack} 
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
        >
          <ArrowLeft size={20}/>
        </button>

        <div>
          <h1 className="text-lg font-black uppercase tracking-tight text-slate-900">Export Registro</h1>
          <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">
            Report Mensili & Excel
          </p>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-10">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center opacity-40 py-20">
            <Loader2 size={40} className="animate-spin mb-4 text-emerald-600" />
            <p className="text-[10px] font-black uppercase tracking-widest">Analisi dati in corso...</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
            
            {/* SELEZIONE PERIODO */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Periodo del Report</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { id: 'day', label: 'Oggi' },
                    { id: 'week', label: 'Settimana' },
                    { id: 'month', label: 'Mese' },
                    { id: 'custom', label: 'Altro' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setPeriod(opt.id as ExportPeriod)}
                      className={`py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                        period === opt.id 
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg' 
                        : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {period === 'custom' && (
                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Inizio</label>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Fine</label>
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* INFO CARD */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-[2.5rem] p-8 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                  <Calendar size={28}/>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-emerald-600/60 tracking-widest leading-none mb-2">Totale record trovati</p>
                  <p className="text-3xl font-black text-emerald-700">{filteredCount}</p>
                </div>
              </div>
              <ChevronRight className="text-emerald-300" size={24} />
            </div>

            {/* EXPORT BUTTON */}
            <div className="space-y-6 pt-4">
               <button
                onClick={exportExcel}
                disabled={exporting || filteredCount === 0}
                className="group relative w-full overflow-hidden h-24 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all active:scale-95 disabled:opacity-30"
              >
                <div className="relative z-10 flex items-center justify-center gap-4">
                  {exporting ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <Download size={24} className="text-emerald-400" />
                  )}
                  <span className="text-sm">Genera Documento Excel</span>
                </div>
              </button>

              <div className="flex items-center gap-3 px-6 py-4 bg-slate-100 rounded-2xl border border-slate-200">
                 <FileSpreadsheet size={16} className="text-slate-400" />
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight leading-relaxed">
                   Il report include: Anagrafica dipendente, data turno, orari esatti e calcolo automatico delle ore lavorate.
                 </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};