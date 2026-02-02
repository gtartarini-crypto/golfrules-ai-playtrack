import React from 'react';
import { X, History, ChevronRight } from 'lucide-react';
import { HistoryItem, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelect: (query: string) => void;
  lang: Language;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({ isOpen, onClose, history, onSelect, lang }) => {
  const t = TRANSLATIONS[lang];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-emerald-800 text-white">
          <div className="flex items-center gap-2">
            <History size={20} />
            <h2 className="font-bold text-lg">{t.history}</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-emerald-700 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-64px)] p-2">
          {history.length === 0 ? (
            <div className="text-center text-gray-500 mt-10 text-sm">
              {t.noHistory}
            </div>
          ) : (
            <ul className="space-y-2">
              {history.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onSelect(item.query);
                      onClose();
                    }}
                    className="w-full text-left p-3 rounded-lg hover:bg-emerald-50 border border-gray-100 group transition-colors"
                  >
                    <p className="font-medium text-gray-800 text-sm line-clamp-2">{item.query}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-400">
                        {new Date(item.timestamp).toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', { day: 'numeric', month: 'short' })}
                      </span>
                      <ChevronRight size={14} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};
