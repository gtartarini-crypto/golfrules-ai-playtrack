import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged as onFirebaseAuthStateChanged,
  createUserWithEmailAndPassword,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';

import { 
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  serverTimestamp,
  updateDoc,
  where,
  onSnapshot,
  limit,
  orderBy,
  addDoc,
  deleteDoc,
  arrayUnion,
  GeoPoint,
  Timestamp,
  deleteField
} from 'firebase/firestore';

import { FIREBASE_AUTH_CONFIG, FIREBASE_DATA_CONFIG } from '../config';
import { UserProfile, LocalRulesData, Course } from '../types';
import { fromFirestoreGeo } from './dataUtils';
import { getFunctions } from "firebase/functions";

// ---------------------------------------------------------
// Helper per inizializzare app senza duplicazioni
// ---------------------------------------------------------
const initApp = (name: string, config: any) => {
  const apps = getApps();
  const existing = apps.find(a => a.name === name);
  if (existing) return existing;
  return initializeApp(config, name);
};

// ---------------------------------------------------------
// 1️⃣ ClubLink AUTH + DATA (UNIFICATI)
// ---------------------------------------------------------
const appInstance = initApp('clublinkApp', FIREBASE_AUTH_CONFIG);

export const auth = getAuth(appInstance);
export const dbAuth = getFirestore(appInstance);
export const dbData = getFirestore(appInstance);
export const functions = getFunctions(appInstance, "us-central1");

// ---------------------------------------------------------
// LOG DI VERIFICA MIGRAZIONE
// ---------------------------------------------------------
console.log("🔥 AUTH PROJECT:", FIREBASE_AUTH_CONFIG.projectId);
console.log("🔥 DATA PROJECT:", FIREBASE_DATA_CONFIG.projectId);


// ---------------------------------------------------------
// Re-export modular functions
// ---------------------------------------------------------
export { 
  doc, setDoc, getDoc, getDocs, collection, query, where, 
  onSnapshot, limit, orderBy, addDoc, deleteDoc, 
  serverTimestamp, arrayUnion, updateDoc, GeoPoint, Timestamp,
  getAuth, signInWithEmailAndPassword, updatePassword, 
  reauthenticateWithCredential, EmailAuthProvider, deleteField
};

// ---------------------------------------------------------
// Registrazione Player
// ---------------------------------------------------------
export const registerPlayer = async (params: {
  email: string;
  pass: string;
  name: string;
  phone: string;
  gender: 'M' | 'F';
  federalId: string;
  homeClubId: string;
}) => {
  const userCredential = await createUserWithEmailAndPassword(auth, params.email, params.pass);
  const uid = userCredential.user.uid;

  await setDoc(doc(dbAuth, 'users', uid), {
    uid,
    email: params.email,
    name: params.name,
    phone: params.phone,
    gender: params.gender,
    federalId: params.federalId,
    role: 'player',
    homeClubId: params.homeClubId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    subscription: { tier: 'base', status: 'active', expiryDate: '2026-12-31' },
    roundStatus: 'not_started'
  });

  return uid;
};

// ---------------------------------------------------------
// Aggiornamento stato round
// ---------------------------------------------------------
export const updateUserRoundStatus = async (userId: string, status: 'not_started' | 'started' | 'closing') => {
  const userRef = doc(dbAuth, 'users', userId);
  await updateDoc(userRef, { roundStatus: status });
};

// ---------------------------------------------------------
// Listener Auth
// ---------------------------------------------------------
export const onAuthStateChange = (callback: (user: UserProfile | null) => void) => {
  return onFirebaseAuthStateChanged(auth, async (fbUser) => {
    if (fbUser) {
      try {
        const userRef = doc(dbAuth, 'users', fbUser.uid);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.exists() ? userDoc.data() : {};
        
        const rawRole = userData.role;
        const role = typeof rawRole === 'string' ? rawRole.trim().toLowerCase() : null;

        if (!role) {
          callback(null);
          return;
        }

        callback({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: userData.name || fbUser.displayName || 'Utente',
          role: role,
          homeClubId: userData.homeClubId || null,
          subscription: userData.subscription || { tier: 'base', status: 'active', expiryDate: '2026-12-31' },
          roundStatus: userData.roundStatus || 'not_started'
        } as any);

      } catch (err) {
        console.error("Auth state processing error:", err);
        callback(null);
      }
    } else {
      callback(null);
    }
  });
};

// ---------------------------------------------------------
// Login / Logout
// ---------------------------------------------------------
export const loginWithEmail = async (email: string, pass: string) => 
  signInWithEmailAndPassword(auth, email, pass);

export const logout = async () => { 
  await firebaseSignOut(auth); 
};

// ---------------------------------------------------------
// Local Rules
// ---------------------------------------------------------
export const getLocalRules = async (clubId: string | null | undefined): Promise<LocalRulesData> => {
  const defaultData: LocalRulesData = { 
    club: 'Golf Club',
    country: 'N/A',
    local_rules: '',
    golfCartRules: '',
    facilities: [],
    course: {}
  };

  if (!clubId) return defaultData;

  try {
    const clubRef = doc(dbData, 'clubs', clubId);
    const localRef = doc(dbData, 'clubs', clubId, 'local_rules', 'default');
    const cartRef = doc(dbData, 'clubs', clubId, 'golf_cart_rules', 'default');
    const courseColRef = collection(dbData, 'clubs', clubId, 'course');

    const [snap, localSnap, cartSnap, courseSnaps] = await Promise.all([
      getDoc(clubRef),
      getDoc(localRef),
      getDoc(cartRef),
      getDocs(courseColRef)
    ]);

    const baseData = snap.exists()
      ? fromFirestoreGeo(snap.data())
      : { ...defaultData };

    const local_rules =
      localSnap.exists()
        ? localSnap.data().text
        : (baseData.local_rules || '');

    const golfCartRules =
      cartSnap.exists()
        ? cartSnap.data().text
        : (baseData.golfCartRules || baseData.golf_cart_rules || '');

    const courseData: any = {};
    courseSnaps.forEach(docSnap => {
      const data = docSnap.data();
      courseData[docSnap.id] = {
        entities: fromFirestoreGeo(data.layouts || []),
        geofences: fromFirestoreGeo(data.geofences || [])
      };
    });

    return {
      ...baseData,
      local_rules,
      golfCartRules,
      course: courseData
    };

  } catch (err) {
    console.error("getLocalRules error:", err);
    return defaultData;
  }
};

// ---------------------------------------------------------
// Salvataggio dati Club
// ---------------------------------------------------------
export const saveClubData = async (clubId: string, data: any) => {
  if (!dbData) return;

  const {
    local_rules,
    golfCartRules,
    course,
    layouts,
    courseLayout,
    ...mainData
  } = data;

  await setDoc(doc(dbData, "clubs", clubId), { 
    ...mainData,
    local_rules: deleteField(),
    golfCartRules: deleteField(),
    golf_cart_rules: deleteField(),
    layouts: deleteField(),
    updated_at: serverTimestamp() 
  }, { merge: true });

  const promises: Promise<any>[] = [];

  if (local_rules !== undefined) {
    promises.push(
      setDoc(
        doc(dbData, "clubs", clubId, "local_rules", "default"),
        {
          text: local_rules,
          updated_at: serverTimestamp()
        },
        { merge: true }
      )
    );
  }

  if (golfCartRules !== undefined) {
    promises.push(
      setDoc(
        doc(dbData, "clubs", clubId, "golf_cart_rules", "default"),
        {
          text: golfCartRules,
          updated_at: serverTimestamp()
        },
        { merge: true }
      )
    );
  }

  await Promise.all(promises);
};

// ---------------------------------------------------------
// Utility varie
// ---------------------------------------------------------
export const getAllClubs = async () => {
  const snap = await getDocs(collection(dbData, 'clubs'));
  return snap.docs.map(d => ({ id: d.id, data: fromFirestoreGeo(d.data()) }));
};

export const subscribeActiveFlights = (callback: (flights: any[]) => void) => {
  const q = query(collection(dbData, 'active_flights'), where('status', '==', 'active'));
  return onSnapshot(q, (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
};

export const getAllUsers = async () => {
  const snap = await getDocs(collection(dbAuth, 'users'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const updateClubSubscription = async (id: string, sub: any) => { 
  await updateDoc(doc(dbData, 'clubs', id), { subscription: sub }); 
};

export const logDiagnostic = async (e: string, p: any) => { 
  await addDoc(collection(dbData, 'diagnostics'), { event: e, ...p, timestamp: serverTimestamp() }); 
};

export const subscribeDiagnostics = (cb: (l: any[]) => void) => {
  const q = query(collection(dbData, 'diagnostics'), orderBy('timestamp', 'desc'), limit(50));
  return onSnapshot(q, s => cb(s.docs.map(d => ({id: d.id, ...d.data()}))));
};

export const courseDataService = {
  getClubCourses: async (clubId: string) => {
    const q = query(collection(dbAuth, 'courses'), where('clubId', '==', clubId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ courseId: d.id, ...d.data() } as Course));
  },
  getCourseHoles: async (courseId: string) => {
    const holeSnap = await getDocs(collection(dbAuth, 'courses', courseId, 'holes'));
    return holeSnap.docs.map(d => ({ 
      number: d.data().number || parseInt(d.id), 
      par: d.data().par || 4, 
      length: d.data().lengths?.yellow || 0 
    })).sort((a,b) => a.number - b.number);
  }
};

export const paceOfPlayService = {
  saveConfig: async (cid: string, coid: string, h: any, s: any) => {
    await fetch('https://us-central1-clublink-ai-2.cloudfunctions.net/savePaceOfPlayConfig', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ clubId: cid, courseId: coid, holes: h, settings: s })
    });
  },
  getConfig: async (cid: string, coid: string) => {
    const paceRef = doc(dbData, 'PaceOfPlay', `${cid}_${coid}`);
    const snap = await getDoc(paceRef);
    return snap.exists() ? { holes: snap.data().holes || {}, settings: snap.data().settings } : { holes: {} as any };
  }
};

export const checkFirestoreConnection = async (l?: any) => { 
  try { 
    await getDoc(doc(dbData, 'health', 'check')); 
    l?.("SUCCESSO"); 
    return true; 
  } catch (e: any) { 
    l?.(e.message); 
    return false; 
  } 
};

export const fixPinetinaData = async (l?: any) => { 
  try { 
    await setDoc(doc(dbData, 'clubs', 'club_pinetina'), { 
      club: 'Golf Club La Pinetina', 
      subscription: { tier: 'premium', status: 'active', expiryDate: '2026-12-31' }, 
      updated_at: serverTimestamp() 
    }, { merge: true }); 
    l?.("SUCCESSO"); 
    return true; 
  } catch (e: any) { 
    l?.(e.message); 
    return false; 
  } 
};

export const seedFirestoreDatabase = (l?: any) => fixPinetinaData(l);
