import { 
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";

import { dbData } from "./firebase";
import { TimeclockEntry, ShiftStatus } from "../types/StaffTypes";

export const timeclockService = {

  /**
   * Registra una timbratura:
   * /timeclock/{clubId}/{workerId}/{timestamp}
   */
  punch: async (
    data: {
      clubId: string;
      workerUid: string;
      type: TimeclockEntry['type'];
      punchedBy: string;
      timestamp: number;
      location?: { lat: number; lng: number };
    }
  ) => {
    if (!dbData) throw new Error("Firestore not initialized");

    const { clubId, workerUid, type, punchedBy, timestamp, location } = data;

    const timestampId = timestamp.toString();

    const punchRef = doc(dbData, 'timeclock', clubId, workerUid, timestampId);

    // Fix: Using workerUid property to match updated interface
    const entry: TimeclockEntry = {
      id: timestampId,
      workerUid,
      clubId,
      type,
      punchedBy,
      timestamp: serverTimestamp(),
      location: location || null
    };

    await setDoc(punchRef, entry);

    // Aggiorna lo stato del lavoratore
    const workerRef = doc(dbData, 'staff', workerUid);
    let nextStatus: ShiftStatus = 'clocked_out';

    if (type === 'clock_in' || type === 'break_end') nextStatus = 'clocked_in';
    else if (type === 'break_start') nextStatus = 'on_break';

    await updateDoc(workerRef, {
      shiftStatus: nextStatus,
      updatedAt: serverTimestamp()
    });

    return nextStatus;
  },

  /**
   * Recupera lo storico timbrate di un singolo lavoratore
   */
  getHistory: async (
    clubId: string,
    workerUid: string,
    period: 'today' | 'week' | 'month'
  ) => {
    if (!dbData) return [];

    const historyRef = collection(dbData, 'timeclock', clubId, workerUid);
    const q = query(historyRef, orderBy('timestamp', 'desc'));
    const snap = await getDocs(q);

    const all = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as TimeclockEntry));

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = startOfToday - (now.getDay() * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return all.filter(entry => {
      const ts = entry.timestamp?.toMillis ? entry.timestamp.toMillis() : 0;
      if (period === 'today') return ts >= startOfToday;
      if (period === 'week') return ts >= startOfWeek;
      if (period === 'month') return ts >= startOfMonth;
      return true;
    });
  },

  /**
   * Recupera TUTTE le timbrature del club (per export)
   * Struttura Firestore:
   * /timeclock/{clubId}/{workerId}/{timestamp}
   */
  getTimeclockEntries: async (clubId: string) => {
    if (!dbData) return [];

    // 1) Recupera tutti i lavoratori del club
    const workersRef = collection(dbData, 'staff');
    const workersQuery = query(workersRef, where('clubId', '==', clubId));
    const workersSnap = await getDocs(workersQuery);

    const workerIds = workersSnap.docs.map(d => d.id);

    let allEntries: TimeclockEntry[] = [];

    // 2) Per ogni lavoratore, recupera tutte le timbrature
    for (const workerUid of workerIds) {
      const ref = collection(dbData, 'timeclock', clubId, workerUid);
      const q = query(ref, orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);

      const entries = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as TimeclockEntry[];

      allEntries = [...allEntries, ...entries];
    }

    // 3) Ordina per timestamp decrescente
    return allEntries.sort((a, b) => {
      const tsA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
      const tsB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
      return tsB - tsA;
    });
  }
};