import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, BarChart3, TrendingUp, Clock, AlertTriangle,
  Users, Target, Calendar, RefreshCw, Download, Info, Loader2
} from 'lucide-react';

import { Language, UserProfile, LocalRulesData } from '../../types';
import { dbData } from '../../services/firebase';
import {
  collection, doc, getDoc, getDocs, query, where, orderBy, limit
} from 'firebase/firestore';

interface StatisticsProps {
  user: UserProfile | null;
  localRulesData: LocalRulesData;
  onBack: () => void;
  lang: Language;
}

export const Statistics: React.FC<StatisticsProps> = ({ user, localRulesData, onBack, lang }) => {
  const [selectedCourseId, setSelectedCourseId] = useState(localRulesData.subCourses?.[0]?.id || 'default');
  const [statsPeriod, setStatsPeriod] = useState<'today' | 'week' | 'month'>('week');
  const [isLoading, setIsLoading] = useState(false);

  const [overallStats, setOverallStats] = useState<any>(null);
  const [holeStats, setHoleStats] = useState<any[]>([]);
  const [paceConfig, setPaceConfig] = useState<any>(null);

  // 🔒 Blocco accesso se manca il club
  if (!user?.homeClubId) {
    return (
      <div className="h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <div className="bg-white border border-red-100 text-red-600 px-8 py-6 rounded-3xl shadow-sm max-w-md text-center space-y-3">
          <h1 className="text-lg font-black uppercase tracking-widest">
            Profilo incompleto
          </h1>
          <p className="text-sm font-medium">
            Il tuo account non ha un club associato (<code>homeClubId</code> mancante).
          </p>
          <p className="text-xs text-red-400">
            Contatta l’amministratore del club per completare la configurazione del profilo.
          </p>
        </div>
      </div>
    );
  }

  const clubId = user.homeClubId;


  // 🟩 1. Carica paceOfPlayConfig (targetTime reali)
  const loadPaceConfig = async () => {
    const ref = doc(dbData, "clubs", clubId, "config", "pace_of_play");
    const snap = await getDoc(ref);
    if (snap.exists()) setPaceConfig(snap.data());
  };

  // 🟩 2. Carica daily_stats/{today}
  const loadTodayStats = async () => {
    const today = new Date().toISOString().split("T")[0];
    const ref = doc(dbData, "clubs", clubId, "daily_stats", today);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      setOverallStats(null);
      setHoleStats([]);
      return;
    }

    const data = snap.data();
    setOverallStats(data.overall);
    setHoleStats(data.holeStats || []);
  };

  // 🟩 3. Carica storico (week / month)
  const loadHistoryStats = async () => {
    const days = statsPeriod === "week" ? 7 : 30;
    const since = Date.now() - days * 24 * 60 * 60 * 1000;

    const q = query(
      collection(dbData, "pace_analytics_history"),
      where("clubId", "==", clubId),
      where("timestamp", ">=", since),
      orderBy("timestamp", "desc"),
      limit(200)
    );

    const snap = await getDocs(q);
    const docs = snap.docs.map(d => d.data());

    if (docs.length === 0) {
      setOverallStats(null);
      setHoleStats([]);
      return;
    }

    // 🟩 KPI già aggregati dal backend
    const avgRound = Math.round(
      docs.reduce((s, d) => s + (d.totalTimeMinutes || 0), 0) / docs.length
    );

    const onTimePercent = Math.round(
      (docs.filter(d => (d.delayMinutes || 0) <= 10).length / docs.length) * 100
    );

    // 🟩 Aggregazione hole_stats dal backend
    const holeAgg: Record<number, number[]> = {};

    docs.forEach(d => {
      if (!d.hole_stats) return;
      Object.entries(d.hole_stats).forEach(([hole, hs]: any) => {
        if (!holeAgg[hole]) holeAgg[hole] = [];
        holeAgg[hole].push(hs.totalTimeSeconds || 0);
      });
    });

    const holeStatsFinal = Object.keys(holeAgg).map(h => {
      const arr = holeAgg[h];
      const avg = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length / 60);

      return {
        number: Number(h),
        avgTime: avg,
        targetTime: paceConfig?.targets?.[h] || 14,
        delayFrequency: Math.round((arr.filter(v => v / 60 > (paceConfig?.targets?.[h] || 14)).length / arr.length) * 100),
        trafficRank: arr.length > 5 ? "High" : "Normal"
      };
    });

    const critical = holeStatsFinal
      .filter(h => h.delayFrequency > 25)
      .map(h => h.number)
      .slice(0, 3);

    setOverallStats({
      avgRoundTime: `${Math.floor(avgRound / 60)}h ${avgRound % 60}m`,
      totalFlights: docs.length,
      onTimeFlights: `${onTimePercent}%`,
      criticalHoles: critical,
      delayTrend: avgRound > 5 ? `+${avgRound}m` : "Stabile"
    });

    setHoleStats(holeStatsFinal);
  };

  // 🟩 Dispatcher
  const loadStats = async () => {
    setIsLoading(true);
    await loadPaceConfig();

    if (statsPeriod === "today") {
      await loadTodayStats();
    } else {
      await loadHistoryStats();
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadStats();
  }, [statsPeriod, selectedCourseId]);

  // 🟩 UI (identica alla tua, solo con dati reali)
  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans overflow-hidden">
      <header className="bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-500">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase">Analisi Statistiche</h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-emerald-600">
                <BarChart3 size={12} /> {localRulesData.club}
              </div>
              <div className="h-1 w-1 bg-slate-300 rounded-full" />
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-400">
                <Calendar size={12} /> {statsPeriod.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statsPeriod}
            onChange={e => setStatsPeriod(e.target.value as any)}
            className="bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-black uppercase"
          >
            <option value="today">Oggi</option>
            <option value="week">Settimana</option>
            <option value="month">Mese</option>
          </select>

          <button onClick={loadStats} className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl">
            <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
          </button>

          <button className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2">
            <Download size={14} /> Esporta
          </button>
        </div>
      </header>

      {/* 🔥 Qui puoi riusare tutta la tua UI originale */}
      {/* Basta sostituire realOverallStats → overallStats e realHoleStats → holeStats */}
    </div>
  );
};
