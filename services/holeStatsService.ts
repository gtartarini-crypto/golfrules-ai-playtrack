import { collection, getDocs, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { dbData } from './firebase';

/**
 * Interfaccia per i dati statistici di una singola buca per un giocatore.
 */
export interface HoleStats {
  holeNumber: number;
  teeTimeSeconds: number;
  fairwayTimeSeconds: number;
  greenTimeSeconds: number;
  totalTimeSeconds: number;
  enterTeeTimestamp?: any;
  enterFairwayTimestamp?: any;
  enterGreenTimestamp?: any;
  exitHoleTimestamp?: any;
}

/**
 * Interfaccia per un giocatore con le sue statistiche aggregate.
 */
export interface PlayerWithStats {
  playerId: string;
  name: string;
  stats: HoleStats[];
}

/**
 * Legge le statistiche buca-per-buca di un giocatore specifico in un flight.
 * Restituisce un array di HoleStats ordinato per numero di buca.
 */
export const getPlayerHoleStats = async (flightId: string, playerId: string): Promise<HoleStats[]> => {
  if (!dbData) return [];

  try {
    const statsRef = collection(dbData, 'active_flights', flightId, 'players', playerId, 'hole_stats');
    const snap = await getDocs(statsRef);
    
    const stats: HoleStats[] = snap.docs.map(d => ({
      holeNumber: parseInt(d.id),
      ...d.data()
    } as HoleStats));

    // Ordinamento numerico per buca
    return stats.sort((a, b) => a.holeNumber - b.holeNumber);
  } catch (error) {
    console.error(`[HoleStatsService] Error getting stats for player ${playerId}:`, error);
    return [];
  }
};

/**
 * Attiva un listener in tempo reale sulle statistiche di un giocatore specifico.
 */
export const listenPlayerHoleStats = (
  flightId: string, 
  playerId: string, 
  callback: (stats: HoleStats[]) => void
) => {
  if (!dbData) return () => {};

  const statsRef = collection(dbData, 'active_flights', flightId, 'players', playerId, 'hole_stats');
  
  return onSnapshot(statsRef, (snap) => {
    const stats: HoleStats[] = snap.docs.map(d => ({
      holeNumber: parseInt(d.id),
      ...d.data()
    } as HoleStats));
    
    callback(stats.sort((a, b) => a.holeNumber - b.holeNumber));
  }, (error) => {
    console.error(`[HoleStatsService] Snapshot error for player ${playerId}:`, error);
  });
};

/**
 * Aggrega i dati di tutti i giocatori di un flight con le relative statistiche buca-per-buca.
 */
export const getFlightPlayersWithStats = async (flightId: string): Promise<PlayerWithStats[]> => {
  if (!dbData) return [];

  try {
    const playersRef = collection(dbData, 'active_flights', flightId, 'players');
    const playersSnap = await getDocs(playersRef);

    const playersWithStats = await Promise.all(
      playersSnap.docs.map(async (playerDoc) => {
        const playerData = playerDoc.data();
        const playerId = playerDoc.id;
        const stats = await getPlayerHoleStats(flightId, playerId);

        return {
          playerId,
          name: playerData.name || playerData.displayName || 'Unknown Player',
          stats
        } as PlayerWithStats;
      })
    );

    return playersWithStats;
  } catch (error) {
    console.error(`[HoleStatsService] Error aggregating flight stats for ${flightId}:`, error);
    return [];
  }
};
