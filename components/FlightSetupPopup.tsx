import React, { useState } from "react";

export const FlightSetupPopup = ({ onConfirm, onClose }) => {
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null);
  const [teeTime, setTeeTime] = useState(
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Genera Flight-01 ... Flight-40
  const flights = Array.from({ length: 40 }, (_, i) =>
    `Flight-${String(i + 1).padStart(2, "0")}`
  );

  const handleConfirm = () => {
    if (!selectedFlight || isSubmitting) return;

    setIsSubmitting(true);

    // Passiamo il controllo al parent
    onConfirm(selectedFlight, teeTime);
  };

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-[200] backdrop-blur-md">
      <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl w-80 text-white text-center shadow-2xl">
        
        <h3 className="text-xl font-black mb-4 uppercase tracking-tight">
          Seleziona il Flight
        </h3>

        {/* GRID FLIGHT */}
        <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto mb-6 pr-1">
          {flights.map((f) => (
            <button
              key={f}
              disabled={isSubmitting}
              onClick={() => setSelectedFlight(f)}
              className={`py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                selectedFlight === f
                  ? "bg-emerald-500 text-slate-950 shadow-lg"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              } ${isSubmitting ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* TEE TIME */}
        <div className="mb-6">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
            Orario di Partenza
          </label>
          <input
            type="time"
            disabled={isSubmitting}
            value={teeTime}
            onChange={(e) => setTeeTime(e.target.value)}
            className="w-full p-3 rounded-xl bg-slate-800 border border-white/10 text-sm font-black text-white disabled:opacity-40"
          />
        </div>

        {/* BUTTONS */}
        <button
          className="w-full bg-emerald-500 py-3 rounded-2xl font-black text-slate-950 text-xs uppercase tracking-widest disabled:opacity-40"
          disabled={!selectedFlight || isSubmitting}
          onClick={handleConfirm}
        >
          {isSubmitting ? "Preparazione in corso..." : "Conferma e Inizia"}
        </button>

        <button
          className="w-full mt-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white disabled:opacity-40"
          disabled={isSubmitting}
          onClick={onClose}
        >
          Annulla
        </button>
      </div>
    </div>
  );
};
