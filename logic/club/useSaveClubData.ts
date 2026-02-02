import { UserProfile, LocalRulesData } from '../../types';
import { saveClubData } from '../../services/firebase';

interface UseSaveClubDataProps {
  user: UserProfile | null;
  setLocalRulesData: (data: LocalRulesData | null) => void;
}

export const useSaveClubData = ({ user, setLocalRulesData }: UseSaveClubDataProps) => {
  const handleSaveClubData = async (data: LocalRulesData) => {
    const clubId = user?.homeClubId || 'club_pinetina';
    try {
      await saveClubData(clubId, data);
      setLocalRulesData(data);
    } catch (e) {
      console.error("Save error:", e);
      alert("Errore durante il salvataggio dei dati.");
    }
  };

  return { handleSaveClubData };
};
