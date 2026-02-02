import { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../../types';
import { syncPlayerPosition } from '../../services/trackingService';
import { BackgroundLocation } from '../../plugins/background-location';

interface UseGPSProps {
  user: UserProfile | null;
  activeFlightId: string | null;
  activeSessionCode: string | null;
  activeCourseId: string | null;
  roundStatus: 'not_started' | 'started' | 'closing';
}

export const useGPS = ({
  user,
  activeFlightId,
  activeSessionCode,
  activeCourseId,
  roundStatus
}: UseGPSProps) => {

  const [syncStatusLog, setSyncStatusLog] = useState("Initializing...");

  const lastSyncRef = useRef(0);
  const isRunningRef = useRef(false);

  // REF sincronizzati
  const userRef = useRef<UserProfile | null>(user);
  const flightIdRef = useRef<string | null>(activeFlightId);
  const sessionCodeRef = useRef<string | null>(activeSessionCode);
  const courseIdRef = useRef<string | null>(activeCourseId);
  const roundStatusRef = useRef(roundStatus);

  useEffect(() => {
    userRef.current = user;
    flightIdRef.current = activeFlightId;
    sessionCodeRef.current = activeSessionCode;
    courseIdRef.current = activeCourseId;
    roundStatusRef.current = roundStatus;

    console.log("[GPS DEBUG] Updated refs:", {
      user: userRef.current,
      flightId: flightIdRef.current,
      sessionCode: sessionCodeRef.current,
      courseId: courseIdRef.current,
      roundStatus: roundStatusRef.current
    });
  }, [user, activeFlightId, activeSessionCode, activeCourseId, roundStatus]);

  // LISTENER NATIVO
  useEffect(() => {
    console.log("[GPS DEBUG] Registering location listener");

    const listener = BackgroundLocation.addListener("location", async (data: any) => {
      const { lat, lng } = data;

      console.log("[GPS EVENT RAW]", data);
      console.log("[GPS EVENT]", lat, lng);

      setSyncStatusLog(`GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)} Sync: OK`);

      const now = Date.now();
      if (now - lastSyncRef.current < 10000) return;
      lastSyncRef.current = now;

      if (roundStatusRef.current !== "started" || !flightIdRef.current) {
        console.log("[GPS DEBUG] Ignored event (round not started)");
        return;
      }

      syncPlayerPosition(
        lat,
        lng,
        {
          playerId: userRef.current?.uid || "unknown",
          playerName: userRef.current?.displayName || userRef.current?.email || "Guest Player",
          flightId: flightIdRef.current!,
          sessionCode: sessionCodeRef.current || "",
          clubId: userRef.current?.homeClubId || "club_pinetina",
          courseId: courseIdRef.current || "default"
        },
        {}
      ).catch((err) => console.error("Position Sync failure", err));
    });

    return () => {
      console.log("[GPS DEBUG] Removing listener");
      listener.remove();
    };
  }, []);

  // START/STOP DEL SERVIZIO
  useEffect(() => {
    const shouldStart =
      !!flightIdRef.current &&
      roundStatusRef.current === "started";

    console.log("[GPS DEBUG] Trigger start/stop effect", {
      activeFlightId,
      roundStatus,
      shouldStart,
      isRunning: isRunningRef.current
    });

    if (shouldStart && !isRunningRef.current) {
      console.log("[PlayTrack] Background GPS START (robust)");
      BackgroundLocation.start();
      isRunningRef.current = true;
    }

    if (!shouldStart && isRunningRef.current) {
      console.log("[PlayTrack] Background GPS STOP (robust)");
      BackgroundLocation.stop();
      isRunningRef.current = false;
      setSyncStatusLog("Tracking stopped.");
    }

  }, [activeFlightId, roundStatus]);

  return { syncStatusLog };
};
