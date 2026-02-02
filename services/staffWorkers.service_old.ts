import { 
  collection, query, where, getDocs, 
  doc, getDoc 
} from "firebase/firestore";

import { httpsCallable } from "firebase/functions";

// 🔥 Importiamo l’istanza auth corretta (unificata in firebase.ts)
import { auth, dbAuth, functions } from "./firebase";


import { StaffWorker } from "../types";

// 🔥 Forza il refresh del token SENZA logout/login
const refreshToken = async () => {
  if (auth.currentUser) {
    await auth.currentUser.getIdToken(true);
  }
};

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
  // CREA OPERAIO (Cloud Function)
  // ----------------------------------------------------
  createWorker: async (data: Partial<StaffWorker>) => {

    await refreshToken(); // 🔥 token aggiornato

    const createWorkerFn = httpsCallable(functions, "createWorker");

    const result = await createWorkerFn({
      email: data.email,
      password: data.password,
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      role: data.role,
      clubId: data.clubId,
      addressLine1: data.addressLine1 || "",
      city: data.city || "",
      postalCode: data.postalCode || "",
      phone: data.phone || "",
      mobile: data.mobile || "",
      dateOfBirth: data.dateOfBirth || "",
      niNumber: data.niNumber || "",
      medicalInfo: data.medicalInfo || "",
      notes: data.notes || "",
    });

    // @ts-ignore
    return result.data.uid as string;
  },

  // ----------------------------------------------------
  // AGGIORNA OPERAIO (Cloud Function)
  // ----------------------------------------------------
  updateWorker: async (uid: string, updates: Partial<StaffWorker>) => {

    await refreshToken(); // 🔥 token aggiornato

    const updateWorkerFn = httpsCallable(functions, "updateWorker");

    const payload = {
      ...updates,
      uid,
      displayName:
        updates.firstName && updates.lastName
          ? `${updates.firstName} ${updates.lastName}`.trim()
          : updates.displayName,
    };

    await updateWorkerFn(payload);
  },

  // ----------------------------------------------------
  // DISABILITA / RIABILITA OPERAIO (Cloud Function)
  // ----------------------------------------------------
  disableWorker: async (uid: string) => {

    await refreshToken(); // 🔥 token aggiornato

    const disableWorkerFn = httpsCallable(functions, "disableWorker");

    await disableWorkerFn({ uid });
  },

  // ----------------------------------------------------
  // ELIMINA OPERAIO (Cloud Function)
  // ----------------------------------------------------
  deleteWorker: async (uid: string) => {

    await refreshToken(); // 🔥 token aggiornato

    const deleteWorkerFn = httpsCallable(functions, "deleteWorker");

    await deleteWorkerFn({ uid });
  },

  // ----------------------------------------------------
  // RESET PASSWORD (placeholder)
  // ----------------------------------------------------
  resetWorkerPassword: async (email: string) => {
    console.log("Password reset request for:", email);
    alert("Istruzioni inviate alla mail dell'operatore.");
  }
};