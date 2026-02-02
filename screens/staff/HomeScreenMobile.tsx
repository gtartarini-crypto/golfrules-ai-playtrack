import React, { useState, useEffect } from 'react';
import { LogOut, QrCode, MapPin, History, User, Timer, AlertCircle, Check, X } from 'lucide-react';
import { doc, onSnapshot } from "firebase/firestore";
import { dbData, auth } from "../../services/firebase";
import { StaffQRScanner } from "../../components/user/StaffQRScanner";

export const HomeScreenMobile = ({ user, staffData, onOpenHistory, onOpenProfile }: any) => {
  const [worker, setWorker] = useState<any>(staffData);
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gps, setGps] = useState<{lat: number, lng: number} | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(dbData!, 'staff', user.uid), (snap) => {
      if (snap.exists()) setWorker({ uid: snap.id, ...snap.data() });
    });

    const watchId = navigator.geolocation.watchPosition(
      (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      null, { enableHighAccuracy: true }
    );

    return () => {
      unsub();
      navigator.geolocation.clearWatch(watchId);
    };
  }, [user]);

  const handleLogout = () => auth.signOut();

  const status = worker?.shiftStatus || 'clocked_out';
  const isClockedIn = status === 'clocked_in';
  
  const statusColors: any = {
    clocked_in: 'bg-emerald-500',
    on_break: 'bg-amber-500',
    clocked_out: 'bg-slate-400'
  };

  const getElapsedTimeString = () => {
    if (status !== 'clocked_in' || !worker?.lastClockIn) return null;
    
    let startMillis = 0;
    if (worker.lastClockIn.toMillis) {
      startMillis = worker.lastClockIn.toMillis();
    } else if (worker.lastClockIn instanceof Date) {
      startMillis = worker.lastClockIn.getTime();
    } else if (typeof worker.lastClockIn === 'number') {
      startMillis = worker.lastClockIn;
    } else if (worker.lastClockIn.seconds) {
      startMillis = worker.lastClockIn.seconds * 1000;
    }

    if (!startMillis) return null;

    const diff = currentTime.getTime() - startMillis;
    if (diff < 0) return "00:00:00";

    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const elapsedTime = getElapsedTimeString();

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans overflow-hidden">
      {/* HEADER COMPATTO */}
      <header className="bg-white px-5 py-4 flex items-center justify-between border-b border-slate-100 shrink-0">
        <div>
          <h1 className="text-lg font-black text-slate-900 leading-tight">Ciao, {worker?.firstName}</h1>
          <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">
            {worker?.role?.replace('_', ' ') || 'Staff'}
          </p>
        </div>
        <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
          <LogOut size={20} />
        </button>
      </header>

      {/* CONTENUTO PRINCIPALE */}
      <main className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
        
        {/* STATUS CARD */}
        <div className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-slate-100 flex flex-col items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${statusColors[status]}`} />
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{status.replace('_', ' ')}</span>
          </div>
          
          <div className="text-3xl font-black text-slate-900 tabular-nums leading-none">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>

          {elapsedTime && (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-xl">
              <Timer size={10} className="text-emerald-600" />
              <div className="flex flex-col items-start">
                <span className="text-[6px] font-black uppercase text-emerald-600/60 leading-none">Tempo Servizio</span>
                <span className="text-[10px] font-black text-emerald-700 tabular-nums leading-tight">{elapsedTime}</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1 text-slate-400">
            <MapPin size={10} className={gps ? "text-emerald-500" : "animate-pulse"} />
            <span className="text-[8px] font-bold uppercase tracking-tight">
              {gps ? "GPS Attivo" : "Ricerca segnale..."}
            </span>
          </div>
        </div>

        {/* PULSANTE AZIONE DINAMICO */}
        <div className="flex-1 flex flex-col min-h-0">
          <button 
            onClick={() => setShowConfirm(true)}
            disabled={loading}
            className={`flex-1 rounded-[2rem] shadow-xl flex flex-col items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 group px-6 ${
              isClockedIn ? 'bg-rose-500 shadow-rose-500/20' : 'bg-emerald-500 shadow-emerald-500/20'
            }`}
          >
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <QrCode size={28} strokeWidth={2.5} className="text-white" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-white">
              {isClockedIn ? 'Finisci Turno' : 'Inizia Turno'}
            </span>
          </button>
        </div>

        {/* BOTTONI SECONDARI */}
        <div className="grid grid-cols-2 gap-3 shrink-0">
          <button 
            onClick={() => onOpenHistory()}
            className="bg-white p-3 rounded-[1.25rem] border border-slate-100 flex flex-col items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
              <History size={18} />
            </div>
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Storico</span>
          </button>

          <button 
            onClick={() => onOpenProfile()}
            className="bg-white p-3 rounded-[1.25rem] border border-slate-100 flex flex-col items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
              <User size={18} />
            </div>
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Profilo</span>
          </button>
        </div>
        
        <p className="text-center text-[8px] font-bold text-slate-400 uppercase tracking-widest px-4 pb-2 shrink-0">
          Timbratura Digital Cartellino
        </p>
      </main>

      {/* MODALE CONFERMA CUSTOM (Sostituisce window.confirm) */}
      {showConfirm && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xs rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center space-y-6">
            <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center ${isClockedIn ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
              <AlertCircle size={32} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Conferma Azione</h3>
              <p className="text-sm text-slate-500 font-medium mt-2">
                Confermi il timbro di <strong>{isClockedIn ? 'fine' : 'inizio'}</strong> turno?
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => { setShowConfirm(false); setShowScanner(true); }}
                className={`w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 text-white shadow-lg ${isClockedIn ? 'bg-rose-500 shadow-rose-500/20' : 'bg-emerald-500 shadow-emerald-500/20'}`}
              >
                <Check size={16} /> Procedi
              </button>
              <button 
                onClick={() => setShowConfirm(false)}
                className="w-full py-4 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <X size={16} /> Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {showScanner && (
        <StaffQRScanner onClose={() => setShowScanner(false)} staff={worker} />
      )}
    </div>
  );
};