
// Exporting the Firestore schema documentation as a constant string for download
export const FIRESTORE_SCHEMA_DOC = `# Guida Configurazione Database Firestore per GolfRules AI

Questa guida descrive la struttura dati NoSQL per Firebase Firestore (Progetto: clublink-ai-2) focalizzata sulla collezione principale dell'App.

## 1. Struttura Dati Principale

### Collezione: \`GolfRules\`
Contiene la mappatura geo-spaziale, le regole locali e la configurazione tecnica di ogni club.
- **ID Documento**: ID univoco del Club (es. 'pinetina_premium_id')
- **Campi**:
  - \`club\`: string (Nome del Golf Club)
  - \`country\`: string (Paese)
  - \`location\`: **GeoPoint** (Coordinate Clubhouse/Tee 1)
  - \`text\`: string (Testo Regole Locali)
  - \`golfCartRules\`: string (Testo Regolamento Cart)
  - \`courseLayout\`: map (**Mappatura Geo-spaziale**)
    - \`holeLocations\`: map (ID Buca -> **GeoPoint**)
    - \`holePolygons\`: map (ID Buca -> **Array<GeoPoint>**)
    - \`greenPolygons\`: map (ID Buca -> **Array<GeoPoint>**)
    - \`teeBoxPolygons\`: map (ID Buca -> **Array<GeoPoint>**)
    - \`ppPolygons\`: map (Pitch & Putt -> **Array<GeoPoint>**)
    - \`oobPolygons\`: map (Out Of Bound -> **Array<GeoPoint>**)
  - \`updated_at\`: serverTimestamp

### Collezione: \`users\`
Contiene i profili degli utenti e i loro permessi.
- **ID Documento**: UID dell'utente
- **Campi**:
  - \`email\`: string
  - \`role\`: string ('sys_admin', 'club_admin', 'player')
  - \`subscription\`: map (Dati abbonamento Premium)

---

## 2. Strategia Geo-spaziale (Importante per AI Studio)

Tutti i dati geografici devono essere salvati utilizzando il tipo nativo **GeoPoint** di Firestore.
- I **Punti** (Tee, Posizione Giocatore) sono singoli GeoPoint.
- I **Poligoni** (Aree, Green, Ostacoli, Zone Speciali) sono Array di GeoPoint.

Questo permette a Google Gemini (AI Studio) di interpretare correttamente le distanze e le aree di gioco senza dover convertire stringhe o JSON complessi.

---

## 3. Regole di Sicurezza (Firestore Rules)

\`\`\`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /GolfRules/{clubId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /matches/{matchId}/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
\`\`\``;
