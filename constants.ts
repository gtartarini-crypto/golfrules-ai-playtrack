import { GolfRule, GameContext, Language } from './types';

export const APP_NAME = "GOLFRULES & PLAYTRACK";

// Dizionario per la ricerca intelligente dei club
export const CONTINENTS = ["Europa", "Nord America", "Sud America", "Asia", "Africa", "Oceania"];
export const COUNTRIES_BY_CONTINENT: Record<string, string[]> = {
  "Europa": ["Italia", "Francia", "Spagna", "Germania", "Regno Unito", "Svezia", "Portogallo"],
  "Nord America": ["USA", "Canada", "Messico"]
};

export const MASTER_GOLF_CLUBS = [
  { id: 'club_pinetina', name: 'Golf Club La Pinetina', country: 'Italia', continent: 'Europa' },
  { id: 'club_milano', name: 'Golf Club Milano', country: 'Italia', continent: 'Europa' },
  { id: 'club_monticello', name: 'Golf Club Monticello', country: 'Italia', continent: 'Europa' },
  { id: 'club_villa_este', name: 'Golf Club Villa d\'Este', country: 'Italia', continent: 'Europa' },
  { id: 'club_lecco', name: 'Golf Club Lecco', country: 'Italia', continent: 'Europa' },
  { id: 'club_carimate', name: 'Golf Club Carimate', country: 'Italia', continent: 'Europa' },
  { id: 'club_bogogno', name: 'Bogogno Golf Resort', country: 'Italia', continent: 'Europa' },
  { id: 'club_biella', name: 'Golf Club Biella Le Betulle', country: 'Italia', continent: 'Europa' },
  { id: 'club_gardagolf', name: 'Gardagolf Country Club', country: 'Italia', continent: 'Europa' },
  { id: 'club_roma', name: 'Circolo del Golf Roma Acquasanta', country: 'Italia', continent: 'Europa' },
  { id: 'club_st_andrews', name: 'St Andrews Links', country: 'Regno Unito', continent: 'Europa' },
  { id: 'club_augusta', name: 'Augusta National Golf Club', country: 'USA', continent: 'Nord America' }
];

export const TERMINOLOGY_WARNINGS: Record<Language, { term: string; suggestion: string; reason: string }[]> = {
  it: [
    { term: 'impicciata', suggestion: 'incastrata / infossata', reason: 'Termine colloquiale poco chiaro.' },
    { term: 'impicciato', suggestion: 'incastrata / infossata', reason: 'Termine colloquiale poco chiaro.' },
    { term: 'fritta', suggestion: 'infossata (uovo fritto)', reason: 'Usa "infossata" per descrivere la palla nella sabbia.' },
    { term: 'fritto', suggestion: 'infossata (uovo fritto)', reason: 'Usa "infossata" per descrivere la palla nella sabbia.' },
    { term: 'messa male', suggestion: 'lie brutto / ingiocabile', reason: 'Sii più specifico: la palla è giocabile o ingiocabile?' },
    { term: 'cannato', suggestion: 'mancato / top', reason: 'Specifica se hai mancato la palla o colpita male.' },
    { term: 'zappato', suggestion: 'colpo pesante', reason: 'Usa termini tecnici per descrivere il contatto col terreno.' },
    { term: 'regolata', suggestion: 'piazzata', reason: 'In campo si usa solitamente il termine "piazzare".' },
    { term: 'fresca', suggestion: 'in rough alto / erba alta', reason: 'Descrivi la condizione dell\'erba.' }
  ],
  en: [
    { term: 'screwed', suggestion: 'embedded / unplayable', reason: 'Use technical terms like embedded or unplayable.' },
    { term: 'fried', suggestion: 'plugged / buried', reason: 'Use "embedded" or "plugged" for ball in sand.' },
    { term: 'shanked', suggestion: 'socket / hosel rocket', reason: 'Ensure spelling is correct or specify outcome.' }
  ],
  fr: [], de: [], es: []
};

export const TRANSLATIONS = {
  it: {
    welcome: 'Benvenuto in **GolfRules AI**. Inserisci la tua situazione (es. "palla nel bunker") o scatta una foto per ricevere assistenza immediata.',
    inputPlaceholder: 'Domanda (es. Palla in acqua...)',
    inputPlaceholderImage: 'Aggiungi dettagli...',
    offlineMode: 'Offline',
    onlineMode: 'Online',
    history: 'Storico',
    glossary: 'Glossario',
    localRules: 'Regole Locali',
    localRulesPlaceholder: 'Inserisci qui le regole locali del campo o selezionale dalla lista...',
    country: 'Paese',
    selectCountry: 'Seleziona Paese',
    selectCourse: 'Seleziona Campo',
    club: 'Golf Club',
    clubPlaceholder: 'Cerca o scrivi nome del Club',
    save: 'Salva',
    searchGlossary: 'Cerca termine...',
    noHistory: 'Nessuna consultazione recente.',
    noGlossary: 'Nessun termine trovato.',
    errorGeneric: 'Si è verificato un errore imprevisto. Riprova.',
    errorOfflineImage: 'L\'analisi delle immagini richiede una connessione internet. Connettiti e riprova.',
    offlineResult: 'Risultato database locale',
    camera: 'Scatta foto',
    deleteMessage: 'Elimina messaggio',
    generatingDiagram: 'Generazione schema...',
    commonRules: 'Regole Comuni (Tocca per aggiungere)',
    add: 'Aggiungi',
    scanRules: 'Scatta Foto',
    uploadPhoto: 'Carica Foto',
    transcribing: 'Trascrizione in corso...',
    errorTranscription: 'Impossibile trascrivere l\'immagine.',
    wherePlaying: 'Dove stai giocando?',
    useGPS: 'Usa GPS',
    locating: 'Localizzazione...',
    locationError: 'Impossibile rilevare la posizione.',
    locationFound: 'Campo trovato:',
    multipleCoursesFound: 'Campi trovati:',
    golfCart: 'Utilizzo del Golf Cart',
    golfCartQuery: 'Quali sono le regole per l\'utilizzo del Golf Cart in questo campo?',
    golfCartQueryHoleByHole: 'Quali sono le regole di utilizzo del golf cart buca per buca?',
    golfCartPlaceholder: 'Inserisci qui le regole specifiche per l\'uso del Golf Cart (percorsi obbligatori, 90 gradi, ecc.)...',
    lastUpdated: 'Inserite il:',
    viewCommonRules: 'Regole Principali',
    commonCartRulesTitle: 'Regole Utilizzo Cart',
    downloadDb: 'Scarica SQL',
    downloadFirestore: 'Scarica Firestore',
    downloadDeployGuide: 'Guida Deploy',
    infoTitle: 'Consigli per la ricerca',
    infoText: '**Configurazione Campo:**\nPer ottenere una risposta precisa, seleziona sempre l\'**Area del campo** e il **Lie** utilizzando i menu a tendina in basso.\n\n---\n\n**Ricerca con Foto:**\nSe scatti una foto, seleziona sempre la **zona del campo**, **lie di palla** e completa la richiesta con un **testo descrittivo** per aiutare l\'AI a capire meglio il contesto.\n\n---\n\n**Terminologia:**\nTi chiediamo di formulare le domande utilizzando termini chiari e tecnici. Evita espressioni colloquiali (es. "impicciata"), preferendo termini standard come "incastrata".',
    infoIconStatusTitle: 'Stato delle icone',
    infoIconStatusRed: 'Campo non selezionato',
    infoIconStatusYellow: 'Campo selezionato (Regole mancanti)',
    infoIconStatusGreen: 'Regole Locali e Regolamento Cart caricati',
    etiquetteTitle: 'Etichetta del Golf',
    etiquetteText: 'Principi fondamentali dell’etichetta nel golf\n\n**Sicurezza:** non colpire finché gli altri non sono fuori portata; avvisare con “Fore!” se la palla rischia di colpire qualcuno.\n\n**Rispetto per gli altri:** mantenere silenzio e non muoversi durante il colpo altrui; evitare distrazioni.\n\n**Velocità di gioco:** essere pronti a giocare, non ritardare inutilmente, lasciare il green subito dopo aver completato la buca.\n\n**Cura del campo:** riparare pitch mark e divot, livellare i bunker, non danneggiare il terreno con colpi di prova.\n\n**Comportamento generale:** mostrare rispetto per arbitri, avversari e compagni di gioco; mantenere un atteggiamento sportivo.',
    terminologyWarningTitle: 'Termine poco chiaro rilevato',
    terminologyWarningText: 'Hai usato "{term}". Per una risposta più precisa, il regolamento suggerisce di usare "{suggestion}".',
    terminologyWarningQuestion: 'Vuoi modificare la domanda?',
    editQuestion: 'Modifica',
    sendAnyway: 'Invia comunque',
    selectClubWarning: 'Selezionate il Golf Club',
    clubDashboard: {
      title: 'Portale Golf Club',
      subtitle: 'Gestione Regolamenti',
      validityDate: 'Data di Validità',
      localRulesSection: 'Regole Locali',
      cartRulesSection: 'Regolamento Golf Cart',
      saveSuccess: 'Regole salvate con successo!',
      logout: 'Esci',
      clubName: 'Il tuo Golf Club',
      placeholderLocal: 'Inserisci il testo completo delle Regole Locali qui...',
      placeholderCart: 'Inserisci il regolamento per l\'uso dei Golf Cart qui...',
      footer: 'I dati salvati saranno immediatamente disponibili agli utenti.',
      coordinates: 'Coordinate GPS',
      latitude: 'Latitudine',
      longitude: 'Logitudine',
      detectLocation: 'Rileva Posizione',
      locationDetected: 'Posizione rilevata!'
    },
    clubProfile: {
      defaultCourse: 'Standard',
      sectionCharacteristics: 'Caratteristiche Campo',
      addCourse: 'Aggiungi',
      courseName: 'Nome',
      holesCount: 'Buche',
      startHole: 'Partenza',
      buvetteAfter: 'Buvette dopo buca',
      remove: 'Rimuovi'
    },
    context: {
      location: {
        General: 'Generale',
        Tee: 'Area di Partenza',
        Fairway: 'Fairway',
        Rough: 'Rough',
        Bunker: 'Bunker',
        PenaltyArea: 'Area Penalità',
        Green: 'Putting Green'
      },
      lie: {
        Standard: 'Lie Normale',
        Good: 'Buono / Tee up',
        Buried: 'Infossata (Uovo fritto)',
        Underwater: 'In acqua',
        Unplayable: 'Ingiocabile'
      }
    },
    landing: {
      subtitle: 'Il tuo Assistente Arbitrale Intelligente',
      rulesValidity: 'Edizione 2023 + Aggiornamenti',
      startRound: 'Consulta le regole',
      holeByHoleCart: 'UTILIZZO GOLF CART BUCA PER BUCA',
      configureLocalRules: 'Configura Regole Locali',
      loginGoogle: 'Accedi con Google',
      loginEmail: 'Accedi con Email',
      continueGuest: 'Continua come Ospite',
      accessClub: 'Accesso Golf Club',
      signOut: 'Esci',
      loggedInAs: 'Connesso come',
      welcomeUser: 'Benvenuto',
      email: 'Email',
      password: 'Password',
      login: 'Accedi',
      register: 'Registrati',
      noAccount: 'Non hai un account?',
      haveAccount: 'Hai già un account?',
      back: 'Indietro',
      demoVersion: 'Accedi in Versione Demo',
      errorLogin: 'Errore di accesso. Controlla le credenziali.',
      errorRegister: 'Errore di registrazione. Email non valida o già in uso.',
      setupAdvice: "All'arrivo al Golf Club, prima di iniziare il tuo giro ti suggeriamo di impostare dove stai giocando, se non sono disponibili chiedile in segreteria e carica le Regole Locali e, se noleggi il Golf Cart, le Regole di Utilizzo e comportamento locali.",
      features: {
        ai: 'Analisi AI Avanzata',
        voice: 'Comandi Vocali',
        offline: 'Supporto Offline',
        rules: 'Regole Ufficiali & Locali'
      },
      featureDesc: {
        ai: 'Ottieni risposte istantanee basate sulla tua posizione e condizione della palla.',
        voice: 'Fai domande a mani libere mentre giochi, proprio come con un Marshall.',
        offline: 'Accedi alle regole fondamentali ovunque, anche senza segnale.',
        rules: 'Database completo delle normative ufficiali USGA/R&A.'
      }
    },
    playTrack: {
      title: 'Privacy & Tracking',
      accept: 'Accetta e Attiva',
      deny: 'Nega Consenso',
      content: `**1. Raccolta della posizione**
L’app GolfRules AI può raccogliere la tua posizione GPS anche quando non stai utilizzando attivamente l’app. Questa funzione serve esclusivamente a collocarti sul campo da golf per monitorare le tempistiche di gioco.

**2. Consenso esplicito**
Prima di attivare il tracking in background, ti verrà chiesto di concedere il permesso “Sempre” per la geolocalizzazione. Senza il tuo consenso, la posizione non verrà registrata né utilizzata.

**3. Finalità**
Migliorare l’esperienza di gioco fornendo regole e informazioni contestuali in tempo reale. Supportare il club nella gestione del campo e dei servizi.
Non utilizziamo la tua posizione per finalità di marketing o pubblicità.

**4. Condivisione dei dati**
La tua posizione non viene condivisa con altri membri o terzi senza il tuo consenso esplicito. I dati possono essere utilizzati dal club solo per scopi operativi e regolamentari.

**5. Disattivazione**
Puoi disattivare il tracking GPS in qualsiasi momento dalle impostazioni dell’app o del tuo dispositivo. La disattivazione non compromette l’uso delle altre funzionalità dell’app. Il tracciamento sarà comunque disattivato automaticamente dopo sei ore dall'attivazione.

**6. Sicurezza**
I dati di posizione vengono protetti con sistemi di crittografia e archiviati in modo sicuro. Manteniamo la conformità con le normative sulla privacy (GDPR e altre leggi applicabili).`
    }
  },
  en: {
    welcome: 'Welcome to **GolfRules AI**. Enter your situation (e.g. "ball in bunker") or take a photo for immediate assistance.',
    inputPlaceholder: 'Question (e.g. Ball in water...)',
    inputPlaceholderImage: 'Add details...',
    offlineMode: 'Offline',
    onlineMode: 'Online',
    history: 'History',
    glossary: 'Glossary',
    localRules: 'Local Rules',
    localRulesPlaceholder: 'Enter course local rules here or select from the list...',
    country: 'Country',
    selectCountry: 'Select Country',
    selectCourse: 'Select Course',
    club: 'Golf Club',
    clubPlaceholder: 'Search or type Club Name',
    save: 'Save',
    searchGlossary: 'Search term...',
    noHistory: 'No recent consultations.',
    noGlossary: 'No terms found.',
    errorGeneric: 'An unexpected error occurred. Please try again.',
    errorOfflineImage: 'Image analysis requires an internet connection. Please connect and try again.',
    offlineResult: 'Local database result',
    camera: 'Take photo',
    deleteMessage: 'Delete message',
    generatingDiagram: 'Generating diagram...',
    commonRules: 'Common Rules (Tap to add)',
    add: 'Add',
    scanRules: 'Take Photo',
    uploadPhoto: 'Upload Photo',
    transcribing: 'Transcribing...',
    errorTranscription: 'Could not transcribe image.',
    wherePlaying: 'Where are you playing?',
    useGPS: 'Use GPS',
    locating: 'Locating...',
    locationError: 'Could not detect location.',
    locationFound: 'Course found:',
    multipleCoursesFound: 'Courses found:',
    golfCart: 'Golf Cart Usage',
    golfCartQuery: 'What are the rules for Golf Cart usage on this course?',
    golfCartQueryHoleByHole: 'What are the hole-by-hole golf cart usage rules?',
    golfCartPlaceholder: 'Enter specific rules for Golf Cart usage here (cart paths only, 90 degrees, etc.)...',
    lastUpdated: 'Inserted on:',
    viewCommonRules: 'Main Rules',
    commonCartRulesTitle: 'Cart Usage Rules',
    downloadDb: 'Download SQL',
    downloadFirestore: 'Download Firestore',
    downloadDeployGuide: 'Deploy Guide',
    infoTitle: 'Search Tips',
    infoText: '**Course Configuration:**\nTo get a correct answer, please select the **Course Area** and the **Ball Lie** from the menus below.\n\n---\n\n**Photo Search:**\nIf you take a photo, make sure to always select the **Course Area**, **Lie**, and complete the request by adding **descriptive text** to help the AI better understand the context.\n\n---\n\n**Terminology:**\nPlease phrase questions using clear and technical terms. Avoid slang (e.g. "screwed"), instead prefer standard terms like "embedded".',
    infoIconStatusTitle: 'Icon Status',
    infoIconStatusRed: 'Course not selected',
    infoIconStatusYellow: 'Course selected (Missing rules)',
    infoIconStatusGreen: 'Rules and Cart loaded',
    etiquetteTitle: 'Golf Etiquette',
    etiquetteText: 'Fundamental Principles of Golf Etiquette\n\n**Safety:** Do not hit until others are out of range; shout “Fore!” if the ball risks hitting someone.\n\n**Respect for others:** Keep quiet and do not move during others\' strokes; avoid distractions.\n\n**Pace of Play:** Be ready to play, do not delay unnecessarily, leave the green immediately after completing the hole.\n\n**Course Care:** Repair pitch marks and divots, smooth bunkers, do not damage turf with practice swings.\n\n**General Behavior:** Show respect for referees, opponents, and playing partners; maintain sportsmanship.',
    terminologyWarningTitle: 'Unclear term detected',
    terminologyWarningText: 'You used "{term}". For a more precise answer, the rules suggest using "{suggestion}".',
    terminologyWarningQuestion: 'Do you want to edit your question?',
    editQuestion: 'Edit',
    sendAnyway: 'Send Anyway',
    selectClubWarning: 'Please select a Golf Club',
    clubDashboard: {
      title: 'Golf Club Portal',
      subtitle: 'Regulations Management',
      validityDate: 'Validity Date',
      localRulesSection: 'Local Rules',
      cartRulesSection: 'Golf Cart Regulations',
      saveSuccess: 'Rules saved successfully!',
      logout: 'Logout',
      clubName: 'Your Golf Club',
      placeholderLocal: 'Enter the full text of Local Rules here...',
      placeholderCart: 'Enter the Golf Cart usage regulations here...',
      footer: 'Saved data will be immediately available to users.',
      coordinates: 'GPS Coordinates',
      latitude: 'Latitude',
      longitude: 'Longitude',
      detectLocation: 'Detect Location',
      locationDetected: 'Location detected!'
    },
    clubProfile: {
      defaultCourse: 'Standard',
      sectionCharacteristics: 'Course Characteristics',
      addCourse: 'Add',
      courseName: 'Name',
      holesCount: 'Holes',
      startHole: 'Start',
      buvetteAfter: 'Buvette After',
      remove: 'Remove'
    },
    context: {
      location: {
        General: 'General',
        Tee: 'Teeing Area',
        Fairway: 'Fairway',
        Rough: 'Rough',
        Bunker: 'Bunker',
        PenaltyArea: 'Penalty Area',
        Green: 'Putting Green'
      },
      lie: {
        Standard: 'Standard Lie',
        Good: 'Good / Teed up',
        Buried: 'Buried (Fried Egg)',
        Underwater: 'Underwater',
        Unplayable: 'Unplayable'
      }
    },
    landing: {
      subtitle: 'Your Intelligent Referee Assistant',
      rulesValidity: '2023 Edition + Updates',
      startRound: 'Consult Rules',
      holeByHoleCart: 'HOLE BY HOLE CART USAGE',
      configureLocalRules: 'Configure Local Rules',
      loginGoogle: 'Login with Google',
      loginEmail: 'Login with Email',
      continueAsGuest: 'Continue as Guest',
      accessClub: 'Golf Club Access',
      signOut: 'Sign Out',
      loggedInAs: 'Logged in as',
      welcomeUser: 'Welcome',
      email: 'Email',
      password: 'Password',
      login: 'Login',
      register: 'Register',
      noAccount: 'Don\'t have an account?',
      haveAccount: 'Already have an account?',
      back: 'Back',
      demoVersion: 'Access Demo Version',
      errorLogin: 'Login error. Check your credentials.',
      errorRegister: 'Registration error. Invalid email or already in use.',
      setupAdvice: "Upon arrival at the Golf Club, before starting your round, we suggest you set where you are playing, and if you haven't already, upload the local rules and Golf Cart usage rules.",
      features: {
        ai: 'Advanced AI Analysis',
        voice: 'Voice Commands',
        offline: 'Offline Support',
        rules: 'Official & Local Rules'
      },
      featureDesc: {
        ai: 'Get instant answers based on your lie and location.',
        voice: 'Ask questions hands-free while playing, just like with a Marshall.',
        offline: 'Access core rules anywhere, even without signal.',
        rules: 'Full database of official USGA/R&A.'
      }
    },
    playTrack: {
      title: 'Privacy & Tracking',
      accept: 'Accept and Enable',
      deny: 'Deny Consent',
      content: `**1. Location Collection**
The GolfRules AI app may collect your GPS location even when you are not actively using the app. This feature is used solely to place you on the golf course to monitor pace of play.

**2. Explicit Consent**
Before enabling background tracking, you will be asked to grant "Always" permission for geolocation. Without your consent, location will not be recorded or used.

**3. Purpose**
To improve the gaming experience by providing real-time contextual rules and information. To support the club in managing the course and services.
We do not use your location for marketing or advertising purposes.

**4. Data Sharing**
Your location is not shared with other members or third parties without your explicit consent. Data may be used by the club only for operational and regulatory purposes.

**5. Deactivation**
You can disable GPS tracking at any time from the app or your device settings. Deactivation does not compromise the use of other app features. Tracking will be automatically disabled after six hours of activation.

**6. Security**
Location data is protected with encryption systems and stored securely. We maintain compliance with privacy regulations (GDPR and other applicable laws).`
    }
  }
};

// Database locale simulato (Offline Mode) - Omitted for brevity ma mantenuto
export const OFFLINE_RULES: Record<Language, GolfRule[]> = {
  it: [], en: [], fr: [], de: [], es: []
};
export const COMMON_LOCAL_RULES = { it: [], en: [], fr: [], de: [], es: [] };
export const COMMON_GOLF_CART_RULES = { it: [], en: [], fr: [], de: [], es: [] };
export const GOLF_GLOSSARY: Record<Language, {term: string, definition: string}[]> = { it: [], en: [], fr: [], de: [], es: [] };
export const COUNTRIES = ["Italy", "United States", "United Kingdom"];
export const GOLF_COURSES: Record<string, string[]> = { "Italy": ["Golf Club La Pinetina", "Golf Club Milano"] };