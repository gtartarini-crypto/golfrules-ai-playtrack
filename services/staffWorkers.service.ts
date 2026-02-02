import { 
  collection, query, where, getDocs, 
  doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp 
} from "firebase/firestore";

import { dbAuth } from "./firebase";
import { StaffWorker } from "../types";

export const staffWorkersService = {

  // ----------------------------------------------------
  // LEGGI TUTTI GLI OPERAI DEL CLUB
  // ----------------------------------------------------
  getWorkersByClub: async (clubId: string): Promise<StaffWorker[]> => {
    if (!dbAuth) return [];

    const q = query(
      collection(dbAuth, "staff"),
      where("clubId", "==", clubId)
    );

    const snap = await getDocs(q);

    return snap.docs.map((d) => {
      const data = d.data();
      const displayName =
        data.displayName ||
        `${data.firstName || ""} ${data.lastName || ""}`.trim();

      return { uid: d.id, ...data, displayName } as StaffWorker;
    });
  },

  // ----------------------------------------------------
  // LEGGI UN OPERAIO SINGOLO
  // ----------------------------------------------------
  getWorker: async (uid: string): Promise<StaffWorker | null> => {
    if (!dbAuth) return null;

    const snap = await getDoc(doc(dbAuth, "staff", uid));
    if (!snap.exists()) return null;

    const data = snap.data();
    const displayName =
      data.displayName ||
      `${data.firstName || ""} ${data.lastName || ""}`.trim();

    return { uid: snap.id, ...data, displayName } as StaffWorker;
  },

  // ----------------------------------------------------
  // CREA OPERAIO (Direttamente in Firestore)
  // ----------------------------------------------------
  createWorker: async (data: Partial<StaffWorker>) => {
    if (!dbAuth) throw new Error("Database non inizializzato");

    // Generiamo un UID se non presente (anche se in produzione solitamente viene dall'Auth)
    const uid = data.uid || doc(collection(dbAuth, "staff")).id;
    const staffRef = doc(dbAuth, "staff", uid);

    const payload = {
      ...data,
      uid,
      active: true,
      disabled: false,
      shiftStatus: 'clocked_out',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(staffRef, payload);
    return uid;
  },

  // ----------------------------------------------------
  // AGGIORNA OPERAIO (Direttamente in Firestore)
  // ----------------------------------------------------
  updateWorker: async (uid: string, updates: Partial<StaffWorker>) => {
    if (!dbAuth) throw new Error("Database non inizializzato");

    const staffRef = doc(dbAuth, "staff", uid);
    
    const payload = {
      ...updates,
      updatedAt: serverTimestamp(),
      displayName:
        updates.firstName && updates.lastName
          ? `${updates.firstName} ${updates.lastName}`.trim()
          : updates.displayName,
    };

    await updateDoc(staffRef, payload);
  },

  // ----------------------------------------------------
  // DISABILITA / RIABILITA OPERAIO
  // ----------------------------------------------------
  disableWorker: async (uid: string, clubId: string) => {
    if (!dbAuth) throw new Error("Database non inizializzato");
    const staffRef = doc(dbAuth, "staff", uid);
    await updateDoc(staffRef, { 
        disabled: true, 
        updatedAt: serverTimestamp() 
    });
  },

  // ----------------------------------------------------
  // ELIMINA OPERAIO (Direttamente in Firestore)
  // ----------------------------------------------------
  deleteWorker: async (uid: string, clubId: string) => {
    if (!dbAuth) throw new Error("Database non inizializzato");
    await deleteDoc(doc(dbAuth, "staff", uid));
  },

  // ----------------------------------------------------
  // RESET PASSWORD (placeholder)
  // ----------------------------------------------------
  resetWorkerPassword: async (email: string) => {
    console.log("Password reset request for:", email);
    alert("Funzionalità disponibile tramite Firebase Console o Auth API.");
  }
};