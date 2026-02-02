// services/paceAnalyticsService.ts

import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp
} from "firebase/firestore";
import { dbData as db } from "./firebase";

/**
 * ANALYTICS GLOBALI DEL CLUB
 * (par3, par4, par5, gruppi in ritardo, buche critiche, ecc.)
 */
export async function fetchPaceAnalytics(clubId: string) {
  const startOfToday = Timestamp.fromDate(
    new Date(new Date().setHours(0, 0, 0, 0))
  );

  // 1. Recupera flight attivi
  const activeQ = query(
    collection(db, "active_flights"),
    where("clubId", "==", clubId),
    where("status", "==", "active")
  );

  // 2. Recupera flight completati oggi
  const completedQ = query(
    collection(db, "active_flights"),
    where("clubId", "==", clubId),
    where("status", "==", "completed"),
    where("roundStartTime", ">=", startOfToday)
  );

  const [activeSnap, completedSnap] = await Promise.all([
    getDocs(activeQ),
    getDocs(completedQ)
  ]);

  const flights = [...activeSnap.docs, ...completedSnap.docs];

  if (flights.length === 0) {
    return {
      par3: "--:--",
      par4: "--:--",
      par5: "--:--",
      delayAverage: 0,
      delayedGroups: 0,
      criticalHoles: [],
      groups: []
    };
  }

  let par3Times: number[] = [];
  let par4Times: number[] = [];
  let par5Times: number[] = [];

  let allDelays: number[] = [];
  let delayedGroups = 0;

  let criticalHolesMap: Record<number, number[]> = {};

  const groups: any[] = [];

  for (const flightDoc of flights) {
    const flight = flightDoc.data();
    const flightId = flightDoc.id;
    const courseId = flight.courseId;

    // 3. Recupera target pace
    const paceDocId = `${clubId}_${courseId}`;
    const paceRef = doc(db, "PaceOfPlay", paceDocId);
    const paceSnap = await getDoc(paceRef);
    const paceData = paceSnap.exists() ? paceSnap.data().holes : {};

    // 4. Recupera hole_stats del flight
    const holeStatsRef = collection(
      db,
      "active_flights",
      flightId,
      "hole_stats"
    );
    const holeStatsSnap = await getDocs(holeStatsRef);

    let groupTotalActual = 0;
    let groupTotalTarget = 0;

    for (const holeDoc of holeStatsSnap.docs) {
      const holeNumber = Number(holeDoc.id);
      const holeData = holeDoc.data();

      const actual = holeData.totalTimeSeconds ?? 0;
      const targetMinutes = paceData[String(holeNumber)] ?? 0;
      const target = targetMinutes * 60;

      groupTotalActual += actual;
      groupTotalTarget += target;

      // 5. Recupera PAR reale
      const parRef = doc(
        db,
        "courses",
        courseId,
        "holes",
        String(holeNumber)
      );
      const parSnap = await getDoc(parRef);
      const par = parSnap.exists() ? parSnap.data().par : null;

      if (par === 3) par3Times.push(actual);
      if (par === 4) par4Times.push(actual);
      if (par === 5) par5Times.push(actual);

      // 6. Buche critiche
      const delay = actual - target;
      if (!criticalHolesMap[holeNumber]) criticalHolesMap[holeNumber] = [];
      criticalHolesMap[holeNumber].push(delay);

      allDelays.push(delay);
    }

    // 7. Gruppi in ritardo
    const isDelayed = groupTotalActual > groupTotalTarget;
    if (isDelayed) delayedGroups++;

    groups.push({
      flightId,
      flightNumber: flight.flightNumber,
      delayMinutes: Math.round((groupTotalActual - groupTotalTarget) / 60),
      status: flight.status
    });
  }

  // Helpers
  const avg = (arr: number[]) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  const format = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // 8. Buche critiche ordinate
  const criticalHoles = Object.entries(criticalHolesMap)
    .map(([hole, delays]) => ({
      hole: Number(hole),
      delay: Math.round(avg(delays))
    }))
    .sort((a, b) => b.delay - a.delay);

  return {
    par3: format(Math.round(avg(par3Times))),
    par4: format(Math.round(avg(par4Times))),
    par5: format(Math.round(avg(par5Times))),
    delayAverage: Math.round(avg(allDelays) / 60),
    delayedGroups,
    criticalHoles,
    groups
  };
}

/**
 * 🔥 NUOVA FUNZIONE (Fase 2)
 * Lettura KPI aggregati del flight:
 * active_flights/{flightId}/aggregated/live
 */
export async function getAggregatedFlightStats(flightId: string) {
  if (!flightId) return { players: [] };

  const ref = doc(db, "active_flights", flightId, "aggregated", "live");
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return { players: [] };
  }

  const data = snap.data();

  return {
    players: data.players || []
  };
}
