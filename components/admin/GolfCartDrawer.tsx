import React, { useState, useEffect, useRef } from 'react';
import { X, Save, AlertCircle, Globe, MapPin, Camera, Loader2, Upload, Crosshair, Book, ChevronRight, Plus, Calendar } from 'lucide-react';
import { Language, LocalRulesData, IdentifiedCourse } from '../../types';
import { TRANSLATIONS, COUNTRIES, GOLF_COURSES, COMMON_GOLF_CART_RULES } from '../../constants';
import { transcribeLocalRules, identifyCourseByLocation } from '../../services/geminiService';

const GolfCartIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M5 5h14" />
    <path d="M5 5v9" />
    <path d="M19 5v9" />
    <path d="M3 14h18" />
    <path d="M3 14v3a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3" />
    <circle cx="7" cy="19" r="2" />
    <circle cx="17" cy="19" r="2" />
    <path d="M15 12l2-2" />
  </svg>
);

interface GolfCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  data: LocalRulesData;
  onSave: (data: LocalRulesData) => void;
  lang: Language;
}

export const GolfCartDrawer: React.FC<GolfCartDrawerProps> = ({ isOpen, onClose, data, onSave, lang }) => {
  const [formData, setFormData] = useState<LocalRulesData>(data);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [candidateCourses, setCandidateCourses] = useState<IdentifiedCourse[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    setFormData(data);
  }, [data, isOpen]);

  const handleSave = () => {
  const updatedData: LocalRulesData = {
    ...data,          // 🔥 mantiene TUTTI i campi originali (incluso local_rules)
    ...formData,      // 🔥 applica le modifiche fatte nel drawer (golfCartRules, country, club, ecc.)
    golfCartRulesUpdatedAt: new Date().toISOString()
  };
  onSave(updatedData);
  onClose();
};


  const persistChanges = (updatedData: LocalRulesData) => {
    onSave(updatedData);
  };

  const handleGPSLocation = () => {
    if (!navigator.geolocation) {
      alert(t.locationError);
      return;
    }

    setIsLocating(true);
    setCandidateCourses([]);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const results = await identifyCourseByLocation(latitude, longitude);
        
        setIsLocating(false);
        if (results && results.length > 0) {
          setFormData(prev => ({ ...prev, country: results[0].country }));
          setCandidateCourses(results);
        } else {
          alert(t.locationError);
        }
      },
      (error) => {
        console.error(error);
        setIsLocating(false);
        alert(t.locationError);
      }
    );
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsTranscribing(true);
    
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          const transcribedText = await transcribeLocalRules(base64, 'image/jpeg');
          
          if (transcribedText) {
            setFormData(prev => {
              const separator = (prev.golfCartRules || '').trim().length > 0 ? '\n\n' : '';
              return {
                ...prev,
                golfCartRules: (prev.golfCartRules || '') + separator + transcribedText
              };
            });
          }
        } catch (error) {
          alert(t.errorTranscription);
        } finally {
           setIsTranscribing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setIsTranscribing(false);
    }
    
    if (event.target.value) event.target.value = '';
  };

  const addRuleToText = (ruleText: string) => {
    setFormData(prev => {
      const separator = (prev.golfCartRules || '').trim().length > 0 ? '\n\n' : '';
      return {
        ...prev,
        golfCartRules: (prev.golfCartRules || '') + separator + ruleText
      };
    });
    setShowRulesModal(false);
  };
  
  const availableCourses = formData.country && GOLF_COURSES[formData.country] ? GOLF_COURSES[formData.country] : [];

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 transition-all duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={onClose} />
      
      <div className={`relative bg-slate-900 border border-white/10 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-all transform duration-300 ${isOpen ? 'scale-100' : 'scale-95'}`}>
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-blue-900 text-white shrink-0">
          <div className="flex items-center gap-2">
            <GolfCartIcon size={20} className="text-blue-400" />
            <h2 className="font-black text-sm uppercase tracking-widest">{t.golfCart}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide relative bg-slate-900">
          {formData.validityDate && (
             <div className="bg-blue-500/10 px-5 py-2.5 border-b border-white/5 flex items-center justify-center gap-2">
                 <Calendar size={14} className="text-blue-400" />
                 <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                     {t.clubDashboard.validityDate}: {new Date(formData.validityDate).toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US')}
                 </span>
             </div>
          )}

          {showRulesModal && (
            <div className="absolute inset-0 bg-slate-900 z-20 animate-in slide-in-from-bottom-5 duration-200 flex flex-col">
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-slate-950/50">
                 <h3 className="font-black text-xs uppercase tracking-widest text-blue-400 flex items-center gap-2">
                    <Book size={16} /> Regolamenti Comuni
                 </h3>
                 <button onClick={() => setShowRulesModal(false)} className="text-slate-500 hover:text-white p-2"><X size={20} /></button>
              </div>
              <div className="p-4 overflow-y-auto flex-1 space-y-3">
                 {COMMON_GOLF_CART_RULES[lang].map((rule, idx) => (
                    <button key={idx} onClick={() => addRuleToText(`**${rule.title}**: ${rule.text}`)} className="w-full text-left border border-white/10 rounded-2xl p-4 hover:border-blue-500/50 hover:bg-blue-500/10 transition-all group relative bg-white/5 shadow-sm">
                       <div className="font-black text-blue-400 text-[10px] uppercase mb-1">{rule.title}</div>
                       <div className="text-xs text-slate-300 leading-relaxed font-medium">{rule.text}</div>
                       <div className="absolute top-4 right-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"><Plus size={16} /></div>
                    </button>
                 ))}
              </div>
            </div>
          )}

          <div className="p-4 bg-blue-500/10 border-b border-white/5 flex gap-3 text-xs text-blue-200 font-medium">
             <AlertCircle className="shrink-0 text-blue-500" size={16} />
             <p>Configura qui le restrizioni per l'uso dei cart (es: solo sentieri, regola 90°). Se non caricate, l'AI userà le norme standard del circolo.</p>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex justify-center gap-8">
               <button type="button" onClick={() => setShowRulesModal(true)} className="group flex flex-col items-center gap-2 transition-all active:scale-95">
                 <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:border-blue-400 transition-colors shadow-sm">
                   <Book size={24} className="text-blue-400" strokeWidth={1.5} />
                 </div>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Temi</span>
               </button>

               <button type="button" onClick={handleGPSLocation} disabled={isLocating} className="group flex flex-col items-center gap-2 transition-all active:scale-95">
                 <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:border-emerald-400 transition-colors shadow-sm">
                    {isLocating ? <Loader2 size={24} className="text-emerald-400 animate-spin" /> : <Crosshair size={24} className="text-emerald-400" strokeWidth={1.5} />}
                 </div>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{isLocating ? 'GPS...' : 'Club GPS'}</span>
               </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Paese</label>
                <select value={formData.country} onChange={(e) => setFormData({...formData, country: e.target.value, club: ''})} className="w-full p-3.5 bg-slate-950 border border-white/10 rounded-2xl text-xs font-bold text-white focus:ring-4 focus:ring-blue-500/10 outline-none">
                  <option value="" className="bg-slate-900">Nazione</option>
                  {COUNTRIES.map(country => <option key={country} value={country} className="bg-slate-900">{country}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Golf Club</label>
                <input type="text" list="golf-courses-list-cart" value={formData.club} onChange={(e) => setFormData({...formData, club: e.target.value})} className="w-full p-3.5 bg-slate-950 border border-white/10 rounded-2xl text-xs font-bold text-white focus:ring-4 focus:ring-blue-500/10 outline-none placeholder:text-slate-700" />
                <datalist id="golf-courses-list-cart">
                  {availableCourses.map(course => <option key={course} value={course} />)}
                </datalist>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-end px-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Regolamento Cart</label>
                <div className="flex gap-2">
                  <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isTranscribing} className="text-[9px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-xl hover:bg-blue-500/20 transition-colors border border-blue-500/20">
                     {isTranscribing ? 'Analisi...' : 'Trascrivi Foto'}
                  </button>
                </div>
              </div>
              
              <textarea
                value={formData.golfCartRules || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, golfCartRules: e.target.value }))}
                placeholder="es: Cart Paths Only today. Do not drive on greens or tee boxes."
                className="w-full h-48 p-5 bg-slate-950 border border-white/10 rounded-3xl text-sm leading-relaxed text-slate-200 focus:ring-4 focus:ring-blue-500/10 outline-none resize-none font-medium shadow-inner placeholder:text-slate-700"
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/5 bg-slate-950/50 shrink-0">
          <button
            onClick={handleSave}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-slate-950 font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <Save size={18} />
            Salva Regolamento
          </button>
        </div>
      </div>
    </div>
  );
};