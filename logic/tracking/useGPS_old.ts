import { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../../types';
import { syncPlayerPosition } from '../../services/trackingService';

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
  const [syncStatusLog, setSyncStatusLog] = useState<string>("Initializing...");
  const [lastSync, setLastSync] = useState(0);
  const gpsWatchRef = useRef<number | null>(null);

  // 🔥 REF SINCRONI: Vitali per bloccare thread residui del browser
  const flightIdRef = useRef(activeFlightId);
  const roundStatusRef = useRef(roundStatus);

  useEffect(() => {
    flightIdRef.current = activeFlightId;
    roundStatusRef.current = roundStatus;
  }, [activeFlightId, roundStatus]);

  const startTracking = () => {
    if (gpsWatchRef.current !== null) return;

    console.log("[PlayTrack] GPS Engine: Started");

    const triggerSync = (pos: GeolocationPosition) => {
      // 🔥 GUARDIA SINCRONA IMMEDIATA
      // Se lo stato non è più 'started', scarta la posizione PRIMA di toccare il DB
      if (roundStatusRef.current !== "started" || !flightIdRef.current) {
        console.warn("[PlayTrack] GPS PING BLOCKED: Round is already closing/closed.");
        return;
      }

      const { latitude, longitude, accuracy, heading, speed } = pos.coords;

      setSyncStatusLog(
        `GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)} Sync: OK`
      );

      // Debounce temporale: 10 secondi
      const now = Date.now();
      if (now - lastSync < 10000) return;
      setLastSync(now);

      syncPlayerPosition(
        latitude,
        longitude,
        {
          playerId: user?.uid || "unknown",
          playerName: user?.displayName || user?.email || "Guest Player",
          flightId: flightIdRef.current!,
          sessionCode: activeSessionCode || "",
          clubId: user?.homeClubId || "club_pinetina",
          courseId: activeCourseId || "default"
        },
        { accuracy, heading, speed }
      ).catch((e) => console.error("Position Sync failure", e));
    };

    gpsWatchRef.current = navigator.geolocation.watchPosition(
      triggerSync,
      (err) => setSyncStatusLog(`GPS Error: ${err.message}`),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  };

  const stopTracking = () => {
    if (gpsWatchRef.current !== null) {
      console.log("[PlayTrack] GPS Engine: Stopped");
      navigator.geolocation.clearWatch(gpsWatchRef.current);
      gpsWatchRef.current = null;
      setSyncStatusLog("Tracking stopped.");
    }
  };

  useEffect(() => {
    if (activeFlightId && roundStatus === "started") {
      startTracking();
    } else {
      stopTracking();
    }
    return () => stopTracking();
  }, [activeFlightId, roundStatus]);

  return { syncStatusLog, startTracking, stopTracking };
};