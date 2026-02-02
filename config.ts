// --- CONFIGURAZIONE MULTI-PROGETTO FIREBASE ---

// 1. PROGETTO AMMINISTRATIVO (Autenticazione primaria: clublink-ai-2)
// Serve SOLO per ottenere l'ID token da inviare alla Cloud Function
export const FIREBASE_AUTH_CONFIG = {
  apiKey: "AIzaSyBXFsX39RUZ0qs4zIMjFVc1IyBC1_qPDL0",
  authDomain: "clublink-ai-2.firebaseapp.com",
  projectId: "clublink-ai-2",
  storageBucket: "clublink-ai-2.firebasestorage.app",
  messagingSenderId: "1088315187036",
  appId: "1:1088315187036:web:186ce240e5a0996930eb99"
};

// 2. PROGETTO GOLFRULES (Autenticazione secondaria + Database)
export const FIREBASE_DATA_CONFIG = {
  apiKey: "AIzaSyBXFsX39RUZ0qs4zIMjFVc1IyBC1_qPDL0",
  authDomain: "clublink-ai-2.firebaseapp.com",
  projectId: "clublink-ai-2",
  storageBucket: "clublink-ai-2.firebasestorage.app",
  messagingSenderId: "1088315187036",
  appId: "1:1088315187036:web:186ce240e5a0996930eb99"
// apiKey: "AIzaSyB92vTs22MgdG_B3cFj--SX0kJtHJJ6S-Q",
// authDomain: "golfrules-ai---playtrack.firebaseapp.com",
// projectId: "golfrules-ai---playtrack",
// storageBucket: "golfrules-ai---playtrack.firebasestorage.app",
// messagingSenderId: "346172661752",
//appId: "1:346172661752:web:20dbcea6a24000db94000d"
};

// API key obtained exclusively from environment variable
export const GEMINI_API_KEY = process.env.API_KEY;
