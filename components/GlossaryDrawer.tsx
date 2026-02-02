import React, { useState, useMemo } from 'react';
import { X, Search, BookOpen } from 'lucide-react';
import { GOLF_GLOSSARY, TRANSLATIONS } from '../constants';
import { Language } from '../types';

interface GlossaryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const GlossaryDrawer: React.FC<GlossaryDrawerProps> = ({ isOpen, onClose, lang }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const t = TRANSLATIONS[lang];

  const filteredTerms = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return GOLF_GLOSSARY[lang].filter(item =>
      item.term.toLowerCase().includes(lower) ||
      item.definition.toLowerCase().includes(lower)
    );
  }, [searchTerm, lang]);

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
        fixed top-0 right-0 h-full w-80 bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-emerald-800 text-white">
          <div className="flex items-center gap-2">
            <BookOpen size={20} />
            <h2 className="font-bold text-lg">{t.glossary}</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-emerald-700 rounded">
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder={t.searchGlossary}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
            />
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto h-[calc(100%-130px)] p-4">
          {filteredTerms.length === 0 ? (
            <div className="text-center text-gray-500 mt-10 text-sm">
              {t.noGlossary}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTerms.map((item) => (
                <div key={item.term} className="pb-3 border-b border-gray-100 last:border-0">
                  <h3 className="font-bold text-emerald-900 text-base">{item.term}</h3>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">{item.definition}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
