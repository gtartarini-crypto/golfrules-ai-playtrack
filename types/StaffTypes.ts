

export type StaffRole = 'greenkeeper' | 'grounds_worker' | 'golf_club_admin';
export type ShiftStatus = 'clocked_out' | 'clocked_in' | 'on_break';

export interface WorkerData {
  uid: string;
  clubId: string;
  role: 'greenkeeper' | 'grounds_worker';
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  mobile: string;
  active: boolean;
  shiftStatus: ShiftStatus;
  createdAt: any;
  updatedAt: any;
  // Added fields to match usage in mobile form and resolve TypeScript errors
  dateOfBirth?: { seconds: number };
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  niNumber?: string;
  notes?: string;
  medicalInfo?: string;
}

export interface TimeclockEntry {
  id: string;
  // Use workerUid for consistency with service and other components
  workerUid: string;
  clubId: string;
  type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end';
  // Added punchedBy property to fix error in Export panel
  punchedBy: string;
  timestamp: any;
  location?: {
    lat: number;
    lng: number;
  } | null;
}