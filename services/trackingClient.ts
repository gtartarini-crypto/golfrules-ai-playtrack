import { doc, onSnapshot } from 'firebase/firestore';
import { dbData } from './firebase';

interface TrackingClientOptions {
  flightId: string;
  onForceRefresh: () => void;
  onCompleted: () => void;
}

/**
 * Sottoscrizione ai comandi remoti e cambiamenti di stato del flight.
 * Gestisce il forceRefresh del Marshall e il completamento del giro.
 */
export const subscribeToFlightCommands = (options: TrackingClientOptions) => {
  const { flightId, onForceRefresh, onCompleted } = options;
  if (!dbData) return () => {};

  const flightRef = doc(dbData, "active_flights", flightId);

  // Recuperiamo l'ultimo refresh gestito per evitare loop al caricamento
  let lastRefreshTime = Number(sessionStorage.getItem(`lastRefresh_${flightId}`)) || null;

  return onSnapshot(flightRef, (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();

    // 1. Gestione completamento remoto o tramite QR
    if (data.status === 'completed' || data.status === 'finished') {
      onCompleted();
      return;
    }

    // 2. Gestione Force Refresh dal Marshall
    if (data.forceRefresh) {
      const refreshMillis = data.forceRefresh.toMillis();
      
      if (lastRefreshTime === null) {
        // Prima lettura dello stato: sincronizziamo il riferimento senza triggerare
        lastRefreshTime = refreshMillis;
        sessionStorage.setItem(`lastRefresh_${flightId}`, String(refreshMillis));
      } else if (refreshMillis > lastRefreshTime) {
        // Il Marshall ha effettivamente inviato un nuovo comando
        lastRefreshTime = refreshMillis;
        sessionStorage.setItem(`lastRefresh_${flightId}`, String(refreshMillis));
        console.log("[PlayTrack] Remote refresh command received from Marshall.");
        onForceRefresh();
      }
    }
  });
};

/**
 * Funzione stub da implementare nell'App per riavviare i sensori
 */
export const restartGpsTracking = () => {
  console.log("GPS Tracking restarted and positions synced.");
  // Implementazione reale: navigator.geolocation.getCurrentPosition(...)
};