import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Loader2, X } from 'lucide-react';
import { timeclockService } from "../../services/timeclock.service";

export const HistoryScreenMobile = ({ user, staffData, onClose }: any) => {
  const [history, setHistory] = useState<any[]>([]);
  const [filter, setFilter] = useState<'today' | 'week' | 'month'>('today');
  const [loading, setLoading] = useState(false);

  const loadHistory = async () => {
    if (!staffData) return;
    setLoading(true);
    try {
      const data = await timeclockService.getHistory(staffData.clubId, staffData.uid, filter);
      setHistory(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [filter, staffData]);

  const typeLabels: any = {
    clock_in: { label: 'INGRESSO', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    clock_out: { label: 'USCITA', color: 'text-rose-500', bg: 'bg-rose-50' },
    break_start: { label: 'PAUSA', color: 'text-amber-500', bg: 'bg-amber-50' },
    break_end: { label: 'RIENTRO', color: 'text-blue-500', bg: 'bg-blue-50' }
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans">
      <header className="bg-white px-6 py-5 border-b border-slate-100 sticky top-0 z-20 shrink-0">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Storico Timbri</h1>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={20} /></button>
        </div>
        <div className="flex gap-2 mt-4 bg-slate-100 p-1 rounded-xl">
          {(['today', 'week', 'month'] as const).map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
            >
              {f === 'today' ? 'Oggi' : f === 'week' ? 'Settimana' : 'Mese'}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 p-6 overflow-y-auto scrollbar-hide">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center opacity-40 py-20">
            <Loader2 size={40} className="animate-spin text-emerald-500 mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">Caricamento...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-4 opacity-30">
            <Calendar size={64} className="text-slate-300" />
            <p className="text-sm font-black uppercase tracking-widest">Nessuna timbrata trovata</p>
          </div>
        ) : (
          <div className="space-y-3 pb-24">
            {history.map((item) => {
              const date = item.timestamp?.toMillis ? new Date(item.timestamp.toMillis()) : new Date();
              const cfg = typeLabels[item.type] || { label: 'PUNCH', color: 'text-slate-500', bg: 'bg-slate-50' };
              
              return (
                <div key={item.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between hover:border-emerald-200 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-[10px] ${cfg.bg} ${cfg.color}`}>
                      {cfg.label.slice(0, 3)}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 uppercase">{date.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{date.toLocaleDateString()}</p>
                    </div>
                  </div>
                  {item.location && <MapPin size={16} className="text-emerald-500 opacity-40" />}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};