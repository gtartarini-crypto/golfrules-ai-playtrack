import React, { useEffect, useState } from "react";
import { 
  ArrowLeft, Calendar, Clock, Users, ChevronRight, 
  BarChart3, RefreshCw, Loader2, Timer, AlertTriangle, 
  TrendingDown, TrendingUp, Filter, MapPin
} from "lucide-react";
import { paceAnalyticsHistoryService } from "../../services/paceAnalyticsHistoryService";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

import { format } from "date-fns";
import { Language, UserProfile } from "../../types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// 🔥 Firestore Web SDK (CLIENT)
//import { getFirestore, doc, getDoc } from "firebase/firestore";
//import { app } from "../../firebase"; // <-- il tuo file di init Firebase client

interface Props {
  user: UserProfile | null;
  onBack: () => void;
  lang: Language;
}

export const PaceAnalyticsHistory: React.FC<Props> = ({ user, onBack, lang }) => {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);
  const [flights, setFlights] = useState<any[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<any>(null);

  // ⭐ AGGIUNGI QUESTO BLOCCO QUI ⭐
  useEffect(() => {
    if (selectedFlight) {
      console.log("=== SELECTED FLIGHT ===");
      console.log("FLIGHT:", selectedFlight);
      console.log("LOGO:", selectedFlight.darkLogoUrl);
      console.log("COURSE:", selectedFlight.courseName);
    }
  }, [selectedFlight]);
  // ⭐ FINE BLOCCO ⭐

  
  const formatSecondsToMinutes = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  if (!user?.homeClubId) {
    return (
      <div className="h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <div className="bg-white border border-red-100 text-red-600 px-8 py-6 rounded-3xl shadow-sm max-w-md text-center space-y-3">
          <h1 className="text-lg font-black uppercase tracking-widest">Profilo incompleto</h1>
          <p className="text-sm font-medium">
            Il tuo account non ha un club associato (<code>homeClubId</code> mancante).
          </p>
          <p className="text-xs text-red-400">Contatta l’amministratore del club per completare la configurazione.</p>
        </div>
      </div>
    );
  }

  const clubId = user.homeClubId;

  const loadData = async () => {
    if (!clubId) return;
    setLoading(true);
    try {
      const data = await paceAnalyticsHistoryService.getHistory(clubId, date);
      setFlights(data?.flights || []);
      setSelectedFlight(null);
    } catch (e) {
      console.error("Load History Error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [date]);

const generatePdf = async () => {
  if (!selectedFlight) return;

  const docPdf = new jsPDF();

  /* -------------------------------------------------------------------------- */
  /* LOGO (con proporzioni corrette e layout dinamico)                          */
  /* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* LOGO + TITOLO ALLINEATO                                                    */
/* -------------------------------------------------------------------------- */

let logoBase64: string | null = null;
let logoFormat: "PNG" | "JPEG" | "WEBP" = "PNG";
let headerTop = 10;

const logoUrl = selectedFlight.darkLogoUrl;

if (logoUrl) {
  try {
    const res = await fetch(logoUrl);
    const blob = await res.blob();

    if (blob.type === "image/jpeg") logoFormat = "JPEG";
    if (blob.type === "image/webp") logoFormat = "WEBP";

    logoBase64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });

    const img = new Image();
    img.src = logoBase64;

    await new Promise((resolve) => (img.onload = resolve));

    const originalWidth = img.width;
    const originalHeight = img.height;

    const targetWidth = 30;
    const ratio = originalHeight / originalWidth;
    const targetHeight = targetWidth * ratio;

    // Disegna logo
    docPdf.addImage(logoBase64, logoFormat, 14, headerTop, targetWidth, targetHeight);

    // Calcola la Y del titolo per allinearlo verticalmente al logo
    const titleY = headerTop + targetHeight / 2 + 3; // +3 per compensare baseline del font

    // Disegna titolo accanto al logo
    docPdf.setFontSize(18);
    docPdf.text("Pace Analytics Report", 50, titleY);

    // Aggiorna headerTop per i blocchi successivi
    headerTop += targetHeight + 12;

  } catch (err) {
    console.error("Errore caricamento logo:", err);
  }
}

  /* -------------------------------------------------------------------------- */
  /* HEADER                                                                     */
  /* -------------------------------------------------------------------------- */

  docPdf.setFontSize(10);
  const courseName = selectedFlight.courseName || "Percorso sconosciuto";

  docPdf.text(
    `Data: ${date} | Flight: ${selectedFlight.flightId} | Player: ${selectedFlight.playerName} | Course: ${courseName}`,
    14,
    headerTop
  );

  headerTop += 12;

  /* -------------------------------------------------------------------------- */
  /* KPI                                                                        */
  /* -------------------------------------------------------------------------- */

  docPdf.setFontSize(12);
  docPdf.text("KPI", 14, headerTop);
  headerTop += 4;

  autoTable(docPdf, {
    startY: headerTop,
    head: [["Start", "End", "Total (min)", "Slowest Hole", "Time"]],
    body: [[
      selectedFlight.kpi?.startTime || "--",
      selectedFlight.kpi?.endTime || "--",
      selectedFlight.kpi?.totalMinutes || "--",
      selectedFlight.kpi?.slowestHoleLabel || "--",
      selectedFlight.kpi?.slowestHoleTime || "--",
    ]],
    styles: { fontSize: 8 },
    headStyles: { fontSize: 8, fillColor: [15, 23, 42] },
  });

  headerTop = docPdf.lastAutoTable.finalY + 10;

  /* -------------------------------------------------------------------------- */
  /* PAR STATS                                                                  */
  /* -------------------------------------------------------------------------- */

  if (selectedFlight.kpi?.parStats) {
    docPdf.setFontSize(12);
    docPdf.text("Par Stats", 14, headerTop);
    headerTop += 4;

    autoTable(docPdf, {
      startY: headerTop,
      head: [["Par", "Count", "Avg Time"]],
      body: [
        [
          "Par 3",
          selectedFlight.kpi.parStats.par3.count,
          formatSecondsToMinutes(selectedFlight.kpi.parStats.par3.avg),
        ],
        [
          "Par 4",
          selectedFlight.kpi.parStats.par4.count,
          formatSecondsToMinutes(selectedFlight.kpi.parStats.par4.avg),
        ],
        [
          "Par 5",
          selectedFlight.kpi.parStats.par5.count,
          formatSecondsToMinutes(selectedFlight.kpi.parStats.par5.avg),
        ],
      ],
      styles: { fontSize: 8 },
      headStyles: { fontSize: 8, fillColor: [15, 23, 42] },
    });

    headerTop = docPdf.lastAutoTable.finalY + 10;
  }

  /* -------------------------------------------------------------------------- */
  /* HOLE BY HOLE                                                               */
  /* -------------------------------------------------------------------------- */

  docPdf.setFontSize(12);
  docPdf.text("Dettaglio Completo (Hole by Hole)", 14, headerTop);
  headerTop += 4;

  const tableBody = Object.entries(selectedFlight.holes || {}).map(
    ([hole, hData]: [string, any]) => [
      hole,
      hData.par ?? "--",
      hData.strokeIndex ?? "--",
      formatSecondsToMinutes(hData.targetSeconds),
      formatSecondsToMinutes(hData.totalTimeSeconds),
      hData.deltaSeconds > 0 ? `+${Math.round(hData.deltaSeconds / 60)}m` : "OK",
    ]
  );

  autoTable(docPdf, {
    startY: headerTop,
    head: [["Hole", "Par", "Index", "Target", "Actual", "Delta"]],
    body: tableBody,
    styles: { fontSize: 8 },
    headStyles: { fontSize: 8, fillColor: [15, 23, 42] },
  });

  headerTop = docPdf.lastAutoTable.finalY + 10;

  /* -------------------------------------------------------------------------- */
  /* SAVE                                                                       */
  /* -------------------------------------------------------------------------- */

  docPdf.save(`pace_report_${selectedFlight.flightId}.pdf`);
};


  return (
    <div className="h-screen bg-slate-950 flex flex-col font-sans overflow-hidden text-slate-100">
      
      {/* HEADER */}
      <header className="bg-slate-900 border-b border-white/10 px-8 py-4 flex items-center justify-between z-30 shadow-2xl shrink-0">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-2.5 hover:bg-white/5 rounded-xl transition-colors text-slate-400">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight uppercase leading-none">History Analytics</h1>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-emerald-400 tracking-widest mt-1">
              <Calendar size={12} /> Consultazione Sessioni Passate
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-800 p-1.5 rounded-2xl border border-white/5 shadow-inner">
          <div className="flex items-center gap-2 px-3">
            <Filter size={14} className="text-slate-500" />
            <label className="text-[10px] font-black uppercase text-slate-500">Seleziona Giorno</label>
          </div>

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
          />

          <button
            onClick={loadData}
            className="p-2.5 bg-emerald-500 text-slate-950 rounded-xl hover:bg-emerald-400 transition-all active:scale-95 shadow-lg"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        
        {/* SIDEBAR */}
        <aside className="w-85 flex flex-col bg-slate-900 border-r border-white/5 shadow-2xl shrink-0">
          <div className="p-6 border-b border-white/5 bg-black/20 flex justify-between items-center">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Users size={14} className="text-emerald-500" /> Sessioni Rilevate
            </h3>
            <span className="bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full text-[10px] font-black border border-white/5">
              {flights.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
            {flights.length === 0 && !loading && (
              <div className="py-20 text-center opacity-20">
                <Users size={48} className="mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">Nessun dato per questa data</p>
              </div>
            )}

            {flights.map((f) => (
              <button
                key={f.flightId}
                onClick={() => setSelectedFlight(f)}
                className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 group ${
                  selectedFlight?.flightId === f.flightId
                    ? "bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/20"
                    : "bg-white/5 border-transparent hover:bg-white/10"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`font-black text-xs ${
                    selectedFlight?.flightId === f.flightId ? "text-emerald-400" : "text-white"
                  }`}>
                    FLIGHT #{f.flightNumber || f.flightId.slice(-4)}
                  </span>
                  <ChevronRight
                    size={14}
                    className={`transition-transform ${
                      selectedFlight?.flightId === f.flightId
                        ? "text-emerald-500 translate-x-1"
                        : "text-slate-600"
                    }`}
                  />
                </div>

                <p className="text-[11px] font-bold text-slate-400 uppercase truncate">
                  {f.playerName || "Giro Concluso"}
                </p>

                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1 text-[9px] font-black uppercase text-slate-500 tracking-tighter">
                    <Clock size={10} /> {f.kpi?.totalMinutes || "--"} min
                  </div>

                  {f.delayMinutes > 0 && (
                    <div className="text-[9px] font-black text-red-400">
                      +{f.delayMinutes}m
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <section className="flex-1 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black overflow-y-auto scrollbar-hide p-8">
          {!selectedFlight ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4 opacity-30">
              <BarChart3 size={80} strokeWidth={1} />
              <p className="text-sm font-black uppercase tracking-[0.3em]">Seleziona una sessione per l'analisi</p>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

              {/* HEADER DETTAGLIO */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[10px] font-black uppercase border border-emerald-500/20">
                      Archivio Telemetrico
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                      <MapPin size={10} /> Data: {date}
                    </span>
                  </div>

                  <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
                    Flight {selectedFlight.flightNumber || selectedFlight.flightId}
                  </h2>

                  <p className="text-slate-400 text-sm font-medium mt-2">
                    {selectedFlight.playerName || "Dati storici della sessione di gioco"}
                  </p>
                </div>

                <div className="flex gap-4">
                  <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 text-center min-w-[120px]">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Inizio Giro</p>
                    <p className="text-xl font-black text-white">{selectedFlight.kpi?.startTime || "--"}</p>
                  </div>

                  <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 text-center min-w-[120px]">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Fine Giro</p>
                    <p className="text-xl font-black text-white">{selectedFlight.kpi?.endTime || "--"}</p>
                  </div>
                </div>
              </div>

              {/* KPI CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Durata Totale */}
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-3 relative overflow-hidden shadow-2xl">
                  <Timer className="absolute -right-4 -bottom-4 text-white/5 w-24 h-24" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Durata Totale</p>
                  <p className="text-4xl font-black text-white">
                    {selectedFlight.kpi?.totalMinutes || "--"} <span className="text-lg text-slate-500 font-bold uppercase tracking-tighter">min</span>
                  </p>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400">
                    <TrendingDown size={14} /> Performance OK
                  </div>
                </div>

                {/* Ritardo Totale */}
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-3 relative overflow-hidden shadow-2xl">
                  <AlertTriangle className="absolute -right-4 -bottom-4 text-white/5 w-24 h-24" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Ritardo Totale</p>
                  <p className={`text-4xl font-black ${selectedFlight.delayMinutes > 0 ? "text-red-400" : "text-emerald-400"}`}>
                    {selectedFlight.delayMinutes || 0} <span className="text-lg opacity-50 font-bold uppercase tracking-tighter">min</span>
                  </p>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                    <Clock size={14} /> Rispetto al target
                  </div>
                </div>

                {/* Buca più lenta */}
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-3 relative overflow-hidden shadow-2xl">
                  <BarChart3 className="absolute -right-4 -bottom-4 text-white/5 w-24 h-24" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Buca più lenta</p>
                  <p className="text-4xl font-black text-orange-400">{selectedFlight.kpi?.slowestHoleLabel || "--"}</p>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                    <TrendingUp size={14} /> {selectedFlight.kpi?.slowestHoleTime || "--"}
                  </div>
                </div>
              </div>

              {/* PAR 3 / 4 / 5 */}
              {selectedFlight.kpi?.parStats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
                  {["par3", "par4", "par5"].map((key) => (
                    <div key={key} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {key === "par3" ? "Par 3" : key === "par4" ? "Par 4" : "Par 5"}
                      </p>
                      <p className="text-3xl font-black text-white">
                        {formatSecondsToMinutes(selectedFlight.kpi.parStats[key].avg)}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold mt-1">
                        {selectedFlight.kpi.parStats[key].count} buche
                      </p>
                    </div>
                  ))}
                </div>
              )}
{/* TABELLA PREMIUM COMPLETA */}
<div className="bg-slate-900/50 border border-white/5 rounded-[3rem] shadow-2xl overflow-hidden mt-10">
  <div className="p-8 border-b border-white/5">
    <h3 className="font-black text-sm uppercase tracking-widest text-slate-400">
      Tabella Premium – Dettaglio Completo
    </h3>
  </div>

  <div className="overflow-x-auto">
    <table className="min-w-full text-left text-sm text-slate-300">
      <thead className="bg-slate-900/80 text-[10px] uppercase tracking-widest font-black text-slate-500 border-b border-white/5">
        <tr>
          <th className="px-6 py-3">Buca</th>
          <th className="px-6 py-3">Par</th>
          <th className="px-6 py-3">Index</th>
          <th className="px-6 py-3">Target</th>
          <th className="px-6 py-3">Actual</th>
          <th className="px-6 py-3">Delta</th>
        </tr>
      </thead>

      <tbody>
        {Object.entries(selectedFlight.holes || {}).map(([hole, hData]: [string, any]) => {
          const target = hData.targetSeconds || 0;
          const actual = hData.totalTimeSeconds || 0;
          const delta = hData.deltaSeconds || 0;
          const isLate = delta > 0;

          return (
            <tr
              key={hole}
              className="border-b border-white/5 hover:bg-white/5 transition-colors"
            >
              <td className="px-6 py-4 font-black text-white">{hole}</td>
              <td className="px-6 py-4">{hData.par}</td>
              <td className="px-6 py-4">{hData.strokeIndex}</td>

              <td className="px-6 py-4">
                {target > 0 ? formatSecondsToMinutes(target) : "--"}
              </td>

              <td className="px-6 py-4">
                {formatSecondsToMinutes(actual)}
              </td>

              <td className="px-6 py-4">
                <span
                  className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                    isLate
                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  }`}
                >
                  {isLate
                    ? `+${Math.round(delta / 60)}m`
                    : "OK"}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
</div>
{/* GRAFICO DEL RITMO */}
<div className="bg-slate-900/50 border border-white/5 rounded-[3rem] shadow-2xl overflow-hidden mt-10 p-8">
  <h3 className="font-black text-sm uppercase tracking-widest text-slate-400 mb-6">
    Grafico del Ritmo di Gioco
  </h3>

  <ResponsiveContainer width="100%" height={300}>
    <LineChart
      data={Object.entries(selectedFlight.holes || {}).map(
        ([hole, hData]: [string, any]) => ({
          hole: Number(hole),
          target: hData.targetSeconds || 0,
          actual: hData.totalTimeSeconds || 0,
        })
      )}
    >
      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
      <XAxis
        dataKey="hole"
        stroke="#64748b"
        tick={{ fontSize: 10, fontWeight: 700 }}
      />
      <YAxis
        stroke="#64748b"
        tick={{ fontSize: 10, fontWeight: 700 }}
        tickFormatter={(v) => `${Math.round(v / 60)}m`}
      />
      <Tooltip
        contentStyle={{
          backgroundColor: "#0f172a",
          border: "1px solid #334155",
          borderRadius: "10px",
        }}
        labelStyle={{ color: "#94a3b8", fontWeight: 700 }}
        formatter={(value: any) => `${Math.round(value / 60)} min`}
      />

      {/* Target Line */}
      <Line
        type="monotone"
        dataKey="target"
        stroke="#22c55e"
        strokeWidth={3}
        dot={false}
        name="Target"
      />

      {/* Actual Line */}
      <Line
        type="monotone"
        dataKey="actual"
        stroke="#f97316"
        strokeWidth={3}
        dot={{ r: 4 }}
        name="Actual"
      />
    </LineChart>
  </ResponsiveContainer>
</div>


{/* ANALISI BUCHE */}
<div className="bg-slate-900/50 border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
  <div className="p-8 border-b border-white/5 flex items-center justify-between">
    <h3 className="font-black text-sm uppercase tracking-widest text-slate-400">
      Breakdown Analitico (Hole by Hole)
    </h3>
    <button
      onClick={generatePdf}
      className="text-[10px] font-black uppercase text-emerald-400 hover:underline"
    >
      Scarica Report PDF
    </button>
  </div>

  <div className="p-8 space-y-6">
    {Object.entries(selectedFlight.holes || {}).map(
      ([hole, hData]: [string, any]) => {
        const target = hData.targetSeconds || 0;
        const actual = hData.totalTimeSeconds || 0;
        const delta = hData.deltaSeconds || 0;
        const isLate = delta > 0;

        const progress = target > 0
          ? Math.min(100, (actual / (target * 1.5)) * 100)
          : 0;

        return (
          <div key={hole} className="space-y-3">
            <div className="flex justify-between items-end">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center font-black text-xs text-white">
                  {hole}
                </div>

                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">
                    PAR {hData.par} • INDEX {hData.strokeIndex}
                  </p>

                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">
                    Durata Effettiva
                  </p>
                  <p className="text-sm font-black text-slate-100 uppercase">
                    {formatSecondsToMinutes(actual)}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded ${
                    isLate
                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  }`}
                >
                  {isLate ? `+${Math.round(delta / 60)}m LATE` : "IN TIME"}
                </span>
              </div>
            </div>

            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  isLate ? "bg-red-500" : "bg-emerald-500"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        );
      }
    )}
  </div>
</div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default PaceAnalyticsHistory;