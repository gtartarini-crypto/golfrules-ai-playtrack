import React, { useState, useEffect } from 'react';
// Added User to imports
import { Clock, Play, Square, Coffee, History, MapPin, Loader2, LogOut, User } from 'lucide-react';
import { UserProfile, ShiftStatus, Language } from '../../types';
import { timeclockService } from '../../services/timeclock.service';
import { TimeclockEntry } from '../../types/StaffTypes';

interface Props {
  user: UserProfile;
  lang: Language;
  onLogout: () => void;
  onNavigate: (view: any) => void;
}

export const TimeclockScreen: React.FC<Props> = ({ user, lang, onLogout, onNavigate }) => {
  const [status, setStatus] = useState<ShiftStatus>('clocked_out');
  const [history, setHistory] = useState<TimeclockEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [gps, setGps] = useState<{lat: number, lng: number} | null>(null);

  const loadData = async () => {
    if (!user.homeClubId) return;
    // Fix: Replaced getTimeclockHistory with correct getHistory method
    const hist = await timeclockService.getHistory(user.homeClubId, user.uid, 'week');
    setHistory(hist);
    
    // Determine current status from last entry
    if (hist.length > 0) {
      const last = hist[0];
      if (last.type === 'clock_in' || last.type === 'break_end') setStatus('clocked_in');
      else if (last.type === 'break_start') setStatus('on_break');
      else setStatus('clocked_out');
    }
  };

  useEffect(() => {
    // Fix: Replaced invalid listenToShiftStatus with initial data load
    loadData();
    
    // Acquisisci GPS
    navigator.geolocation.getCurrentPosition(
        (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        null, { enableHighAccuracy: true }
    );
  }, [user.uid]);

  const handleAction = async (action: TimeclockEntry['type']) => {
    if (!user.homeClubId) return;
    setLoading(true);
    try {
        // Fix: Consolidated multiple invalid calls into unified punch method
        await timeclockService.punch({
          clubId: user.homeClubId,
          workerUid: user.uid,
          type: action,
          punchedBy: user.uid,
          timestamp: Date.now(),
          location: gps || undefined
        });
        await loadData();
    } finally {
        setLoading(false);
    }
  };

  const statusColors = {
      clocked_out: 'bg-slate-800 text-slate-400 border-slate-700',
      clocked_in: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]',
      on_break: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
  };

  return (
    <div className="h-full bg-slate-950 text-white flex flex-col font-sans overflow-hidden">
      <header className="px-6 py-8 flex flex-col items-center shrink-0 space-y-4">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-[1.5rem] flex items-center justify-center border border-emerald-500/20">
            <Clock size={32} className="text-emerald-400" />
        </div>
        <div className="text-center">
            <h2 className="text-2xl font-black uppercase tracking-tighter">Timeclock</h2>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">{user.displayName}</p>
        </div>

        <div className={`mt-2 px-6 py-2 rounded-full border text-[11px] font-black uppercase tracking-widest transition-all ${statusColors[status]}`}>
            {status === 'clocked_in' && <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse" />}
            Status: {status.replace('_', ' ')}
        </div>
      </header>

      <main className="flex-1 p-6 space-y-6 overflow-y-auto scrollbar-hide">
        {/* Pulsanti Azione */}
        <div className="grid grid-cols-1 gap-4">
            {status === 'clocked_out' ? (
                <button 
                    onClick={() => handleAction('clock_in')}
                    disabled={loading}
                    className="h-24 bg-emerald-500 text-slate-950 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] flex flex-col items-center justify-center gap-1 shadow-2xl active:scale-95 transition-all shadow-emerald-500/20"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Play size={28} />}
                    Inizio Turno
                </button>
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => handleAction(status === 'on_break' ? 'break_end' : 'break_start')}
                            disabled={loading}
                            className="h-28 bg-slate-900 border border-white/10 rounded-[2rem] font-black text-xs uppercase tracking-widest flex flex-col items-center justify-center gap-2 active:scale-95 transition-all"
                        >
                            {status === 'on_break' ? <Play size={24} className="text-emerald-400"/> : <Coffee size={24} className="text-amber-400"/>}
                            {status === 'on_break' ? 'Fine Pausa' : 'Inizio Pausa'}
                        </button>
                        <button 
                            onClick={() => handleAction('clock_out')}
                            disabled={loading}
                            className="h-28 bg-red-500/10 border border-red-500/30 text-red-500 rounded-[2rem] font-black text-xs uppercase tracking-widest flex flex-col items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-red-500/10"
                        >
                            <Square size={24}/>
                            Fine Turno
                        </button>
                    </div>
                </>
            )}
        </div>

        {/* Info GPS */}
        <div className="bg-slate-900/40 p-4 rounded-2xl border border-white/5 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${gps ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                <MapPin size={18} className={!gps ? 'animate-pulse' : ''}/>
            </div>
            <div className="flex-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Geofencing Position</p>
                <p className="text-[10px] font-bold mt-1 text-slate-300">
                    {gps ? `${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)} (Active)` : 'Acquisizione GPS in corso...'}
                </p>
            </div>
        </div>

        {/* Recenti */}
        <section className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-2">
                <History size={14}/> Ultimi Timbri
            </h3>
            <div className="space-y-2">
                {history.map(entry => (
                    <div key={entry.id} className="bg-white/5 border border-white/5 p-3 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs border ${
                                entry.type === 'clock_in' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                entry.type === 'clock_out' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                'bg-amber-500/10 text-amber-700 border-amber-100'
                            }`}>
                                {entry.type.charAt(0).toUpperCase()}
                            </span>
                            <span className="text-[11px] font-bold text-slate-300 uppercase">{entry.type.replace('_', ' ')}</span>
                        </div>
                        <span className="text-[10px] font-black text-slate-500">
                            {entry.timestamp?.toMillis ? new Date(entry.timestamp.toMillis()).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '...'}
                        </span>
                    </div>
                ))}
            </div>
        </section>
      </main>

      <nav className="h-20 bg-slate-900 border-t border-white/10 grid grid-cols-2 shrink-0">
          <button onClick={() => onNavigate('worker_timeclock')} className="flex flex-col items-center justify-center gap-1 text-emerald-400">
              <Clock size={20}/>
              <span className="text-[9px] font-black uppercase tracking-widest">Timeclock</span>
          </button>
          <button onClick={() => onNavigate('worker_profile')} className="flex flex-col items-center justify-center gap-1 text-slate-500">
              <User size={20}/>
              <span className="text-[9px] font-black uppercase tracking-widest">Profilo</span>
          </button>
      </nav>
    </div>
  );
};