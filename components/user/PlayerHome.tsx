import React, { useEffect, useRef, useState } from 'react';
import { 
  QrCode, MapPin, FileText, Bot, Send, X, ArrowLeft, Terminal, 
  ShieldAlert, Activity, CheckCircle2, HeartPulse, MessageCircleWarning, Timer, Camera, Play, RotateCcw, Volume2, 
  Wrench, ShoppingCart, Scale, HelpCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Language, LocalRulesData, GameContext, ChatMessage, UserProfile } from '../../types';
import { ContextPanel } from './ContextPanel';
import { VoiceButton } from './VoiceButton';
import { SupportWidget } from './SupportWidget';
import { dbData, doc, onSnapshot, updateDoc, setDoc, serverTimestamp } from '../../services/firebase';

const GolfCartIcon = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={className}>
    <path d="M5 5h14" /><path d="M5 5v9" /><path d="M19 5v9" /><path d="M3 14h18" />
    <path d="M3 14v3a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3" />
    <circle cx="7" cy="19" r="2" /><circle cx="17" cy="19" r="2" /><path d="M15 12l2-2" />
  </svg>
);

interface PlayerHomeProps {
  user: UserProfile | null;
  lang: Language;
  localRulesData: LocalRulesData | null;
  messages: ChatMessage[];
  input: string;
  setInput: (val: string) => void;
  isThinking: boolean;
  onSend: (text?: string) => void;
  onStartScanner: () => void;
  onStopRound: () => void;
  onShowLocalRules: () => void;
  onShowCartRules: () => void;
  isTrackingActive: boolean;
  activeFlightId: string | null;
  gameContext: GameContext;
  setGameContext: React.Dispatch<React.SetStateAction<GameContext>>;
  capturedImage: string | null;
  setCapturedImage: (val: string | null) => void;
  onImageClick: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleImageCapture: (e: React.ChangeEvent<HTMLInputElement>) => void;
  chatEndRef: React.RefObject<HTMLDivElement>;
  onBack: () => void;
  syncLog?: string; 
  roundStatus?: 'not_started' | 'started' | 'closing';
  onQuickSearch?: (query: string) => void;
}

export const PlayerHome: React.FC<PlayerHomeProps> = (props) => {
  const {
    user, lang, localRulesData, messages, input, setInput, isThinking, onSend,
    onStartScanner, onStopRound, activeFlightId,
    gameContext, setGameContext, capturedImage, setCapturedImage, onImageClick,
    fileInputRef, handleImageCapture, chatEndRef, onBack, syncLog, roundStatus = 'not_started'
  } = props;

  const [showRescue, setShowRescue] = useState(false);
  const [rescueSubMode, setRescueSubMode] = useState<'main' | 'operative'>('main');
  const [showTimer, setShowTimer] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(180); // 3 minuti (regola ricerca palla)
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  const [showLocalRulesModal, setShowLocalRulesModal] = useState(false);
  const [showCartRulesModal, setShowCartRulesModal] = useState(false);
  const [liveFlightData, setLiveFlightData] = useState<any>(null);
  const [localAccuracy, setLocalAccuracy] = useState<number | null>(null);
  
  const audioAlarm = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<any>(null);

  const clubName = localRulesData?.club || (lang === 'it' ? 'Regole Generali' : 'General Rules');
  const hasLocalRules = !!localRulesData?.local_rules && localRulesData.local_rules.trim().length > 10;
  const hasCartRules = !!localRulesData?.golfCartRules && localRulesData.golfCartRules.trim().length > 10;

  useEffect(() => {
    audioAlarm.current = new Audio('https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3');
  }, []);

  // Monitoraggio locale GPS per UI Reattiva
  useEffect(() => {
    if (roundStatus !== 'started') {
      setLocalAccuracy(null);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLocalAccuracy(pos.coords.accuracy);
      },
      (err) => console.warn("Local GPS UI Watch error:", err),
      { enableHighAccuracy: true, maximumAge: 2000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [roundStatus]);

  useEffect(() => {
    if (!activeFlightId || !dbData) return;
    const unsub = onSnapshot(doc(dbData, "active_flights", activeFlightId), (snap) => {
      if (snap.exists()) setLiveFlightData(snap.data());
    });
    return unsub;
  }, [activeFlightId]);

  // Gestione Timer 3 minuti
  useEffect(() => {
    if (isTimerRunning && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(s => s - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
      audioAlarm.current?.play();
      if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500]);
      clearInterval(timerRef.current);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isTimerRunning, timerSeconds]);

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRescue = async (type: 'OPERATIVE' | 'HEALTH', issueDetail?: string) => {
    if (!activeFlightId || !dbData || !user) return;
    try {
      const flightRef = doc(dbData, "active_flights", activeFlightId);
      const alertId = `${activeFlightId}_${Date.now()}`;
      
      // Fase 1: Arricchimento payload con area geografica e dettaglio
      await setDoc(doc(dbData, 'alerts', alertId), {
        type,
        issueDetail: issueDetail || null,
        userId: user.uid,
        userName: user.displayName,
        clubId: user.homeClubId,
        flightId: activeFlightId,
        areaContext: liveFlightData?.currentArea || 'Unknown Area',
        timestamp: serverTimestamp(),
        status: 'active'
      });

      if (type === 'HEALTH') {
        await updateDoc(flightRef, { emergency: true, lastAlert: serverTimestamp() });
        alert("SOS MEDICO INVIATO! Lo staff è stato allertato con la tua posizione.");
      } else {
        await updateDoc(flightRef, { lastAlert: serverTimestamp() });
        alert("Richiesta di assistenza inviata alla segreteria.");
      }
      setShowRescue(false);
      setRescueSubMode('main');
    } catch (e) {
      alert("Errore nell'invio della segnalazione.");
    }
  };

  const RuleModal = ({ isOpen, onClose, title, content, icon: Icon, color }: any) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
        <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
          <div className="p-6 bg-slate-800 border-b border-white/5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className={`p-2 bg-${color}-500/10 rounded-xl text-${color}-400`}>
                <Icon size={20} />
              </div>
              <h3 className="font-black text-xs uppercase tracking-widest text-white">{title}</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-400">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 scrollbar-hide text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
            {content || "Nessuna regola specifica inserita per questo circolo."}
          </div>
          <div className="p-6 border-t border-white/5">
            <button onClick={onClose} className={`w-full py-4 bg-${color}-500 text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest`}>Chiudi</button>
          </div>
        </div>
      </div>
    );
  };

  // Calcolo Accuratezza Dinamica (Locale > DB)
  const displayAccuracy = localAccuracy !== null ? localAccuracy : liveFlightData?.accuracy;

  return (
    <div className="h-full flex flex-col bg-slate-950 font-sans overflow-hidden">
      <header className="px-4 py-4 bg-slate-900 border-b border-white/5 flex items-center justify-between z-30 shadow-2xl">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-white transition-colors bg-white/5 rounded-xl">
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col">
            <h2 className="font-black text-[10px] uppercase tracking-widest text-emerald-400">Marshall AI</h2>
            <p className="text-[9px] font-bold text-slate-500 uppercase truncate max-w-[80px] leading-tight">{clubName}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* 🟢 Pulsante Cronometro */}
          <button 
            onClick={() => setShowTimer(true)}
            className="p-2.5 rounded-xl bg-white/5 text-amber-400 border border-white/10 hover:bg-white/10 transition-all active:scale-95"
            title="Timer Ricerca Palla"
          >
            <Timer size={18} />
          </button>

          <button 
            onClick={() => setShowLocalRulesModal(true)}
            className={`p-2.5 rounded-xl bg-white/5 transition-all border ${
              hasLocalRules ? 'text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_#10b98133]' : 'text-slate-500 border-white/10'
            }`}
          >
            <FileText size={18} />
          </button>

          <button 
            onClick={() => setShowCartRulesModal(true)}
            className={`p-2.5 rounded-xl bg-white/5 transition-all border ${
              hasCartRules ? 'text-blue-400 border-blue-500/30 shadow-[0_0_10px_#3b82f633]' : 'text-slate-500 border-white/10'
            }`}
          >
            <GolfCartIcon size={18} />
          </button>

          <button 
            onClick={() => roundStatus === 'started' ? onStopRound() : onStartScanner()}
            className={`p-2.5 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 ${
              roundStatus === 'started'
                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}
          >
            {roundStatus === 'started' ? <CheckCircle2 size={18} /> : <QrCode size={18} />}
            <span className="text-[7px] font-black uppercase tracking-tighter leading-none">
              {roundStatus === 'started' ? 'Stop' : 'Start'}
            </span>
          </button>
        </div>
      </header>

      {/* RIGA RESCUE E STATUS CON AGGIUNTA GPS */}
      <div className="px-3 pt-3 pb-2 bg-slate-900 border-white/10 space-y-2 shrink-0">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { setRescueSubMode('main'); setShowRescue(true); }}
            className="p-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white shadow-lg transition-all active:scale-90 flex items-center justify-center border border-red-400 shrink-0"
          >
            <ShieldAlert size={18} />
          </button>
          <div className="flex-1 bg-slate-950 p-2.5 rounded-2xl border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${roundStatus === 'started' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                <Activity size={14} className={roundStatus === 'started' ? 'animate-pulse' : ''} />
              </div>
              <div className="flex flex-col">
                <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest leading-none mb-0.5">Status</p>
                <p className="text-[9px] font-bold text-white uppercase leading-none">
                  {roundStatus === 'started' ? 'In Gioco' : 'In Attesa'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 border-l border-white/10 pl-3">
              {/* GPS BLOCK */}
              <div className="text-right">
                <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest leading-none mb-0.5 flex items-center justify-end gap-1">
                  <Activity size={6} className={`text-blue-400 ${roundStatus === 'started' ? 'animate-pulse' : ''}`} /> GPS
                </p>
                <p className={`text-[9px] font-bold uppercase leading-none transition-colors ${displayAccuracy ? 'text-blue-400' : 'text-slate-600'}`}>
                  {displayAccuracy ? `${Math.round(displayAccuracy)}m` : 'FIX'}
                </p>
              </div>
              {/* AREA BLOCK */}
              <div className="text-right border-l border-white/10 pl-3">
                <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest leading-none mb-0.5 flex items-center justify-end gap-1">
                  <MapPin size={6} className="text-emerald-500" /> Area
                </p>
                <p className="text-[9px] font-bold text-emerald-400 uppercase leading-none truncate max-w-[50px]">
                  {liveFlightData?.currentArea || 'GPS...'}
                </p>
              </div>
              {/* PACE BLOCK */}
              <div className="text-right border-l border-white/10 pl-3">
                <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest leading-none mb-0.5 flex items-center justify-end gap-1">
                  <Timer size={6} className="text-orange-500" /> Pace
                </p>
                <p className={`text-[9px] font-bold uppercase leading-none ${liveFlightData?.delayMinutes > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                  {liveFlightData?.delayMinutes > 0 ? `+${liveFlightData.delayMinutes}m` : 'OK'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🟢 NUOVA RIGA: STATUS REGOLE RAPIDE */}
      <div className="px-3 pb-3 bg-slate-900 border-b border-white/10 flex gap-2 shrink-0">
          <div className="flex-1 bg-slate-950/50 p-2.5 rounded-xl border border-white/5 flex items-center gap-3 shadow-inner">
              <div className={`p-1.5 rounded-lg ${localRulesData?.cartRule90Degree ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500 opacity-40'}`}>
                  <GolfCartIcon size={12} />
              </div>
              <div>
                  <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-0.5 leading-none">Fairway 90°</p>
                  <p className={`text-[9px] font-black uppercase ${localRulesData?.cartRule90Degree ? 'text-white' : 'text-slate-600'}`}>
                    {localRulesData?.cartRule90Degree ? 'Consentito' : 'Vietato'}
                  </p>
              </div>
          </div>
          <div className="flex-1 bg-slate-950/50 p-2.5 rounded-xl border border-white/5 flex items-center gap-3 shadow-inner">
              <div className={`p-1.5 rounded-lg ${localRulesData?.ballPlacement ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500 opacity-40'}`}>
                  <MapPin size={12} />
              </div>
              <div>
                  <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-0.5 leading-none">Palla Piazzata</p>
                  <p className={`text-[9px] font-black uppercase ${localRulesData?.ballPlacement ? 'text-white' : 'text-slate-600'}`}>
                    {localRulesData?.ballPlacement ? 'Sì' : 'No'}
                  </p>
              </div>
          </div>
      </div>

      {/* POPUP CRONOMETRO 3 MINUTI */}
      {showTimer && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in zoom-in-95 duration-300">
           <div className="w-full max-w-xs bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="p-8 text-center space-y-6">
                 <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Ricerca Palla (3 min)</h3>
                    <button onClick={() => setShowTimer(false)} className="text-slate-500 hover:text-white p-1"><X size={20}/></button>
                 </div>
                 <div className={`text-6xl font-black tabular-nums transition-colors duration-500 ${timerSeconds < 30 ? 'text-red-500 animate-pulse' : timerSeconds < 60 ? 'text-amber-500' : 'text-white'}`}>
                    {formatTimer(timerSeconds)}
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => setIsTimerRunning(!isTimerRunning)} className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 ${isTimerRunning ? 'bg-slate-800 text-white' : 'bg-emerald-500 text-slate-950 shadow-xl'}`}>
                       {isTimerRunning ? <RotateCcw size={16}/> : <Play size={16}/>}
                       {isTimerRunning ? 'Pausa' : 'Avvia'}
                    </button>
                    <button onClick={() => { setTimerSeconds(180); setIsTimerRunning(false); }} className="p-4 bg-white/5 text-slate-400 rounded-2xl hover:text-white border border-white/10">
                       <RotateCcw size={20}/>
                    </button>
                 </div>
                 <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3">
                    <Volume2 size={16} className="text-amber-500" />
                    <p className="text-[9px] font-bold text-amber-200/80 uppercase text-left leading-tight">Allarme sonoro e vibrazione al termine dei 3 minuti.</p>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* RESCUE MODAL - FASE 1: MENU ARRICCHITO */}
      {showRescue && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center mx-auto border border-red-500/20">
                <ShieldAlert size={44} className="text-red-500" />
              </div>
              
              {rescueSubMode === 'main' ? (
                <>
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-white">RESCUE SERVICE</h3>
                  <p className="text-xs text-slate-400 font-medium">Segnalazione prioritaria allo staff</p>
                  <div className="space-y-4">
                    <button onClick={() => setRescueSubMode('operative')} className="w-full p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl flex items-center gap-4 transition-all">
                      <MessageCircleWarning size={32} className="text-amber-500" />
                      <div className="text-left">
                        <p className="font-black text-xs uppercase text-white">Segreteria / Marshall</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Assistenza Operativa</p>
                      </div>
                    </button>
                    <button onClick={() => handleRescue('HEALTH')} className="w-full p-6 bg-red-600 hover:bg-red-500 rounded-3xl flex items-center gap-4 transition-all shadow-lg">
                      <HeartPulse size={32} className="text-white" />
                      <div className="text-left">
                        <p className="font-black text-xs uppercase text-white">Emergenza Medica</p>
                        <p className="text-[10px] text-red-100/60 font-bold uppercase">SOS immediato</p>
                      </div>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <button onClick={() => rescueSubMode === 'operative' ? setRescueSubMode('main') : setRescueSubMode('main')} className="p-2 text-slate-500 hover:text-white"><ArrowLeft size={20}/></button>
                    <h3 className="text-sm font-black uppercase text-white">Tipo Assistenza</h3>
                    <div className="w-8"></div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <button onClick={() => handleRescue('OPERATIVE', 'Problemi Golf Cart')} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-all">
                      <ShoppingCart className="text-blue-400" size={20} />
                      <span className="text-[11px] font-black uppercase text-slate-200">Problemi Golf Cart</span>
                    </button>
                    <button onClick={() => handleRescue('OPERATIVE', 'Problemi E-Trolley')} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-all">
                      <Wrench className="text-emerald-400" size={20} />
                      <span className="text-[11px] font-black uppercase text-slate-200">Problemi E-Trolley</span>
                    </button>
                    <button onClick={() => handleRescue('OPERATIVE', 'Richiesta Arbitro')} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-all">
                      <Scale className="text-amber-400" size={20} />
                      <span className="text-[11px] font-black uppercase text-slate-200">Richiesta Arbitro</span>
                    </button>
                    <button onClick={() => handleRescue('OPERATIVE', 'Altro')} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-all">
                      <HelpCircle className="text-purple-400" size={20} />
                      <span className="text-[11px] font-black uppercase text-slate-200">Altro / Informazioni</span>
                    </button>
                  </div>
                </>
              )}
              <button onClick={() => setShowRescue(false)} className="w-full py-4 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors">Annulla</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black min-h-0">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-8">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                <Bot size={40} className="text-emerald-500" />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Chiedi pure, ti ascolto.</p>
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[90%] p-4 rounded-2xl text-sm leading-relaxed shadow-2xl ${
              m.role === 'user' ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-slate-900 text-slate-100 border border-white/5 rounded-tl-none'
            }`}>
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{m.text}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="p-4 bg-slate-900 rounded-2xl w-12 h-10 animate-pulse text-white text-center">...</div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="bg-slate-900 border-t border-white/5 p-4 pb-10 space-y-3 shrink-0 z-20">
        <ContextPanel context={gameContext} setContext={setGameContext} lang={lang} />
        <div className="flex gap-2 items-center w-full overflow-hidden">
          <div className="flex-1 flex gap-1 bg-slate-950 p-1.5 rounded-2xl border border-white/10 items-center min-w-0">
            <button onClick={onImageClick} className="p-2.5 text-slate-400 hover:text-emerald-400 transition-colors shrink-0">
              <Camera size={22} />
            </button>
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onSend()}
              placeholder={lang === 'it' ? "Fai una domanda..." : "Ask a question..."}
              className="flex-1 bg-transparent outline-none text-white text-sm px-2 py-2 min-w-0 font-bold placeholder:text-slate-600 focus:placeholder:text-slate-700"
            />
            <VoiceButton onResult={(text: string) => { setInput(text); onSend(text); }} lang={lang} />
          </div>
          <button 
            onClick={() => onSend()}
            disabled={(!input.trim() && !capturedImage) || isThinking}
            className="bg-emerald-500 p-3.5 rounded-2xl text-slate-950 shadow-lg active:scale-90 shrink-0 disabled:opacity-40"
          >
            <Send size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageCapture} />
      
      <RuleModal isOpen={showLocalRulesModal} onClose={() => setShowLocalRulesModal(false)} title="Regole Locali AI" content={localRulesData?.local_rules} icon={FileText} color="emerald" />
      <RuleModal isOpen={showCartRulesModal} onClose={() => setShowCartRulesModal(false)} title="Regolamento Cart" content={localRulesData?.golfCartRules} icon={GolfCartIcon} color="blue" />

      {/* 🔥 CHAT FLOTTANTE CON LO STAFF */}
      <SupportWidget 
        user={user} 
        flightId={activeFlightId} 
        clubId={user?.homeClubId || 'club_pinetina'} 
      />
    </div>
  );
};