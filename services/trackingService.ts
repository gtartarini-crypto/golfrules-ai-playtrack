import { 
  doc, 
  setDoc, 
  updateDoc,
  serverTimestamp, 
  GeoPoint 
} from "firebase/firestore";
import { dbData } from "./firebase";
import { isPointInPolygon } from "./dataUtils";
import { GeoEntity } from "../types";
import { getCourseLayout } from "./layoutService";

/* -------------------------------------------------------------------------- */
/*  TYPES                                                                     */
/* -------------------------------------------------------------------------- */

export interface TrackingData {
  playerId?: string;
  playerName: string;
  flightId: string;
  sessionCode?: string;
  clubId: string;
  courseId?: string;
  appSource?: string;
}

/* -------------------------------------------------------------------------- */
/*  NORMALIZATION                                                             */
/* -------------------------------------------------------------------------- */

export function normalizeClubId(raw: string): string {
  if (!raw) return "";
  const str = raw.trim();
  try {
    if (str.startsWith("playtrack://")) {
      const url = new URL(str.replace("playtrack://", "https://link.internal/"));
      return url.searchParams.get("clubId") || str;
    }
    if (str.startsWith("http")) {
      const url = new URL(str);
      return url.searchParams.get("clubId") || url.searchParams.get("id") || str;
    }
    return str;
  } catch {
    return str;
  }
}

/* -------------------------------------------------------------------------- */
/*  JOIN OR CREATE                                                            */
/* -------------------------------------------------------------------------- */

export async function joinOrCreateFlight(
  clubId: string,
  courseId: string,
  playerId: string,
  playerName: string,
  sessionCode: string
) {
  try {
    const cleanClubId = normalizeClubId(clubId);

    const response = await fetch(
      "https://joinorcreate-xahiqesouq-uc.a.run.app",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubId: cleanClubId,
          courseId,
          playerId,
          playerName,
          sessionCode
        })
      }
    );

    if (!response.ok) throw new Error("JoinOrCreate failed");

    const data = await response.json();

    return {
      flightId: data.flightId,
      sessionCode: data.sessionCode,
      clubId: data.clubId,
      isNewFlight: data.isNewFlight,
      player: data.player,
      players: data.players,
      flight: data.flight
    };
  } catch (err) {
    console.error("[Tracking] joinOrCreate error:", err);
    throw err;
  }
}

/* -------------------------------------------------------------------------- */
/*  GEOFENCING                                                                */
/* -------------------------------------------------------------------------- */

export const identifyPlayerArea = (
  lat: number,
  lng: number,
  geofences: GeoEntity<any>[]
): { areaName: string; holeNumber?: number; isTee?: boolean } => {
  const point = { lat, lng };
  const priority = ["green", "tee", "area_buca", "dr", "pg", "pp", "oob"];

  for (const type of priority) {
    const match = geofences.find(
      (ent) => ent.type === type && ent.path && isPointInPolygon(point, ent.path)
    );

    if (match) {
      const hole = match.metadata?.holeNumber;
      return {
        areaName: hole ? `${type.toUpperCase()} ${hole}` : type.toUpperCase(),
        holeNumber: hole,
        isTee: type === "tee"
      };
    }
  }

  return { areaName: "Outside Areas" };
};

/* -------------------------------------------------------------------------- */
/*  SYNC PLAYER POSITION (VERSIONE PASSIVA)                                   */
/* -------------------------------------------------------------------------- */

export const syncPlayerPosition = async (
  lat: number,
  lng: number,
  data: TrackingData,
  gpsExtra?: { accuracy: number; heading: number | null; speed: number | null }
) => {
  if (!data.flightId || !data.clubId || !dbData) return "Error";

  const cleanClubId = normalizeClubId(data.clubId);

  try {
    const flightRef = doc(dbData, "active_flights", data.flightId);

    const { geofences } = await getCourseLayout(cleanClubId, data.courseId || 'default');
    const { areaName, holeNumber } = identifyPlayerArea(lat, lng, geofences);

    // 🔥 TELEMETRIA PASSIVA: nessun "status: active"
    const payload: any = {
      location: new GeoPoint(lat, lng),
      currentArea: areaName,
      accuracy: gpsExtra?.accuracy || 0,
      heading: gpsExtra?.heading || 0,
      speed: gpsExtra?.speed || 0,
      updatedAt: serverTimestamp(),
      clubId: cleanClubId,
      playerName: data.playerName
    };

    if (holeNumber) {
      payload.currentHole = holeNumber;
    }

    await setDoc(flightRef, payload, { merge: true });
    return areaName;
  } catch (error) {
    console.error("[Tracking] Passive Sync error:", error);
    return "Sync Error";
  }
};

/* -------------------------------------------------------------------------- */
/*  END TRACKING                                                              */
/* -------------------------------------------------------------------------- */

export const endPlayerTracking = async (flightId: string) => {
  if (!dbData || !flightId) return false;

  try {
    const flightRef = doc(dbData, "active_flights", flightId);

    console.log(`[Tracking] Finalizing flight ${flightId} in database...`);

    // 🔥 Usiamo updateDoc per essere certi di agire su un documento esistente
    await updateDoc(flightRef, {
      status: "completed",
      roundEndTime: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log(`[Tracking] Flight ${flightId} marked as completed.`);
    localStorage.removeItem("playtrack_active_flight");
    return true;
  } catch (e) {
    console.error("[Tracking] End error for flightId:", flightId, e);
    throw e;
  }
};