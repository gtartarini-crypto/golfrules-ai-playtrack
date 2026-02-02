export type Language = 'it' | 'en' | 'fr' | 'de' | 'es';
export type UserRole = 'player' | 'club_admin' | 'sys_admin' | 'marshall' | 'greenkeeper' | 'grounds_worker';
export type StaffRole = 'golf_club_admin' | 'greenkeeper' | 'grounds_worker' | 'marshall' | 'supervisor';
export type PlayerStatus = 'playing' | 'paused' | 'finished' | 'completed';

// 🔹 PlayTrack: livelli di abbonamento
export type PlayTrackSubscriptionTier = 'base' | 'premium' | 'advanced';

// 🔹 PlayTrack: stato dell’abbonamento
export type PlayTrackSubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing';

/* Export missing types for legacy dashboard compatibility */
export type SubscriptionTier = PlayTrackSubscriptionTier;
export type SubscriptionStatus = PlayTrackSubscriptionStatus;

export type ShiftStatus = 'clocked_out' | 'clocked_in' | 'on_break';

// 🔹 Modello completo di abbonamento PlayTrack a livello di club
export interface PlayTrackSubscription {
  tier: PlayTrackSubscriptionTier;
  status: PlayTrackSubscriptionStatus;
  expiryDate: string;      // ISO string serializzata da Timestamp
  startDate?: string;      // opzionale
  stripeSubscriptionId?: string;
  features?: string[];     // es: ['realtime_gps', 'staff_management', 'ai_projections', 'pace_analytics']
  maxStaffMembers?: number;
  maxActiveFlights?: number;
}

// Se vuoi tipizzare meglio i club, puoi usare questa interfaccia come base
export interface ClubData {
  subscription?: PlayTrackSubscription;
}

// Added 'flight_setup' to AppView to resolve type mismatch in router/renderMainView.tsx
// Fixed missing pipe '|' after 'staff_home_mobile'
export type AppView =
  'landing' |
  'auth' |
  'qr_scanner' |
  'flight_setup' |
  'privacy_consent' |
  'player_home' |
  'staff_home_mobile' |
  'super_admin_dashboard' |
  'debug_dashboard' |
  'club_menu' |
  'club_profile' |
  'club_dashboard' |
  'qr_management' |
  'course_setup' |
  'monitor_setup' |
  'player_monitor' |
  'team_management' |
  'rules_assistant' |
  'pace_of_play' |
  'statistics' |
  'statistics_of_round' |
  'admin_staff_workers' |
  'admin_staff_create' |
  'admin_staff_editor' |
  'worker_timeclock' |
  'worker_profile' |
  'gk_workers_list' |
  'gk_worker_create' |
  'gk_worker_editor' |
  'gk_timeclock' |
  'gk_worker_profile' |
  'gk_export' |
  'gk_chat' |
  'admin_greenkeeping_workers' |
  'admin_greenkeeping_worker_create' |
  'admin_greenkeeping_worker_edit' |
  'admin_greenkeeping_worker_profile' |
  'admin_greenkeeping_timeclock' |
  'admin_greenkeeping_timeclock_export' |
  'pace_analytics' |
  'pace_analytics_history';

export interface StaffWorker {
  uid: string;
  clubId: string;
  role: StaffRole;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  password?: string;
  dateOfBirth?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  mobile: string;
  niNumber?: string;
  notes?: string;
  medicalInfo?: string;
  disabled: boolean;
  active: boolean;
  shiftStatus: ShiftStatus;
  lastClockIn?: any;
  lastClockOut?: any;
  createdAt: any;
  updatedAt: any;
  isClubAdminBypass?: boolean;
  // Added createdBy to fix error in WorkerCreateScreen
  createdBy?: string | null;
}

export interface TimeclockEntry {
  id: string;
  type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end';
  timestamp: any;
  location?: { lat: number, lng: number };
  entryId?: string;
}

// Added 'course' property to LocalRulesData to fix property access errors in firebase.ts and loadEntities.ts
export interface LocalRulesData {
  // 🔹 Campi principali del club (dal documento "clubs/{clubId}")
  club: string;
  name?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  facilities?: any[];
  subCourses?: any[];
  monitorSettings?: any;
  paceOfPlayConfigs?: Record<string, Record<number, number>>;
  adminEmail?: string;
  validityDate?: string;
  allowExtendedTracking?: boolean;
  hasClubLinkTeeTime?: boolean;
  // Added cartRule90Degree to fix property access error in components/user/HoleByHoleCartView.tsx
  cartRule90Degree?: boolean;
  ballPlacement?: boolean; // 🟢 NUOVA REGOLA

  // 🔹 Testi lunghi (ora in subcollection)
  local_rules: string;          // clubs/{clubId}/local_rules/default.text
  localRulesUpdatedAt?: string;

  golfCartRules: string;        // clubs/{clubId}/golf_cart_rules/default.text
  golfCartRulesUpdatedAt?: string;

  // 🔹 Layout e geofences (subcollection "course")
  course?: Record<string, any>;

  // 🔹 Campi legacy mantenuti per compatibilità
  layouts?: Record<string, any>;
  location?: any;

  // 🔹 Modello PlayTrack definitivo
  subscription?: PlayTrackSubscription;

  updated_at?: any;
  courseLayout?: any;
  qrCodes?: Record<string, string>;
}


export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  role?: UserRole;
  homeClubId?: string | null;
  subscription?: any;
  roundStatus?: 'not_started' | 'started' | 'closing';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: number;
  generatedImage?: string;
}

export interface GameContext {
  location: string;
  lie: string;
}

export interface GeoEntity<T = any> {
  id: string;
  type: string;
  location?: { lat: number, lng: number };
  path?: { lat: number, lng: number }[];
  metadata?: T & { holeNumber?: number; createdAt?: string };
}

export interface MonitorSettings {
  showPlayers: boolean;
  showPlayerNames: boolean;
  showMarshals: boolean;
  showHoleNumbers: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'editor' | 'viewer';
  lastActive: string;
  playTrackEnabled: boolean;
  isTempEmail?: boolean;
}

export interface IdentifiedCourse {
  club: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface HistoryItem {
  id: string;
  query: string;
  timestamp: number;
}

export interface GolfCourseSub {
  id: string;
  name: string;
  holesCount: number;
  startHole: number;
  buvetteAfterHole?: number;
  status?: 'active' | 'inactive';
}

export interface GolfRule {
  id: string;
  title: string;
  description: string;
  keywords: string[];
}

export interface HoleDetail {
  number: number;
  par: number;
  length: number;
}

export interface Course {
  courseId: string;
  name: string;
  clubId: string;
  holesCount: number;
  status?: string;
}

export interface PaceSettings {
  warningThreshold: number;
  alertThreshold: number;
  autoNotifyPlayer: boolean;
  autoNotifyMarshall: boolean;
  enableAudioAlerts: boolean;
}

// Support Chat Types
export interface SupportMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderRole: 'player' | 'staff';
  timestamp: any;
}

export interface SupportThread {
  id: string; // flightId
  clubId: string;
  playerName: string;
  lastMessage: string;
  updatedAt: any;
  unreadCountStaff: number;
  unreadCountPlayer: number;
  status: 'active' | 'archived';
}