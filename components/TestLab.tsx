
import React, { useState } from "react";
import { Database, Play, RefreshCw, Flag, Trash2, Loader2 } from "lucide-react";
// Fixed: Imported dbData from services/firebase and modular SDK functions
import { dbData } from "../services/firebase";
import { collection, addDoc, doc, setDoc, getDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

export const TestLab: React.FC = () => {
  const [flightId, setFlightId] = useState<string>("");
  const [output, setOutput] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const TEST_PLAYER_ID = "test_user_123";
  const TEST_PLAYER_NAME = "Gian Test";
  const TEST_CLUB = "club_pinetina";
  const TEST_COURSE = "pinetina_18";

  // -------------------------------------------------------
  // 1) CREATE TEST FLIGHT
  // -------------------------------------------------------
  const createTestFlight = async () => {
    if (!dbData) return;
    setLoading(true);
    try {
      const ref = await addDoc(collection(dbData, "active_flights"), {
        clubId: TEST_CLUB,
        courseId: TEST_COURSE,
        status: "active",
        currentHole: 1,
        flightNumber: Math.floor(Math.random() * 900 + 100),
        createdAt: serverTimestamp(),
      });

      const newFlightId = ref.id;
      setFlightId(newFlightId);

      // Create player
      await setDoc(doc(dbData, "active_flights", newFlightId, "players", TEST_PLAYER_ID), {
          name: TEST_PLAYER_NAME,
          createdAt: serverTimestamp(),
      });

      setOutput({ ok: true, flightId: newFlightId });
    } catch (err) {
      setOutput({ error: String(err) });
    }
    setLoading(false);
  };

  // -------------------------------------------------------
  // 2) CALL JOIN OR CREATE HTTP FUNCTION
  // -------------------------------------------------------
  const callJoinOrCreate = async () => {
    setLoading(true);
    try {
      const url = "https://joinorcreate-kntz7bdpoq-uc.a.run.app";

      const payload = {
        clubId: TEST_CLUB,
        playerId: TEST_PLAYER_ID,
        playerName: TEST_PLAYER_NAME,
        sessionCode: `${TEST_CLUB}_20250120_tee1`,
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      setOutput(json);

      if (json.flightId) setFlightId(json.flightId);
    } catch (err) {
      setOutput({ error: String(err) });
    }
    setLoading(false);
  };

  // -------------------------------------------------------
  // 3) SIMULATE HOLE
  // -------------------------------------------------------
  const simulateHole = async (hole: number) => {
    if (!flightId || !dbData) return;

    setLoading(true);
    try {
      const stats: any = {
        teeTimeSeconds: Math.floor(Math.random() * 40 + 20),
        fairwayTimeSeconds: Math.floor(Math.random() * 60 + 40),
        greenTimeSeconds: Math.floor(Math.random() * 50 + 20),
      };

      stats["totalTimeSeconds"] =
        stats.teeTimeSeconds +
        stats.fairwayTimeSeconds +
        stats.greenTimeSeconds;

      // Write hole stats
      await setDoc(doc(dbData, "active_flights", flightId, "players", TEST_PLAYER_ID, "hole_stats", String(hole)), stats, { merge: true });

      // Update current hole
      await setDoc(doc(dbData, "active_flights", flightId), {
          currentHole: hole,
          lastUpdate: serverTimestamp(),
        }, { merge: true });

      setOutput({ hole, stats });
    } catch (err) {
      setOutput({ error: String(err) });
    }
    setLoading(false);
  };

  // -------------------------------------------------------
  // 4) READ AGGREGATED/LIVE
  // -------------------------------------------------------
  const readAggregated = async () => {
    if (!flightId || !dbData) return;

    setLoading(true);
    try {
      const snap = await getDoc(doc(dbData, "active_flights", flightId, "aggregated", "live"));

      setOutput(snap.data() || { empty: true });
    } catch (err) {
      setOutput({ error: String(err) });
    }
    setLoading(false);
  };

  // -------------------------------------------------------
  // 5) RESET TEST FLIGHT
  // -------------------------------------------------------
  const resetFlight = async () => {
    if (!flightId || !dbData) return;

    setLoading(true);
    try {
      await deleteDoc(doc(dbData, "active_flights", flightId));
      setOutput({ deleted: flightId });
      setFlightId("");
    } catch (err) {
      setOutput({ error: String(err) });
    }
    setLoading(false);
  };

  // -------------------------------------------------------
  // UI
  // -------------------------------------------------------
  return (
    <div className="space-y-10">

      {/* TITLE */}
      <h2 className="text-xs font-black uppercase tracking-[0.3em] text-purple-400 flex items-center gap-2">
        <Database size={14} /> TEST LAB — END‑TO‑END VALIDATION
      </h2>

      {/* ACTION BUTTONS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <button
          onClick={createTestFlight}
          className="bg-purple-600/20 border border-purple-500/20 p-6 rounded-2xl text-left hover:bg-purple-600/30 transition"
        >
          <div className="flex items-center gap-3">
            <Database className="text-purple-400" />
            <span className="font-black uppercase text-sm">Create Test Flight</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Genera un flight di test con un giocatore.</p>
        </button>

        <button
          onClick={callJoinOrCreate}
          className="bg-blue-600/20 border border-blue-500/20 p-6 rounded-2xl text-left hover:bg-blue-600/30 transition"
        >
          <div className="flex items-center gap-3">
            <Play className="text-blue-400" />
            <span className="font-black uppercase text-sm">Test JoinOrCreate</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Chiama la Cloud Function HTTP.</p>
        </button>

        <button
          onClick={readAggregated}
          className="bg-emerald-600/20 border border-emerald-500/20 p-6 rounded-2xl text-left hover:bg-emerald-600/30 transition"
        >
          <div className="flex items-center gap-3">
            <Flag className="text-emerald-400" />
            <span className="font-black uppercase text-sm">Read Aggregated</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Legge aggregated/live.</p>
        </button>

      </div>

      {/* HOLES SIMULATION */}
      {flightId && (
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">
            Simulazione 18 buche — Flight: {flightId}
          </h3>

          <div className="grid grid-cols-6 gap-3">
            {Array.from({ length: 18 }).map((_, i) => (
              <button
                key={i}
                onClick={() => simulateHole(i + 1)}
                className="bg-slate-800/40 border border-white/10 rounded-xl py-3 text-center hover:bg-slate-800/60 transition"
              >
                <span className="font-black text-sm">Buca {i + 1}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* RESET */}
      {flightId && (
        <button
          onClick={resetFlight}
          className="bg-red-600/20 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 hover:bg-red-600/30 transition"
        >
          <Trash2 className="text-red-400" />
          <span className="font-black uppercase text-sm">Reset Test Flight</span>
        </button>
      )}

      {/* OUTPUT */}
      <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-6 font-mono text-xs text-slate-300 whitespace-pre-wrap">
        {loading ? (
          <div className="flex items-center gap-3">
            <Loader2 className="animate-spin text-emerald-400" size={18} />
            <span>Processing...</span>
          </div>
        ) : (
          JSON.stringify(output, null, 2)
        )}
      </div>
    </div>
  );
};
