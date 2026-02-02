import React from 'react';
import { ShieldCheck, MapPin, Activity, CheckCircle2, ArrowRight, Info } from 'lucide-react';
import { Language } from '../../types';
import { TRANSLATIONS } from '../../constants';

interface PrivacyConsentProps {
  lang: Language;
  onAccept: () => void;
  onDeny: () => void;
  clubName: string;
}

export const PrivacyConsent: React.FC<PrivacyConsentProps> = ({ lang, onAccept, onDeny, clubName }) => {
  const t = TRANSLATIONS[lang].playTrack;

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col p-6 font-sans overflow-hidden">
      <header className="flex flex-col items-center text-center space-y-4 mb-8 pt-8">
         <div className="w-16 h-16 bg-emerald-500/10 rounded-[1.5rem] flex items-center justify-center border border-emerald-500/20">
            <ShieldCheck size={32} className="text-emerald-400" />
         </div>
         <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight uppercase">Privacy & Tracking</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                <MapPin size={12} className="text-emerald-500" /> {clubName}
            </p>
         </div>
      </header>

      <div className="flex-1 bg-slate-900/50 border border-white/5 rounded-[2rem] p-6 overflow-y-auto scrollbar-hide mb-8">
         <div className="prose prose-invert prose-sm">
            <div className="flex items-start gap-3 mb-6 p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                <Info size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed text-emerald-100/80 m-0">
                    Per permettere al Club di monitorare il ritmo di gioco e garantirti sicurezza, l'app richiede l'accesso alla tua posizione GPS.
                </p>
            </div>
            
            <div className="space-y-6 text-slate-300 text-xs leading-relaxed">
                <section>
                    <h4 className="text-white font-black uppercase tracking-widest text-[10px] mb-2">1. Localizzazione</h4>
                    <p>La tua posizione verrà registrata solo durante la permanenza sul campo e per finalità esclusivamente operative (slow play, emergenze).</p>
                </section>
                <section>
                    <h4 className="text-white font-black uppercase tracking-widest text-[10px] mb-2">2. Durata</h4>
                    <p>Il tracciamento si interromperà automaticamente al termine del giro o dopo 5 ore dall'attivazione.</p>
                </section>
                <section>
                    <h4 className="text-white font-black uppercase tracking-widest text-[10px] mb-2">3. Sicurezza</h4>
                    <p>I dati sono criptati e non vengono condivisi con terze parti per scopi commerciali.</p>
                </section>
            </div>
         </div>
      </div>

      <div className="space-y-3 pb-8">
         <button 
            onClick={onAccept}
            className="w-full h-16 bg-emerald-500 text-slate-950 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all"
         >
            <CheckCircle2 size={20} />
            Accetta e Inizia
         </button>
         
         <button 
            onClick={onDeny}
            className="w-full py-4 text-slate-500 font-bold text-[10px] uppercase tracking-widest hover:text-white transition-colors"
         >
            Nega e Torna alla Home
         </button>
      </div>
    </div>
  );
};