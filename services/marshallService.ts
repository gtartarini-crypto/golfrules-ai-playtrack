import { doc, setDoc, onSnapshot, query, collection, where, serverTimestamp } from 'firebase/firestore';
import { dbData } from './firebase';

/**
 * Updates the Marshall's position in the shared collection
 */
export const updateMarshallPosition = async (userId: string, name: string, clubId: string, lat: number, lng: number) => {
  if (!dbData || !userId || !clubId) return;
  const docId = `marshall_${userId}`;
  const marshallRef = doc(dbData, "marshall_positions", docId);

  try {
    await setDoc(marshallRef, {
      userId,
      name, // REQUISITO: Salva il nome reale
      clubId,
      lat,
      lng,
      lastUpdate: serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.error("[MarshallService] Error updating position:", e);
  }
};

/**
 * Subscribes to all active Marshall positions for a specific club
 */
export const subscribeMarshallPositions = (clubId: string, callback: (marshalls: any[]) => void) => {
  if (!dbData || !clubId) return () => {};

  const q = query(
    collection(dbData, "marshall_positions"),
    where("clubId", "==", clubId)
  );

  return onSnapshot(q, (snapshot) => {
    const marshalls = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(marshalls);
  });
};