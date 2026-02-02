import { useRef, useState } from 'react';
import { AppView, UserProfile, LocalRulesData } from '../../types';
import { getLocalRules, logDiagnostic, updateUserRoundStatus } from '../../services/firebase';
import { normalizeClubId, joinOrCreateFlight, endPlayerTracking } from '../../services/trackingService';

interface UseQRScannerProps {
  user: UserProfile | null;
  roundStatus: 'not_started' | 'started' | 'closing';
  activeFlightId: string | null;
  setActiveFlightId: (val: string | null) => void;
  setActiveSessionCode: (val: string | null) => void;
  setActiveCourseId: (val: string | null) => void;
  setRoundStatus: (val: 'not_started' | 'started' | 'closing') => void;
  setLocalRulesData: (val: LocalRulesData | null) => void;
  setView: (view: AppView) => void;
}

export const useQRScannerLogic = ({
  user,
  roundStatus,
  activeFlightId,
  setActiveFlightId,
  setActiveSessionCode,
  setActiveCourseId,
  setRoundStatus,
  setLocalRulesData,
  setView
}: UseQRScannerProps) => {

  const scanProcessingRef = useRef<boolean>(false);
  const [hasScanned, setHasScanned] = useState(false);

  const [popup, setPopup] = useState<null | { type: 'confirm_end' | 'already_started' | 'error' | 'flight_setup' | 'completed'; message?: string }>(null);
  const [scannedClubId, setScannedClubId] = useState<string | null>(null);

  const handleScanResult = async (data: string) => {
    if (!data) return;
    if (hasScanned || scanProcessingRef.current) return;

    scanProcessingRef.current = true;
    setHasScanned(true);

    try {
      const rawData = data.trim();
      const clubId = normalizeClubId(rawData);

      let action: 'start' | 'end' = 'start';
      if (rawData.includes('/end') || rawData.includes('action=end')) {
        action = 'end';
      }

      await logDiagnostic('QR_READ', { rawData, clubId, action, roundStatus });

      // 🛑 WORKFLOW FINE GIRO TRAMITE QR DISABILITATO (ora manuale da pulsante)
      if (action === 'end') {
        setView(user ? 'player_home' : 'landing');
        setPopup({ 
          type: 'error', 
          message: 'La chiusura tramite QR è stata disabilitata. Usa il pulsante STOP nella schermata principale.' 
        });
        setHasScanned(false);
        scanProcessingRef.current = false;
        return;
      }

      // 🟢 WORKFLOW INIZIO GIRO
      if (roundStatus === 'started') {
        setView('player_home');
        setPopup({
          type: 'already_started',
          message: 'Hai già un giro in corso. Termina quello attuale prima di iniziarne uno nuovo.'
        });
        return;
      }

      setScannedClubId(clubId);
      setView('player_home'); 
      setPopup({ type: 'flight_setup' });

    } catch (err) {
      console.error("Scan processing error:", err);
      setHasScanned(false);
      scanProcessingRef.current = false;
      setView(user ? 'player_home' : 'landing');
    }
  };

  const cancelFlightSetup = () => {
    setPopup(null);
    setHasScanned(false);
    scanProcessingRef.current = false;
    setView(user ? 'player_home' : 'landing');
  };

  const confirmFlightSetup = async (flightNum: string, teeTime: string) => {
    if (!scannedClubId || !user) return;
    
    try {
      const clubData = await getLocalRules(scannedClubId);
      setLocalRulesData(clubData);
      
      const courseId = clubData.subCourses?.[0]?.id || "default";
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const sessionCode = `${scannedClubId}_${dateStr}_${flightNum}`;

      const result = await joinOrCreateFlight(scannedClubId, courseId, user.uid, user.displayName || 'Player', sessionCode);
      
      if (result && result.flightId) {
        // Salvataggio persistente per sicurezza
        localStorage.setItem('playtrack_active_flight', result.flightId);
        
        await updateUserRoundStatus(user.uid, 'started');
        setActiveFlightId(result.flightId);
        setActiveSessionCode(sessionCode);
        setActiveCourseId(courseId);
        setRoundStatus('started');

        setPopup(null);
        setView('privacy_consent');
      }
    } catch (e) {
      console.error("Flight setup error:", e);
      setPopup({ type: 'error', message: 'Errore durante la creazione del flight.' });
      setHasScanned(false);
      scanProcessingRef.current = false;
    }
  };

  const confirmEndRound = async () => {
    const currentId = activeFlightId || localStorage.getItem('playtrack_active_flight');
    
    if (!currentId) {
        setPopup({ type: 'error', message: 'Errore: ID Flight non trovato.' });
        return;
    }

    try {
      // 1. Update DB Flight
      await endPlayerTracking(currentId);
      
      // 2. Update DB User
      if (user) {
          await updateUserRoundStatus(user.uid, 'not_started');
      }
      
      // 3. Local Cleanup
      localStorage.removeItem('playtrack_active_flight');
      setActiveFlightId(null);
      setActiveSessionCode(null);
      setRoundStatus('not_started');

      // 4. Success Feedback
      setPopup({ type: 'completed', message: 'Giro completato! Grazie per aver giocato.' });
      
      setTimeout(() => {
        setPopup(null);
        setView('landing');
        // Reset flag per scansioni future
        setHasScanned(false);
        scanProcessingRef.current = false;
      }, 2500);
      
    } catch (e) {
      console.error("End Round Error:", e);
      setPopup({ type: 'error', message: 'Errore nella chiusura. Controlla la connessione e riprova.' });
      setHasScanned(false);
      scanProcessingRef.current = false;
    }
  };

  return {
    handleScanResult,
    popup,
    setPopup,
    confirmFlightSetup,
    confirmEndRound,
    cancelFlightSetup
  };
};