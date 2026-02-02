import { useState, useEffect } from 'react';
import { UserProfile, StaffWorker, StaffRole } from '../types';
import { dbData } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const useStaffContext = (user: UserProfile | null) => {
  const [staffData, setStaffData] = useState<StaffWorker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStaffData = async () => {
      if (!user) {
        setStaffData(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      // 1. LOGICA DI BYPASS PER CLUB_ADMIN
      // Se l'utente ha il ruolo club_admin nel profilo utente (/users), 
      // viene trattato come golf_club_admin bypassando completamente /staff/{uid}
      if (user.role === 'club_admin') {
        // Fix: Added missing required properties (active, firstName, lastName, mobile) to satisfy StaffWorker type
        setStaffData({
          uid: user.uid,
          clubId: user.homeClubId || 'unknown',
          role: 'golf_club_admin' as StaffRole,
          displayName: user.displayName || 'Direttore Club',
          firstName: user.displayName?.split(' ')[0] || 'Direttore',
          lastName: user.displayName?.split(' ').slice(1).join(' ') || 'Club',
          mobile: '',
          active: true,
          email: user.email || '',
          disabled: false,
          shiftStatus: 'clocked_in', // Admin sempre "attivo"
          createdAt: new Date(),
          updatedAt: new Date(),
          isClubAdminBypass: true
        });
        setLoading(false);
        return;
      }

      // 2. LOGICA FALLBACK PER STAFF REGOLARE
      try {
        if (!dbData) throw new Error("Firestore non inizializzato");
        
        const staffRef = doc(dbData, 'staff', user.uid);
        const staffSnap = await getDoc(staffRef);

        if (staffSnap.exists()) {
          setStaffData(staffSnap.data() as StaffWorker);
        } else {
          // L'utente è loggato ma non è né club_admin né presente in staff
          setStaffData(null);
        }
      } catch (err: any) {
        console.error("[useStaffContext] Error:", err);
        setError(err.message);
        setStaffData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStaffData();
  }, [user]);

  return { 
    staffData, 
    loading, 
    error,
    isStaff: !!staffData,
    isClubAdmin: staffData?.role === 'golf_club_admin'
  };
};