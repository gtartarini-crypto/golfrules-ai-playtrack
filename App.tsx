// Importa tutti i plugin custom (incluso BackgroundLocation)
import './plugins';
import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { UserProfile, AppView, Language, LocalRulesData, GameContext } from './types';
import { onAuthStateChange, logout as firebaseLogout, getLocalRules } from './services/firebase';

// Logic Hooks
import { useGPS } from './logic/tracking/useGPS';
import { useChat } from './logic/chat/useChat';
import { useQRScannerLogic } from './logic/qr/handleScanResult';
import { useImageCapture } from './logic/images/useImageCapture';
import { useSaveClubData } from './logic/club/useSaveClubData';

// Router Component
import { MainViewRenderer } from './router/renderMainView';

// Popup
import { FlightSetupPopup } from './components/FlightSetupPopup';

// 🔐 Permessi Capacitor
import { Camera } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';

// Listener globale per verificare ricezione eventi GPS
import { BackgroundLocation } from './plugins/background-location';

// Importa tutti i plugin custom (incluso BackgroundLocation)
import './plugins';


BackgroundLocation.addListener("location", (data) => {
  console.log("[GLOBAL GPS EVENT]", data);
});

export const App: React.FC = () => {
  const [view, setView] = useState<AppView>('landing');
  const [lang, setLang] = useState<Language>('it');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [localRulesData, setLocalRulesData] = useState<LocalRulesData | null>(null);
  const [gameContext, setGameContext] = useState<GameContext>({ location: 'General', lie: 'Standard' });
  const [activeFlightId, setActiveFlightId] = useState<string | null>(localStorage.getItem('playtrack_active_flight'));
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [activeSessionCode, setActiveSessionCode] = useState<string | null>(null);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [roundStatus, setRoundStatus] = useState<'not_started' | 'started' | 'closing'>('not_started');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentViewRef = useRef<AppView>('landing');

  useEffect(() => {
    currentViewRef.current = view;
  }, [view]);

  // Resize Listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 🔐 Richiesta permessi (Camera, GPS, Microfono)
  useEffect(() => {
    const requestAllPermissions = async () => {
      try {
        await Camera.requestPermissions();
        await Geolocation.requestPermissions();
        console.log("Permessi richiesti correttamente");
      } catch (err) {
        console.error("Errore richiesta permessi:", err);
      }
    };

    requestAllPermissions();
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChange(async (u) => {
      setUser(u);

      if (u) {
        try {
          if (u.homeClubId) {
            const clubData = await getLocalRules(u.homeClubId);
            setLocalRulesData(clubData);
          }
        } catch (e) {
          console.error("Errore caricamento regole:", e);
        }

        switch (u.role) {
          case 'sys_admin':
            setView('super_admin_dashboard');
            break;
          case 'club_admin':
            setView('club_dashboard');
            break;
          case 'marshall':
            setView('player_monitor');
            break;
          case 'greenkeeper':
            setView('staff_home_mobile');
            break;
          default:
            setView('landing');
        }
      } else {
        setView('landing');
      }

      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  // Logout Wrapper
  const handleLogout = async () => {
    await firebaseLogout();
    setView('landing');
  };

  // GPS
  const { syncStatusLog } = useGPS({
    user, activeFlightId, activeSessionCode, activeCourseId, roundStatus
  });

  // Chat
  const {
    messages, inputMessage, setInputMessage, isThinking,
    handleSendMessage, handleQuickSearch
  } = useChat({
    lang, gameContext, localRulesData, capturedImage, setCapturedImage, setView
  });

  // QR Scanner Logic
  const {
    handleScanResult,
    popup,
    setPopup,
    confirmFlightSetup,
    confirmEndRound,
    cancelFlightSetup
  } = useQRScannerLogic({
    user, roundStatus, activeFlightId, setActiveFlightId,
    setActiveSessionCode, setActiveCourseId, setRoundStatus,
    setLocalRulesData, setView
  });

  // Image Capture
  const { handleImageCapture } = useImageCapture({
    setCapturedImage, setView
  });

  // Save Club Data
  const { handleSaveClubData } = useSaveClubData({
    user, setLocalRulesData
  });

  const handleStopRound = () => {
    setPopup({ 
      type: 'confirm_end', 
      message: lang === 'it' 
        ? 'Hai terminato il tuo giro? Conferma per interrompere il tracciamento GPS e completare la sessione.' 
        : 'Finished your round? Confirm to stop GPS tracking and complete the session.' 
    });
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-sans">
        <Loader2 className="animate-spin text-emerald-400 mb-4" size={48} />
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
          Inizializzazione sessione...
        </p>
      </div>
    );
  }

  const isDesktopAdmin = user && (user.role === 'club_admin' || user.role === 'sys_admin') && !isMobile;

  const commonProps = {
    view, setView, lang, setLang, user, localRulesData, messages,
    inputMessage, setInputMessage, isThinking, handleSendMessage,
    handleQuickSearch, handleScanResult, handleSaveClubData,
    handleImageCapture, logout: handleLogout, isMobile, gameContext, setGameContext,
    activeFlightId, capturedImage, setCapturedImage, syncStatusLog,
    roundStatus, chatEndRef, fileInputRef,
    popup, setPopup,
    confirmEndRound,
    onStopRound: handleStopRound
  };

  if (isDesktopAdmin) {
    return (
      <div className="min-h-screen bg-white font-sans w-full overflow-x-hidden">
        <MainViewRenderer {...commonProps} />
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] bg-slate-950 flex items-center justify-center p-0 md:p-8 font-sans overflow-hidden">
      <div className="w-full h-[100svh] md:h-[844px] md:max-w-[390px] md:rounded-[3rem] md:border-[8px] md:border-slate-900 md:shadow-2xl overflow-hidden relative bg-slate-950">

        {popup?.type === 'flight_setup' && (
          <FlightSetupPopup
            onConfirm={confirmFlightSetup}
            onClose={cancelFlightSetup}
          />
        )}

        {popup?.type === 'confirm_end' && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white z-[200]">
            <div className="bg-slate-800 p-6 rounded-xl text-center">
              <p>{popup.message}</p>

              <button
                className="mt-4 bg-red-500 px-4 py-2 rounded-lg font-bold"
                onClick={confirmEndRound}
              >
                Termina il giro
              </button>

              <button
                className="mt-4 bg-slate-600 px-4 py-2 rounded-lg"
                onClick={() => setPopup(null)}
              >
                Annulla
              </button>
            </div>
          </div>
        )}

        {popup?.type === 'completed' && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white z-[150]">
            <div className="bg-slate-800 p-6 rounded-xl text-center">
              <p>{popup.message}</p>
              <button
                className="mt-4 bg-emerald-500 px-4 py-2 rounded-lg"
                onClick={() => setPopup(null)}
              >
                OK
              </button>
            </div>
          </div>
        )}

        {popup?.type === 'already_started' && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white z-[150]">
            <div className="bg-slate-800 p-6 rounded-xl text-center">
              <p>{popup.message}</p>
              <button
                className="mt-4 bg-emerald-500 px-4 py-2 rounded-lg"
                onClick={() => setPopup(null)}
              >
                OK
              </button>
            </div>
          </div>
        )}

        <MainViewRenderer {...commonProps} />
      </div>
    </div>
  );
};
