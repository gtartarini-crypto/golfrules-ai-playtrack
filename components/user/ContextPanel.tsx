
import React from 'react';
import { GameContext, Language } from '../../types';
import { TRANSLATIONS } from '../../constants';
import { MapPin, Flag } from 'lucide-react';

interface ContextPanelProps {
  context: GameContext;
  setContext: React.Dispatch<React.SetStateAction<GameContext>>;
  disabled?: boolean;
  lang: Language;
}

export const ContextPanel: React.FC<ContextPanelProps> = ({ context, setContext, disabled, lang }) => {
  const t = TRANSLATIONS[lang].context;

  return (
    <div className="bg-slate-950/50 p-2.5 rounded-2xl border border-white/5 flex flex-wrap gap-2 text-sm backdrop-blur-md">
      <div className="flex items-center gap-2 flex-1 min-w-[120px] bg-white/5 p-2 rounded-xl border border-white/5">
        <MapPin size={14} className="text-emerald-400" />
        <select
          disabled={disabled}
          value={context.location}
          onChange={(e) => setContext(prev => ({ ...prev, location: e.target.value as any }))}
          className="w-full bg-transparent outline-none text-slate-200 text-xs font-bold uppercase tracking-tight appearance-none cursor-pointer"
        >
          <option value="General" className="bg-slate-900">{t.location.General}</option>
          <option value="Tee" className="bg-slate-900">{t.location.Tee}</option>
          <option value="Fairway" className="bg-slate-900">{t.location.Fairway}</option>
          <option value="Rough" className="bg-slate-900">{t.location.Rough}</option>
          <option value="Bunker" className="bg-slate-900">{t.location.Bunker}</option>
          <option value="Penalty Area" className="bg-slate-900">{t.location.PenaltyArea}</option>
          <option value="Green" className="bg-slate-900">{t.location.Green}</option>
        </select>
      </div>

      <div className="flex items-center gap-2 flex-1 min-w-[120px] bg-white/5 p-2 rounded-xl border border-white/5">
        <Flag size={14} className="text-emerald-400" />
        <select
          disabled={disabled}
          value={context.lie}
          onChange={(e) => setContext(prev => ({ ...prev, lie: e.target.value as any }))}
          className="w-full bg-transparent outline-none text-slate-200 text-xs font-bold uppercase tracking-tight appearance-none cursor-pointer"
        >
          <option value="Standard" className="bg-slate-900">{t.lie.Standard}</option>
          <option value="Good" className="bg-slate-900">{t.lie.Good}</option>
          <option value="Buried" className="bg-slate-900">{t.lie.Buried}</option>
          <option value="Underwater" className="bg-slate-900">{t.lie.Underwater}</option>
          <option value="Unplayable" className="bg-slate-900">{t.lie.Unplayable}</option>
        </select>
      </div>
    </div>
  );
};
