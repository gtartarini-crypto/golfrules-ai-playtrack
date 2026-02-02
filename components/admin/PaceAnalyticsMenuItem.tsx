import React from 'react';
import { BarChart3, Clock } from 'lucide-react';
import { AppView } from '../../types';

interface Props {
  isActive: boolean;
  onNavigate: (view: AppView) => void;
  isLocked?: boolean;
}

export const PaceAnalyticsMenuItem: React.FC<Props> = ({ isActive, onNavigate, isLocked }) => {
  return (
    <button
      onClick={() => !isLocked && onNavigate('pace_analytics' as AppView)}
      className={`w-full flex items-center justify-between p-4 rounded-[1rem] transition-all group ${
        isActive 
          ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 border border-white/10' 
          : isLocked ? 'opacity-20 cursor-not-allowed text-slate-500' : 'text-slate-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <div className="flex items-center gap-4">
        <BarChart3 size={20} className={isActive ? 'text-slate-950' : 'text-slate-500 group-hover:text-white'} />
        <span className="text-xs font-black tracking-tight uppercase">Pace Analytics</span>
      </div>
      {isLocked && <Clock size={12} className="text-slate-500" />}
    </button>
  );
};