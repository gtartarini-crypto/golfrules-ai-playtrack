import React, { useState, useEffect, useRef } from 'react';
import { X, FileText, Save, AlertCircle, Globe, MapPin, Camera, Loader2, Upload, Crosshair, Calendar } from 'lucide-react';
import { Language, LocalRulesData, IdentifiedCourse } from '../../types';
import { TRANSLATIONS, COUNTRIES, GOLF_COURSES } from '../../constants';
import { transcribeLocalRules, identifyCourseByLocation } from '../../services/geminiService';

interface LocalRulesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  data: LocalRulesData;
  onSave: (data: LocalRulesData) => void;
  lang: Language;
}

export const LocalRulesDrawer: React.FC<LocalRulesDrawerProps> = ({ isOpen, onClose, data, onSave, lang }) => {
  const [formData, setFormData] = useState<LocalRulesData>(data);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [candidateCourses, setCandidateCourses] = useState<IdentifiedCourse[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    setFormData(data);
  }, [data, isOpen]);

  const handleSave = () => {
  const updatedData = {
    ...data,            // 🔥 mantiene TUTTI i campi originali
    ...formData,        // 🔥 aggiorna solo quelli modificati
    localRulesUpdatedAt: new Date().toISOString()
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
              const separator = prev.local_rules.trim().length > 0 ? '\n\n' : '';
              return {
                ...prev,
                local_rules: prev.local_rules + separator + transcribedText
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
  
  const availableCourses = formData.country && GOLF_COURSES[formData.country] ? GOLF_COURSES[formData.country] : [];

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 transition-all duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={onClose} />
      
      <div className={`relative bg-slate-900 border border-white/10 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-all transform duration-300 ${isOpen ? 'scale-100' : 'scale-95'}`}>
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-emerald-900 text-white shrink-0">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-emerald-400" />
            <h2 className="font-black text-sm uppercase tracking-widest">{t.localRules}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide bg-slate-900">
          {formData.validityDate && (
             <div className="bg-emerald-500/10 px-5 py-2.5 border-b border-white/5 flex items-center justify-center gap-2">
                 <Calendar size={14} className="text-emerald-400" />
                 <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                     {t.clubDashboard.validityDate}: {new Date(formData.validityDate).toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US')}
                 </span>
             </div>
          )}

          <div className="p-4 bg-amber-500/10 border-b border-white/5 flex gap-3 text-xs text-amber-200 font-medium">
             <AlertCircle className="shrink-0 text-amber-500" size={16} />
             <p>Le regole locali hanno la precedenza su quelle standard. In assenza di regole caricate, verranno applicate le Regole del Golf USGA/R&A.</p>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex justify-center">
               <button
                 type="button"
                 onClick={handleGPSLocation}
                 disabled={isLocating}
                 className="group flex flex-col items-center gap-2 transition-all duration-300 active:scale-95 disabled:opacity-50"
               >
                 <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:border-emerald-400 transition-colors shadow-sm">
                    {isLocating ? <Loader2 size={24} className="text-emerald-400 animate-spin" /> : <Crosshair size={24} className="text-emerald-400 group-hover:text-emerald-300 transition-colors" strokeWidth={1.5} />}
                 </div>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{isLocating ? t.locating : t.useGPS}</span>
               </button>
            </div>

            {candidateCourses.length > 0 && (
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-[10px] font-black text-emerald-400 mb-3 uppercase tracking-widest">{t.multipleCoursesFound}</p>
                <ul className="space-y-2">
                  {candidateCourses.map((course, idx) => (
                    <li key={idx}>
                      <button 
                        onClick={() => {
                          const newData = { ...formData, club: course.club, country: course.country };
                          setFormData(newData);
                          setCandidateCourses([]); 
                          persistChanges(newData);
                        }}
                        className="w-full text-left text-xs px-4 py-3 bg-white/5 hover:bg-emerald-500/20 rounded-2xl border border-white/10 text-white flex items-center justify-between transition-colors shadow-sm"
                      >
                        <span className="font-bold">{course.club}</span>
                        <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase">{course.country}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{t.country}</label>
                <select
                  value={formData.country}
                  onChange={(e) => {
                    const newData = { ...formData, country: e.target.value, club: '' };
                    setFormData(newData);
                    persistChanges(newData);
                  }}
                  className="w-full p-3.5 bg-slate-950 border border-white/10 rounded-2xl text-xs font-bold text-white focus:ring-4 focus:ring-emerald-500/10 outline-none"
                >
                  <option value="" className="bg-slate-900">{t.selectCountry}</option>
                  {COUNTRIES.map(country => (
                    <option key={country} value={country} className="bg-slate-900">{country}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{t.club}</label>
                <input
                  type="text"
                  list="golf-courses-list"
                  value={formData.club}
                  onChange={(e) => setFormData(prev => ({ ...prev, club: e.target.value }))}
                  onBlur={() => persistChanges(formData)}
                  placeholder={t.clubPlaceholder}
                  className="w-full p-3.5 bg-slate-950 border border-white/10 rounded-2xl text-xs font-bold text-white focus:ring-4 focus:ring-emerald-500/10 outline-none placeholder:text-slate-600"
                />
                <datalist id="golf-courses-list">
                  {availableCourses.map(course => (
                    <option key={course} value={course} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-end px-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.localRules}</label>
                <div className="flex gap-2">
                  <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
                  <input type="file" accept="image/*" ref={uploadInputRef} className="hidden" onChange={handleImageUpload} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isTranscribing} className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-xl hover:bg-emerald-500/20 transition-colors disabled:opacity-50 border border-emerald-500/20">
                     {isTranscribing ? t.transcribing : t.scanRules}
                  </button>
                </div>
              </div>
              
              <textarea
                value={formData.local_rules}
                onChange={(e) => setFormData(prev => ({ ...prev, local_rules: e.target.value }))}
                placeholder={t.localRulesPlaceholder}
                className="w-full h-48 p-5 bg-slate-950 border border-white/10 rounded-3xl text-sm leading-relaxed text-slate-200 focus:ring-4 focus:ring-emerald-500/10 outline-none resize-none font-medium shadow-inner placeholder:text-slate-700"
              />
              {formData.localRulesUpdatedAt && (
                 <p className="text-[8px] text-slate-500 text-right font-bold uppercase tracking-widest">
                   Ultimo aggiornamento: {new Date(formData.localRulesUpdatedAt).toLocaleString()}
                 </p>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/5 bg-slate-950/50 shrink-0">
          <button
            onClick={handleSave}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <Save size={18} />
            Salva Regole
          </button>
        </div>
      </div>
    </div>
  );
};