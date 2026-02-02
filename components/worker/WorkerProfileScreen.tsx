import React, { useState, useEffect } from 'react';
import { User, LogOut, Shield, MapPin, Clock, Calendar, ChevronRight, HardHat } from 'lucide-react';
import { UserProfile, Language, StaffWorker } from '../../types';
import { staffWorkersService } from '../../services/staffWorkers.service';

interface Props {
  user: UserProfile;
  lang: Language;
  onLogout: () => void;
  onNavigate: (view: any) => void;
  clubName: string;
}

export const WorkerProfileScreen: React.FC<Props> = ({ user, lang, onLogout, onNavigate, clubName }) => {
  const [worker, setWorker] = useState<StaffWorker | null>(null);

  useEffect(() => {
    staffWorkersService.getWorker(user.uid).then(setWorker);
  }, [user.uid]);

  return (
    <div className="h-full bg-slate-950 text-white flex flex-col font-sans overflow-hidden">
      <header className="p-8 pb-4 shrink-0 flex flex-col items-center space-y-4">
        <div className="w-24 h-24 rounded-[2.5rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center relative shadow-2xl">
            <HardHat size={48} className="text-emerald-400" />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-2xl flex items-center justify-center border-4 border-slate-950">
                <Shield size={14} className="text-slate-950" />
            </div>
        </div>
        <div className="text-center">
            <h2 className="text-2xl font-black uppercase tracking-tighter">{user.displayName}</h2>
            <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.2em] mt-1">
                {worker?.role === 'greenkeeper' ? 'Greenkeeper' : 'Grounds Worker'}
            </p>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-4 overflow-y-auto scrollbar-hide">
        <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <MapPin size={18} className="text-slate-500"/>
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Circolo</span>
                </div>
                <span className="text-xs font-black uppercase text-emerald-400">{clubName}</span>
            </div>

            <div className="h-px bg-white/5 w-full" />

            <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Statistiche Oggi</p>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950 p-4 rounded-2xl border border-white/5">
                        <Clock size={16} className="text-emerald-500 mb-2"/>
                        <p className="text-xl font-black text-white">8.5h</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Ore Lavorate</p>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-2xl border border-white/5">
                        <Calendar size={16} className="text-blue-500 mb-2"/>
                        <p className="text-xl font-black text-white">22</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Giorni Mese</p>
                    </div>
                </div>
            </div>
        </div>

        <button 
            onClick={onLogout}
            className="w-full h-16 bg-red-500/10 border border-red-500/30 text-red-500 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
            <LogOut size={18}/> Disconnetti Account
        </button>

        <p className="text-[9px] text-center text-slate-600 font-bold uppercase tracking-widest mt-4">
            GolfRules AI - Staff Portal v1.3
        </p>
      </main>

      <nav className="h-20 bg-slate-900 border-t border-white/10 grid grid-cols-2 shrink-0">
          <button onClick={() => onNavigate('worker_timeclock')} className="flex flex-col items-center justify-center gap-1 text-slate-500">
              <Clock size={20}/>
              <span className="text-[9px] font-black uppercase tracking-widest">Timeclock</span>
          </button>
          <button onClick={() => onNavigate('worker_profile')} className="flex flex-col items-center justify-center gap-1 text-emerald-400">
              <User size={20}/>
              <span className="text-[9px] font-black uppercase tracking-widest">Profilo</span>
          </button>
      </nav>
    </div>
  );
};