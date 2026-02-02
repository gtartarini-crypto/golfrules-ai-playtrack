import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Loader2, Info, CheckCircle2, Ban } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Language, LocalRulesData, GameContext } from '../../types';
import { TRANSLATIONS } from '../../constants';

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

interface HoleByHoleCartViewProps {
  onBack: () => void;
  localRulesData: LocalRulesData;
  lang: Language;
  onFetchHoleRule: (hole: number) => Promise<string>;
}

export const HoleByHoleCartView: React.FC<HoleByHoleCartViewProps> = ({ 
  onBack, 
  localRulesData, 
  lang,
  onFetchHoleRule 
}) => {
  const [selectedHole, setSelectedHole] = useState<number | null>(null);
  const [holeData, setHoleData] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const t = TRANSLATIONS[lang];

  const holes = Array.from({ length: 18 }, (_, i) => i + 1);
  const is90DegreeActive = localRulesData.cartRule90Degree;

  const handleHoleSelect = async (hole: number) => {
    setSelectedHole(hole);
    if (holeData[hole]) return;
    setLoading(true);
    try {
      const response = await onFetchHoleRule(hole);
      setHoleData(prev => ({ ...prev, [hole]: response }));
    } catch (error) {
      console.error("Failed to fetch hole rule", error);
      setHoleData(prev => ({ ...prev, [hole]: t.errorGeneric }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-emerald-900 text-white shadow-lg sticky top-0 z-30 flex flex-col">
        <div className="px-4 py-3 flex items-center justify-between border-b border-emerald-800">
           <button 
             onClick={onBack}
             className="p-2 -ml-2 hover:bg-emerald-800 rounded-full transition-colors"
           >
             <ArrowLeft size={20} />
           </button>
           <div className="flex flex-col items-center">
              <h1 className="text-sm font-bold tracking-wide uppercase flex items-center gap-2">
                 <GolfCartIcon size={16} />
                 {t.landing.holeByHoleCart}
              </h1>
              <div className="text-xs text-emerald-300 font-medium flex items-center gap-1">
                 <MapPin size={10} />
                 {localRulesData.club || 'Golf Club'}
              </div>
           </div>
           <div className="w-8"></div>
        </div>

        <div className="p-3 bg-emerald-800 overflow-x-auto">
            <div className="grid grid-cols-9 gap-2 max-w-md mx-auto">
                {holes.map(hole => (
                    <button
                        key={hole}
                        onClick={() => handleHoleSelect(hole)}
                        className={`
                          aspect-square rounded-lg flex items-center justify-center text-sm font-bold transition-all shadow-sm
                          ${selectedHole === hole 
                             ? 'bg-white text-emerald-900 scale-110 shadow-md ring-2 ring-emerald-400' 
                             : 'bg-emerald-700/50 text-emerald-100 hover:bg-emerald-600 hover:text-white'}
                        `}
                    >
                        {hole}
                    </button>
                ))}
            </div>
        </div>

        <div className={`
          w-full py-2 px-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wide shadow-inner
          ${is90DegreeActive 
            ? 'bg-emerald-100 text-emerald-800 border-b border-emerald-200' 
            : 'bg-orange-100 text-orange-900 border-b border-orange-200'}
        `}>
           {is90DegreeActive ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Ban size={16} className="text-orange-600" />}
           <span>
             {is90DegreeActive 
               ? (lang === 'it' ? "Regola 90° Attiva (Ingresso Consentito)" : "90° Rule Active (Entry Allowed)")
               : (lang === 'it' ? "Regola 90° NON Attiva (Solo Sentieri)" : "90° Rule Inactive (Cart Path Only)")
             }
           </span>
        </div>
      </header>

      <main className="flex-1 p-4 pb-20 max-w-3xl mx-auto w-full">
         {!selectedHole ? (
             <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500 mt-10 space-y-4">
                 <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-emerald-600 mb-2">
                    <Info size={32} />
                 </div>
                 <p className="max-w-xs">
                    {lang === 'it' 
                       ? "Seleziona una buca dall'alto per visualizzare le regole specifiche di transito e parcheggio del cart."
                       : "Select a hole from above to view specific cart transit and parking rules."}
                 </p>
             </div>
         ) : (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                 <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md">
                        {selectedHole}
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">
                        {lang === 'it' ? `Regole Buca