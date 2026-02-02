
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  serverTimestamp, 
  Timestamp 
} from "firebase/firestore";
import { dbData } from "./firebase";

export type TimeclockEventType = "start" | "pause_start" | "pause_end" | "end";

export interface ShiftDocument {
  shiftId: string;
  start: Timestamp;
  end: Timestamp | null;
  pauses: { start: Timestamp; end: Timestamp | null }[];
  totalWorkMinutes: number;
  totalPauseMinutes: number;
  status: "active" | "paused" | "closed";
  createdAt: any;
  updatedAt: any;
}

export const timeclockEngine = {
  registerEvent: async (params: {
    clubId: string;
    workerId: string;
    eventType: TimeclockEventType;
    geo?: { lat: number; lng: number };
  }) => {
    if (!dbData) throw new Error("Database not ready");

    const now = new Date();
    const timestampId = now.getTime().toString();
    const { clubId, workerId, eventType, geo } = params;

    // 1. Recupero o creazione ShiftId
    let shiftId = localStorage.getItem(`active_shift_${workerId}`);
    if (eventType === "start" || !shiftId) {
      shiftId = `SHIFT_${workerId}_${timestampId}`;
      localStorage.setItem(`active_shift_${workerId}`, shiftId);
    }

    // 2. Registrazione Timbrata Atomica
    // Path: /timeclock/{clubId}/{workerId}/{timestamp}
    const eventRef = doc(dbData, 'timeclock', clubId, workerId, timestampId);
    await setDoc(eventRef, {
      type: eventType,
      createdAt: serverTimestamp(),
      shiftId,
      geo: geo || null
    });

    // 3. Gestione Aggregata Turno (Shifts)
    const shiftRef = doc(dbData, 'shifts', clubId, workerId, shiftId);
    const shiftSnap = await getDoc(shiftRef);
    const currentTimestamp = Timestamp.fromDate(now);

    if (eventType === "start") {
      await setDoc(shiftRef, {
        shiftId,
        start: currentTimestamp,
        end: null,
        pauses: [],
        totalWorkMinutes: 0,
        totalPauseMinutes: 0,
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      if (!shiftSnap.exists()) return;
      const shift = shiftSnap.data() as ShiftDocument;
      const updates: any = { updatedAt: serverTimestamp() };

      if (eventType === "pause_start") {
        updates.status = "paused";
        updates.pauses = [...shift.pauses, { start: currentTimestamp, end: null }];
      } else if (eventType === "pause_end") {
        updates.status = "active";
        const newPauses = [...shift.pauses];
        if (newPauses.length > 0) {
          newPauses[newPauses.length - 1].end = currentTimestamp;
        }
        updates.pauses = newPauses;
      } else if (eventType === "end") {
        updates.status = "closed";
        updates.end = currentTimestamp;
        
        // Chiudi eventuale pausa aperta
        const finalPauses = [...shift.pauses];
        if (finalPauses.length > 0 && !finalPauses[finalPauses.length - 1].end) {
          finalPauses[finalPauses.length - 1].end = currentTimestamp;
        }
        updates.pauses = finalPauses;

        // Calcoli Finali
        const startMillis = shift.start.toMillis();
        const endMillis = now.getTime();
        
        let pauseMillis = 0;
        finalPauses.forEach(p => {
          if (p.start && p.end) {
            pauseMillis += (p.end.toMillis() - p.start.toMillis());
          }
        });

        const totalMinutes = Math.floor((endMillis - startMillis) / 60000);
        const pauseMinutes = Math.floor(pauseMillis / 60000);
        
        updates.totalPauseMinutes = pauseMinutes;
        updates.totalWorkMinutes = totalMinutes - pauseMinutes;
        
        localStorage.removeItem(`active_shift_${workerId}`);
      }

      await updateDoc(shiftRef, updates);
    }

    // Aggiorna stato lavoratore per dashboard
    const workerRef = doc(dbData, 'staff', workerId);
    const nextShiftStatus = eventType === "start" || eventType === "pause_end" ? "clocked_in" : 
                            eventType === "pause_start" ? "on_break" : "clocked_out";
    
    await updateDoc(workerRef, { 
      shiftStatus: nextShiftStatus,
      currentShiftId: eventType === "end" ? null : shiftId,
      updatedAt: serverTimestamp()
    });
  }
};
