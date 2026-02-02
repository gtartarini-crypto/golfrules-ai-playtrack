import React from 'react';
import { 
  LayoutDashboard, Users, LogOut, Settings, MapPin, Flag, 
  QrCode, Sliders, Lock, Clock, BarChart3, HardHat 
} from 'lucide-react';
import { AppView, Language, UserProfile, LocalRulesData } from '../../types';
import { APP_NAME } from '../../constants';

interface ClubMenuProps {
  user: UserProfile | null;
  localRulesData: LocalRulesData;
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
  lang: Language;
}

export const ClubMenu: React.FC<ClubMenuProps> = ({
  user,
  localRulesData,
  onNavigate,
  onLogout,
  lang
}) => {

  // 🔒 Blocco accesso se manca il club
  if (!user?.homeClubId) {
    return (
      <div className="h-screen bg-gray-50 flex flex-col items-center justify-center font-sans">
        <div className="bg-white border border-red-100 text-red-600 px-8 py-6 rounded-3xl shadow-sm max-w-md text-center space-y-3">
          <h1 className="text-lg font-black uppercase tracking-widest">
            Profilo incompleto
          </h1>
          <p className="text-sm font-medium">
            Il tuo account non ha un club associato (<code>homeClubId</code> mancante).
          </p>
          <p className="text-xs text-red-400">
            Contatta l’amministratore del club per completare la configurazione.
          </p>
        </div>
      </div>
    );
  }

  const clubId = user.homeClubId;

  // 🔥 Premium determinato SOLO dal database
  const isPremium =
    localRulesData.subscription?.tier === 'premium' &&
    localRulesData.subscription?.status === 'active';

  // 👇 Logica attuale: mostra gestione operai solo se NON c’è ClubLink TeeTime
  const showStaffManager = localRulesData.hasClubLinkTeeTime === false;

  const labels = {
    title: lang === 'it' ? 'Menu Principale' : 'Main Menu',
    staff: 'Gestione Operai Staff',
    staffDesc: 'Controllo turni e timbri operativi',
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col font-sans overflow-hidden">

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 flex flex-col justify-start overflow-y-auto">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 md:gap-4 mt-2">

          {/* 🔥 Voci esistenti del menu (non modificate) */}
          {/* ... */}

          {/* 🟩 GESTIONE OPERAI (GREENKEEPING) */}
          {showStaffManager && (
            <button 
              onClick={() => onNavigate('admin_greenkeeping_workers')}
              className="bg-white p-3 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:border-emerald-500 transition-all group text-left flex flex-row items-center h-auto md:flex-col md:h-40 md:justify-between active:scale-95 gap-4 md:gap-0"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-50 rounded-lg md:rounded-xl flex items-center justify-center text-emerald-600 md:mb-2 group-hover:scale-110 transition-transform border border-emerald-100 flex-shrink-0">
                <HardHat size={20} className="md:w-6 md:h-6" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm md:text-lg font-bold text-gray-900 mb-0.5 group-hover:text-emerald-700 transition-colors">
                  {labels.staff}
                </h2>
                <p className="text-[10px] md:text-xs text-gray-500 leading-tight">
                  {labels.staffDesc}
                </p>
              </div>
            </button>
          )}

          {/* 🔥 Altre voci del menu (non modificate) */}
          {/* ... */}

        </div>
      </main>
    </div>
  );
};
