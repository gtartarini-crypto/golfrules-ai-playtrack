
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Bot, LogIn, Mail, Lock, User, ShieldCheck, 
  Loader2, Building2, ArrowLeft, Phone, UserCircle, 
  CreditCard, ChevronRight, Globe, Search, Check, Sparkles, ShoppingBag,
  CheckCircle2, HardHat
} from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS, CONTINENTS, COUNTRIES_BY_CONTINENT } from '../constants';
import { loginWithEmail, registerPlayer, saveClubData, dbData } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface AuthScreenProps {
  onLoginGoogle: () => void;
  onContinueGuest: () => void;
  lang: Language;
  onToggleLang: (lang: Language) => void;
  onBack?: () => void;
  isMobile?: boolean;
}

type AuthMode = 'login' | 'register_player' | 'register_club' | 'purchase_package';

export const AuthScreen: React.FC<AuthScreenProps> = ({ 
  lang, 
  onBack,
  isMobile = false
}) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [federalId, setFederalId] = useState('');
  
  // Stati Club Registration
  const [selectedContinent, setSelectedContinent] = useState('Europa');
  const [selectedCountry, setSelectedCountry] = useState('Italia');
  const [clubSearch, setClubSearch] = useState('');
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [firestoreClubs, setFirestoreClubs] = useState<any[]>([]);
  
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchClubs = async () => {
      if (!dbData) return;
      try {
        const snap = await getDocs(collection(dbData, 'clubs'));
        setFirestoreClubs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Error fetching clubs:", e);
      }
    };
    fetchClubs();
  }, []);

  const filteredClubs = useMemo(() => {
    return firestoreClubs.filter(club => {
      const matchLoc = (club.continent || 'Europa') === selectedContinent && (club.country || 'Italia') === selectedCountry;
      const clubName = (club.club || club.name || '').toLowerCase();
      return matchLoc && clubName.includes(clubSearch.toLowerCase());
    });
  }, [selectedContinent, selectedCountry, clubSearch, firestoreClubs]);

  const handleQuickStaffLogin = () => {
    setEmail('greenkeeper.demo@golfpinetina.it');
    setPassword('staff1234');
    // Il login verrà effettuato dall'utente cliccando su Accedi dopo il riempimento
  };

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else if (mode === 'register_player') {
        await registerPlayer({ email, pass: password, name, phone, gender: 'M', federalId, homeClubId: 'other' });
        alert(lang === 'it' ? "Registrazione completata!" : "Registration complete!");
        setMode('login');
      } else if (mode === 'register_club') {
        if (!selectedClub && !clubSearch) throw new Error("Inserisci il nome del circolo");
        const clubName = selectedClub ? (selectedClub.club || selectedClub.name) : clubSearch;
        const clubId = selectedClub ? selectedClub.id : `club_new_${Date.now()}`;
        
        await saveClubData(clubId, {
            club: clubName,
            country: selectedCountry,
            adminEmail: email,
            status: 'pending_payment'
        });
        
        setMode('purchase_package');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Errore durante l\'operazione.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderLoginForm = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <form onSubmit={handleAuthAction} className="space-y-3">
            <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={16} />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-12 pl-12 pr-4 rounded-xl bg-slate-900 border border-white/5 focus:border-emerald-500/50 outline-none text-white text-sm" placeholder="Email" />
            </div>
            <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={16} />
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-12 pl-12 pr-4 rounded-xl bg-slate-900 border border-white/5 focus:border-emerald-500/50 outline-none text-white text-sm" placeholder="Password" />
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full h-12 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98]">
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><LogIn size={18} />Accedi</>}
            </button>
        </form>

        <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setMode('register_player')} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center gap-2 hover:bg-emerald-500/10 transition-colors group">
                <User size={24} className="text-slate-400 group-hover:text-emerald-400" />
                <span className="text-[10px] font-black uppercase text-white">Nuovo Player</span>
            </button>
            <button onClick={() => setMode('register_club')} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center gap-2 hover:bg-purple-500/10 transition-colors group">
                <Building2 size={24} className="text-slate-400 group-hover:text-purple-400" />
                <span className="text-[10px] font-black uppercase text-white">Nuovo Club</span>
            </button>
        </div>

        <div className="pt-4 border-t border-white/5">
            <button 
                onClick={handleQuickStaffLogin}
                className="w-full py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center gap-2 text-amber-500 font-black text-[9px] uppercase tracking-widest hover:bg-amber-500/20 transition-all"
            >
                <HardHat size={14} /> Accesso Rapido Staff (Demo)
            </button>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden items-center justify-center p-6 font-sans">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-sm z-10 space-y-8">
        <div className="text-center space-y-3">
            <div className="mx-auto w-20 h-20 bg-slate-900 rounded-[2.5rem] flex items-center justify-center border border-white/10 shadow-2xl">
                <Bot size={44} className="text-emerald-400" />
            </div>
            <div className="space-y-1">
                <h1 className="text-3xl font-black tracking-tighter uppercase">ClubLink <span className="text-emerald-400 italic">Gate</span></h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">AI Rules & Tracking</p>
            </div>
        </div>

        {authError && (
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl text-center">
                <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">{authError}</p>
            </div>
        )}

        {mode === 'login' && renderLoginForm()}
      </div>
    </div>
  );
};
