/**
 * PACE RESET SERVICE
 * -----------------------------------------
 * Responsabilità:
 * - Applicare un reset del pace impostando paceResetTimestamp
 * - Non alterare roundStartTime
 * - Non rompere il calcolo attuale
 * - Supportare la Cloud Function aggregateFlight
 */

import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { dbData } from "./firebase";

export const paceResetService = {
  /**
   * Imposta paceResetTimestamp sul documento del flight.
   * Il calcolo del delay verrà gestito server-side dalla Cloud Function.
   */
  async applyReset(flightId: string): Promise<void> {
    if (!dbData) throw new Error("Firestore database (dbData) non inizializzato.");

    const flightRef = doc(dbData, "active_flights", flightId);

    try {
      await updateDoc(flightRef, {
        paceResetTimestamp: serverTimestamp(),
        lastUpdate: serverTimestamp()
      });
    } catch (error) {
      console.error("[PaceResetService] Error applying reset:", error);
      throw error;
    }
  }
};