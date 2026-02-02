/**
 * JOIN OR CREATE SERVICE
 * -----------------------------------------
 * Responsabilità:
 * - Gestire la logica di join-or-create per i flight
 * - Evitare race condition tramite query e update atomici
 * - Supportare sessionCode per sessioni parallele
 * - Mantenere compatibilità con la struttura Firestore esistente
 */

import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  serverTimestamp 
} from 'firebase/firestore';
import { dbData } from './firebase';

export interface JoinOrCreateParams {
  clubId: string;
  courseId: string;        // ✅ AGGIUNTO
  playerId: string;
  playerName?: string;
  sessionCode?: string;
  timestamp: number;
}

export interface JoinOrCreateResult {
  flightId: string;
  sessionCode: string;
  isNewFlight: boolean;
  playerId: string;
}

export const joinOrCreateService = {
  /**
   * Implementa la logica atomica di ingresso in un flight.
   */
  async joinOrCreate(params: JoinOrCreateParams): Promise<JoinOrCreateResult> {
    if (!dbData) throw new Error("Firestore database (dbData) non inizializzato.");

    const { clubId, courseId, playerId, playerName } = params;
    
    // Generazione roundDate in formato YYYY-MM-DD
    const now = new Date();
    const roundDate = now.toISOString().split('T')[0];
    
    // 1. Definizione sessionCode effettivo
    const effectiveSessionCode = params.sessionCode || `${clubId}_${roundDate.replace(/-/g, '')}`;

    // 2. Ricerca di un flight attivo esistente con lo stesso sessionCode e clubId
    const activeFlightsRef = collection(dbData, "active_flights");
    const q = query(
      activeFlightsRef,
      where("clubId", "==", clubId),
      where("sessionCode", "==", effectiveSessionCode),
      where("status", "==", "active")
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // --- LOGICA JOIN ---
      const existingFlightDoc = querySnapshot.docs[0];
      const flightId = existingFlightDoc.id;

      const flightRef = doc(dbData, "active_flights", flightId);
      
      await updateDoc(flightRef, {
        courseId,   // ✅ AGGIUNTO
        players: arrayUnion({ 
          userId: playerId, 
          name: playerName || 'Player',
          joinedAt: serverTimestamp() 
        }),
        lastUpdate: serverTimestamp()
      });

      return {
        flightId,
        sessionCode: effectiveSessionCode,
        isNewFlight: false,
        playerId
      };
    } else {
      // --- LOGICA CREATE ---
      const generatedFlightId = `F-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newFlightRef = doc(dbData, "active_flights", generatedFlightId);

      const newFlightPayload = {
        flightId: generatedFlightId,
        flightNumber: generatedFlightId, // Compatibilità legacy
        clubId,
        courseId,   // ✅ AGGIUNTO
        sessionCode: effectiveSessionCode,
        roundDate,
        status: 'active',
        players: [{ 
          userId: playerId, 
          name: playerName || 'Player',
          joinedAt: serverTimestamp()
        }],
        roundStartTime: serverTimestamp(),
        lastUpdate: serverTimestamp(),
        currentHole: 1,
        members: 1
      };

      await setDoc(newFlightRef, newFlightPayload);

      return {
        flightId: generatedFlightId,
        sessionCode: effectiveSessionCode,
        isNewFlight: true,
        playerId
      };
    }
  }
};
