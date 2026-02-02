import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Sliders, Check, User, Tag, Shield, Hash, LayoutTemplate } from 'lucide-react';
import { Language, LocalRulesData, MonitorSettings } from '../../types';
import { TRANSLATIONS, APP_NAME } from '../../constants';

interface MonitorSetupProps {
  localRulesData: LocalRulesData;
  onSave: (data: LocalRulesData) => void;
  onBack: () => void;
  lang: Language;
}

export const MonitorSetup: React.FC<MonitorSetupProps> = ({ localRulesData, onSave, onBack, lang }) => {
  const defaultSettings: MonitorSettings = {
    showPlayers: true,
    showPlayerNames: false,
    showMarshals: false,
    showHoleNumbers: false
  };

  const [settings, setSettings] = useState<MonitorSettings>(localRulesData.monitorSettings || defaultSettings);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (localRulesData.monitorSettings) {
      setSettings(localRulesData.monitorSettings);
    }
  }, [localRulesData]);

  const handleToggle = (key: keyof MonitorSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    const updatedData = {
      ...localRulesData,
      monitorSettings: settings
    };
    onSave(updatedData);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const labels = {
    title: lang === 'it' ? 'Setup Monitoraggio' : 'Monitor Setup',
    subtitle: lang === 'it' ? 'Configurazione Visualizzazione Mappa' : 'Map View Configuration',
    description: lang === 'it' 
      ? "Imposta la visualizzazione predefinita degli elementi all'apertura del monitoraggio Marshall." 
      : "Set the default visibility of elements when opening the Marshall monitor.",
    save: lang === 'it' ? 'Salva Configurazione' : 'Save Configuration',
    saved: lang === 'it' ? 'Configurazione salvata!' : 'Configuration saved!',
    
    toggles: {
      players: lang === 'it' ? 'Giocatori (Flight)' : 'Players (Flight)',
      names: lang === 'it' ? 'Nomi Giocatori' : 'Player Names',
      marshall: lang === 'it' ? 'Marshall' : 'Marshall',
      holes: lang === 'it' ? 'Numeri Buche' : 'Hole Numbers',
    }
  };

  const ToggleItem = ({ 
    label, 
    active, 
    icon: Icon, 
    onClick,
    colorClass 
  }: { 
    label: string; 
    active: boolean; 
    icon: any; 
    onClick: () => void;
    colorClass: string;
  }) => (
    <div 
      onClick={onClick}
      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200 ${active ? `bg-${colorClass}-50 border-${colorClass}-200 shadow-sm` : 'bg-white border-gray-200 hover:bg-gray-50'}`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${active ? `bg-${colorClass}-100 text-${colorClass}-700` : 'bg-gray-100 text-gray-500'}`}>
          <Icon size={20} />
        </div>
        <span className={`font-bold text-sm ${active ? 'text-gray-900' : 'text-gray-500'}`}>{label}</span>
      </div>
      
      <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 flex items-center ${active ? `bg-${colorClass}-500` : 'bg-gray-300'}`}>
        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${active ? 'translate-x-6' : 'translate-x-0'}`} />
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-gray-50 flex flex-col font-sans overflow-hidden">
      <header className="bg-emerald-900 text-white shadow-lg flex-shrink-0 z-20">
        <div className="w-full px-6 py-3 flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
             <button onClick={onBack} className="p-2 -ml-2 hover:bg-emerald-800 rounded-full transition-colors mr-2">
               <ArrowLeft size={20} />
             </button>
             <div className="bg-white/10 p-2 rounded-lg">
                <Sliders size={20} className="text-emerald-300" />
             </div>
             <div>
                <h1 className="text-lg font-bold leading-tight">{labels.title}</h1>
                <p className="text-xs text-emerald-300 uppercase tracking-wider opacity-80 flex items-center gap-1">
                   {APP_NAME}
                </p>
             </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
         <div className="w-full mx-auto space-y-6">
            
            {showSuccess && (
                <div className="bg-emerald-100 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <div className="bg-emerald-500 rounded-full p-1 text-white">
                        <Check size={12} />
                    </div>
                    <span className="font-medium text-sm">{labels.saved}</span>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="mb-6 border-b border-gray-100 pb-4">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <LayoutTemplate size={20} className="text-emerald-600" />
                        {labels.subtitle}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {labels.description}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <ToggleItem 
                        label={labels.toggles.players}
                        active={settings.showPlayers}
                        icon={User}
                        onClick={() => handleToggle('showPlayers')}
                        colorClass="emerald"
                    />
                    
                    <ToggleItem 
                        label={labels.toggles.names}
                        active={settings.showPlayerNames}
                        icon={Tag}
                        onClick={() => handleToggle('showPlayerNames')}
                        colorClass="blue"
                    />

                    <ToggleItem 
                        label={labels.toggles.marshall}
                        active={settings.showMarshals}
                        icon={Shield}
                        onClick={() => handleToggle('showMarshals')}
                        colorClass="amber"
                    />

                    <ToggleItem 
                        label={labels.toggles.holes}
                        active={settings.showHoleNumbers}
                        icon={Hash}
                        onClick={() => handleToggle('showHoleNumbers')}
                        colorClass="purple"
                    />
                </div>
            </div>

            <button 
                onClick={handleSave}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
                <Save size={20} />
                {labels.save}
            </button>

         </div>
      </main>
    </div>
  );
};