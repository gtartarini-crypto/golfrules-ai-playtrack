import React, { useState, useEffect } from 'react';
import { Bot, MapPin, Mail, Lock, LogIn, Loader2, Sparkles } from 'lucide-react';
import { Language, UserProfile } from '../../types';
import { APP_NAME } from '../../constants';
import { loginWithEmail } from '../../services/firebase';
import { Preferences } from '@capacitor/preferences';

interface LandingPageProps {
  onStartScanner: () => void;
  onLogin: () => void;
  lang: Language;
  onToggleLang: (lang: Language) => void;
  user: UserProfile | null;
  onLogout: () => void;
  clubName?: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onLogin,
  lang, 
  onToggleLang, 
  user,
  onLogout,
  clubName
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // 🔄 Carica password salvata
  useEffect(() => {
    (async () => {
      const saved = await Preferences.get({ key: 'savedPassword' });
      if (saved.value) setPassword(saved.value);
    })();
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      await loginWithEmail(email, password);

      // 💾 Salva password dopo login riuscito
      await Preferences.set({
        key: 'savedPassword',
        value: password
      });

    } catch (err: any) {
      setLoginError(lang === 'it' ? 'Credenziali non valide' : 'Invalid credentials');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="px-6 py-4 flex justify-between items-center z-20 shrink-0">
         <div className="flex items-center gap-2">
            <Bot size={18} className="text-emerald-400" />
            <div className="flex flex-col">
                <span className="font-black text-[10px] uppercase tracking-widest">{APP_NAME}</span>
                {clubName && (
                    <span className="text-[8px] font-bold text-emerald-500 uppercase flex items-center gap-1">
                        <MapPin size={8} /> {clubName}
                    </span>
                )}
            </div>
         </div>
         <select value={lang} onChange={(e) => onToggleLang(e.target.value as any)} className="bg-slate-900 border border-white/10 rounded-full px-3 py-1 text-[10px] font-black uppercase outline-none cursor-pointer">
            <option value="it">IT</option><option value="en">EN</option>
         </select>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start p-8 text-center z-10 space-y-8 overflow-y-auto scrollbar-hide pt-12">
         <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-none">GOLFRULES &<br/><span className="text-emerald-400 italic underline underline-offset-8 decoration-emerald-500/30">PLAYTRACK</span></h1>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-4">Professional Marshall Assistant</p>
         </div>

         {!user ? (
            <div className="w-full max-w-sm bg-slate-900/40 border border-white/5 p-6 rounded-[2.5rem] backdrop-blur-md space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
                <div className="flex items-center justify-center gap-2">
                   <div className="h-px w-8 bg-white/10"></div>
                   <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Accesso Portale</h3>
                   <div className="h-px w-8 bg-white/10"></div>
                </div>
                <form onSubmit={handleEmailLogin} className="space-y-3">
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={14} />
                        <input 
                            type="email" 
                            required 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-950 border border-white/5 focus:border-emerald-500/50 outline-none text-white text-xs font-bold" 
                            placeholder="Email" 
                        />
                    </div>

                    {/* 🔐 PASSWORD CON OCCHIO */}
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={14} />

                        <input 
                            type={showPassword ? "text" : "password"}
                            required 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            className="w-full h-12 pl-11 pr-10 rounded-xl bg-slate-950 border border-white/5 focus:border-emerald-500/50 outline-none text-white text-xs font-bold" 
                            placeholder="Password" 
                        />

                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-400 transition-colors text-xs"
                        >
                            {showPassword ? "🙈" : "👁️"}
                        </button>
                    </div>

                    {loginError && <p className="text-[9px] text-red-500 font-black uppercase bg-red-500/5 py-2 rounded-lg">{loginError}</p>}

                    <button 
                        type="submit" 
                        disabled={isLoggingIn} 
                        className="w-full h-12 bg-white/10 hover:bg-white/15 disabled:bg-slate-800 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] border border-white/10"
                    >
                        {isLoggingIn ? <Loader2 size={16} className="animate-spin" /> : <><LogIn size={16} className="text-emerald-400" />Entra</>}
                    </button>
                </form>

                <button onClick={onLogin} className="w-full py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-emerald-400 transition-colors">
                    Crea un nuovo account
                </button>
            </div>
         ) : (
            <div className="w-full max-w-sm bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-md flex flex-col items-center gap-6 animate-in zoom-in-95 duration-500">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20">
                      <Sparkles size={14} className="text-emerald-400" />
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bentornato, <span className="text-white">{user.displayName || user.email}</span></p>
                </div>
                <div className="flex flex-col w-full gap-3">
                    <button 
                        onClick={() => onLogin()} 
                        className="w-full h-16 bg-emerald-500 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                        Vai alla Dashboard
                    </button>
                    <button 
                        onClick={onLogout} 
                        className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                    >
                        Esci Account
                    </button>
                </div>
            </div>
         )}
      </div>

      <div className="p-8 z-10 shrink-0">
         <p className="text-[8px] text-slate-600 font-bold uppercase tracking-[0.4em] text-center mb-4">© {new Date().getFullYear()} {APP_NAME} - Advanced AI Systems</p>
      </div>
    </div>
  );
};
