import React, { useState, useEffect } from 'react';
import { 
  Save, FileText, Camera, Loader2, QrCode as QrIcon, 
  Download, ExternalLink, Printer, Building2, Globe, ShieldCheck, Clock, Terminal, MapPin, CheckCircle2, AlertCircle
} from 'lucide-react';
import { LocalRulesData, UserProfile, Language, AppView } from '../../types';
import { transcribeLocalRules } from '../../services/geminiService';

interface ClubDashboardProps {
    user: UserProfile | null;
    localRulesData: LocalRulesData;
    onSave: (data: LocalRulesData) => void;
    onLogout: () => void | Promise<void>;
    onNavigate: (view: AppView) => void;
    lang: Language;
    view?: AppView;
}

const GolfCartIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 5h14" /><path d="M5 5v9" /><path d="M19 5v9" /><path d="M3 14h18" /><path d="M3 14v3a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3" />
    <circle cx="7" cy="19" r="2" /><circle cx="17" cy="19" r="2" /><path d="M15 12l2-2" />
  </svg>
);

const QRCard = ({ title, desc, value, color, isRegistered, onRegister }: any) => {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(value)}`;
  
  return (
    <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl flex flex-col items-center text-center gap-6 group hover:shadow-2xl transition-all relative overflow-hidden">
      {isRegistered && (
        <div className="absolute top-6 right-6 flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100 animate-in fade-in zoom-in">
          <CheckCircle2 size={12} />
          <span className="text-[9px] font-black uppercase tracking-widest">Attivo nel DB</span>
        </div>
      )}

      <div className={`w-16 h-16 bg-${color}-500/10 rounded-2xl flex items-center justify-center text-${color}-600`}><QrIcon size={32} /></div>
      
      <div>
        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{title}</h3>
        <p className="text-sm text-slate-500 font-medium mt-2 max-w-[280px]">{desc}</p>
      </div>

      <div className="w-64 h-64 bg-white border-4 border-slate-100 rounded-[2.5rem] flex items-center justify-center relative overflow-hidden shadow-inner p-6">
          <img src={qrUrl} alt="QR Code" className="w-full h-full object-contain" />
          <div className="absolute inset-0 bg-slate-900/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <div className="bg-white/80 backdrop-blur-md p-4 rounded-full shadow-2xl scale-0 group-hover:scale-100 transition-transform"><Printer size={24} className="text-slate-900" /></div>
          </div>
      </div>

      <div className="text-[10px] font-mono text-slate-400 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 w-full truncate">{value}</div>
      
      <div className="flex flex-col gap-3 w-full">
          {!isRegistered && (
            <button 
              onClick={onRegister}
              className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg"
            >
              <Save size={14} /> Registra nel Database
            </button>
          )}
          <div className="flex gap-3">
              <button onClick={() => window.open(qrUrl, '_blank')} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all"><Download size={14} /> Scarica</button>
              <button onClick={() => { navigator.clipboard.writeText(value); alert("Link copiato!"); }} className="flex-1 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"><ExternalLink size={14} /> Link</button>
          </div>
      </div>
    </div>
  );
};

export const ClubDashboard: React.FC<ClubDashboardProps> = ({ 
    user, localRulesData, onSave, onLogout, onNavigate, lang, view = 'club_dashboard'
}) => {
  const [data, setData] = useState(localRulesData);
  const [isTranscribingLocal, setIsTranscribingLocal] = useState(false);
  const [isTranscribingCart, setIsTranscribingCart] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => { setData(localRulesData); }, [localRulesData]);

  const handleTranscribe = async (e: React.ChangeEvent<HTMLInputElement>, field: 'local_rules' | 'golfCartRules') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (field === 'local_rules') setIsTranscribingLocal(true);
    else setIsTranscribingCart(true);
    const reader = new FileReader();
    reader.onload = async () => {
        try {
            const resultText = await transcribeLocalRules(reader.result as string, file.type);
            setData(prev => ({ ...prev, [field]: (prev[field] || '') + '\n' + resultText }));
        } catch (err) {
            alert(lang === 'it' ? "Errore durante la trascrizione." : "Transcription error.");
        } finally {
            setIsTranscribingLocal(false);
            setIsTranscribingCart(false);
        }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = () => { onSave(data); setShowSuccess(true); setTimeout(() => setShowSuccess(false), 3000); };

  const handleRegisterQR = (type: string, value: string) => {
    const updatedData = {
      ...data,
      qrCodes: {
        ...(data as any).qrCodes,
        [type]: value
      }
    };
    setData(updatedData);
    onSave(updatedData);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const isPremium = localRulesData?.subscription?.tier === 'premium';
  const clubId = user?.homeClubId || 'club_pinetina';

  const renderQRManagement = () => {
    const qrStates = (data as any).qrCodes || {};

    const startVal = `https://playtrack.clublink.golf/start?clubId=${clubId}`;
    const endVal = `https://playtrack.clublink.golf/end?clubId=${clubId}`;
    const staffVal = `STAFF_CLOCK:${clubId}`;

    return (
      <div className="space-y-10 animate-in fade-in duration-500">
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-[2rem] flex items-start gap-4 mb-8">
          <AlertCircle className="text-amber-600 shrink-0 mt-1" />
          <div className="space-y-1">
            <h4 className="text-sm font-black uppercase text-amber-900">Configurazione Accessi</h4>
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              In questa sezione puoi generare e registrare i codici QR ufficiali per il tuo Club. 
              Una volta cliccato su <strong>Registra nel Database</strong>, l'app mobile riconoscerà automaticamente questi codici per avviare tracciamenti o timbrature.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <QRCard 
            title="Inizio Giro (Tee 1)" 
            desc="Posiziona al Tee 1 per attivare il tracciamento GPS dei giocatori." 
            value={startVal} 
            color="emerald" 
            isRegistered={qrStates['start_round'] === startVal}
            onRegister={() => handleRegisterQR('start_round', startVal)}
          />
          <QRCard 
            title="Fine Giro (Hole 18)" 
            desc="Posiziona all'uscita della 18 per terminare la sessione di gioco." 
            value={endVal} 
            color="blue" 
            isRegistered={qrStates['end_round'] === endVal}
            onRegister={() => handleRegisterQR('end_round', endVal)}
          />
          <QRCard 
            title="Timbro Staff" 
            desc="Codice riservato agli operai per la timbratura del cartellino digitale." 
            value={staffVal} 
            color="purple" 
            isRegistered={qrStates['staff_clock'] === staffVal}
            onRegister={() => handleRegisterQR('staff_clock', staffVal)}
          />
        </div>
      </div>
    );
  };

  const renderRulesManagement = () => (
    <div className="space-y-10">
      {/* 🚀 IMPOSTAZIONI RAPIDE CAMPO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-500">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-500/50 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <GolfCartIcon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Golf Cart in Fairway 90°</p>
              <h4 className="text-sm font-black text-slate-900 uppercase">Consenti Accesso</h4>
            </div>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setData({...data, cartRule90Degree: true})}
              className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${data.cartRule90Degree ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400'}`}
            >SI</button>
            <button 
              onClick={() => setData({...data, cartRule90Degree: false})}
              className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${!data.cartRule90Degree ? 'bg-red-500 text-white shadow-lg' : 'text-slate-400'}`}
            >NO</button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <MapPin size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Regola Locale Temporanea</p>
              <h4 className="text-sm font-black text-slate-900 uppercase">La palla si piazza</h4>
            </div>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setData({...data, ballPlacement: true})}
              className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${data.ballPlacement ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400'}`}
            >SI</button>
            <button 
              onClick={() => setData({...data, ballPlacement: false})}
              className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${!data.ballPlacement ? 'bg-red-500 text-white shadow-lg' : 'text-slate-400'}`}
            >NO</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-10 animate-in fade-in duration-500">
        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col min-h-[650px] transition-all hover:shadow-2xl">
          <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600"><FileText size={32} /></div>
              <div><h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Regole Locali AI</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configurazione Testi Regolamento</p></div>
            </div>
            <label className="group bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 cursor-pointer transition-all shadow-xl active:scale-95">
              {isTranscribingLocal ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
              <span>Trascrivi con AI</span>
              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleTranscribe(e, 'local_rules')} />
            </label>
          </div>
          <div className="flex-1 p-8">
            <textarea value={data.local_rules} onChange={(e) => setData({...data, local_rules: e.target.value})} className="w-full h-full p-8 bg-slate-50/50 border border-slate-200 rounded-[2rem] text-sm leading-relaxed text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/50 transition-all resize-none font-medium" placeholder="Incolla qui il testo completo delle regole locali del circolo..." />
          </div>
        </div>
        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col min-h-[650px] transition-all hover:shadow-2xl">
          <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600"><GolfCartIcon size={32} /></div>
              <div><h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Regolamento Golf Cart</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Restrizioni e Comportamento</p></div>
            </div>
            <label className="group bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 cursor-pointer transition-all shadow-xl active:scale-95">
              {isTranscribingCart ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
              <span>Trascrivi con AI</span>
              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleTranscribe(e, 'golfCartRules')} />
            </label>
          </div>
          <div className="flex-1 p-8">
            <textarea value={data.golfCartRules} onChange={(e) => setData({...data, golfCartRules: e.target.value})} className="w-full h-full p-8 bg-slate-50/50 border border-slate-200 rounded-[2rem] text-sm leading-relaxed text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 transition-all resize-none font-medium" placeholder="Inserisci le regole per l'uso dei cart..." />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50">
        {/* Toolbar Contestuale */}
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-10 py-4 flex items-center justify-between shrink-0 z-20">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    {view === 'qr_management' ? <QrIcon size={20} /> : <FileText size={20} />}
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">
                    {view === 'qr_management' ? 'Gestione QrCode Accessi' : 'Regolamenti del Circolo'}
                </h3>
            </div>
            <div className="flex items-center gap-4">
                {showSuccess && <div className="bg-emerald-50 text-emerald-600 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest animate-in slide-in-from-right border border-emerald-100 shadow-sm">Modifiche Salvate!</div>}
                <button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-emerald-500/30 transition-all active:scale-95 flex items-center gap-3"><Save size={20} /> Salva Tutto</button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
          <div className="w-full mx-auto max-w-none">
            {view === 'qr_management' ? renderQRManagement() : renderRulesManagement()}
          </div>
        </div>

        <footer className="bg-white border-t border-slate-200 px-10 py-5 flex justify-between items-center shrink-0 z-30 shadow-[0_-1px_10px_rgba(0,0,0,0.02)]">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">© {new Date().getFullYear()} ClubLink Admin Portal</span>
          <div className="flex items-center gap-6">
            <button onClick={() => onNavigate('debug_dashboard')} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><Terminal size={18} /></button>
          </div>
        </footer>
    </div>
  );
};