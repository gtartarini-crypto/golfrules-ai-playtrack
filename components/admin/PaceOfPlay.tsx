import React, { useState, useEffect } from 'react';
/* Added ShieldCheck to imports */
import { ArrowLeft, Save, Clock, Loader2, Flag, Info, CheckCircle2, RefreshCw, Settings2, Bell, AlertTriangle, MessageSquare, Volume2, ShieldCheck } from 'lucide-react';
import { Language, LocalRulesData, HoleDetail, UserProfile, Course, PaceSettings } from '../../types';
import { courseDataService, paceOfPlayService } from '../../services/firebase';


interface ExtendedCourse extends Course {
  databaseId: string;
}

interface PaceOfPlayProps {
  user: UserProfile | null;
  localRulesData: LocalRulesData;
  onBack: () => void;
  lang: Language;
  onSave: (data: LocalRulesData) => void;
}

export const PaceOfPlay: React.FC<PaceOfPlayProps> = ({ user, localRulesData, onBack, lang, onSave }) => {
  const [officialCourses, setOfficialCourses] = useState<ExtendedCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [holes, setHoles] = useState<HoleDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncingCourses, setIsSyncingCourses] = useState(false);
  const [paceMinutes, setPaceMinutes] = useState<Record<number, number>>({});
  const [paceSettings, setPaceSettings] = useState<PaceSettings>({
    warningThreshold: 5,
    alertThreshold: 12,
    autoNotifyPlayer: false,
    autoNotifyMarshall: true,
    enableAudioAlerts: true
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const loadOfficialCourses = async () => {
    const clubId = user?.homeClubId;
    if (!clubId) return;

    setIsSyncingCourses(true);
    try {
      const list = await courseDataService.getClubCourses(clubId);
      const mappedList: ExtendedCourse[] = list.map(c => {
        const isChampionship = c.courseId === 'club_pinetina_2250' || c.name.toLowerCase().includes('championship');
        return { 
          ...c, 
          databaseId: c.courseId,
          courseId: isChampionship ? 'club_pinetina_2250' : c.courseId,
          name: isChampionship ? 'PINETINA 71' : c.name 
        };
      });
      
      setOfficialCourses(mappedList);
      if (!selectedCourseId && mappedList.length > 0) {
        const pinetina71 = mappedList.find(c => c.courseId === 'club_pinetina_2250');
        setSelectedCourseId(pinetina71 ? pinetina71.courseId : mappedList[0].courseId);
      }
    } catch (e) {
      console.error("Errore caricamento percorsi ufficiali:", e);
    } finally {
      setIsSyncingCourses(false);
    }
  };

  useEffect(() => { loadOfficialCourses(); }, [user?.homeClubId]);

  useEffect(() => {
    if (selectedCourseId) {
      loadHoleAndPaceData();
    }
  }, [selectedCourseId, officialCourses]); 

  const loadHoleAndPaceData = async () => {
    if (!selectedCourseId) return;
    setIsLoading(true);
    try {
      const clubId = user?.homeClubId || 'club_pinetina';
      const course = officialCourses.find(c => c.courseId === selectedCourseId);
      const fetchId = course?.databaseId || selectedCourseId;

      const [holesData, config] = await Promise.all([
        courseDataService.getCourseHoles(fetchId),
        paceOfPlayService.getConfig(clubId, selectedCourseId).catch(() => ({ holes: {} as Record<number, number>, settings: undefined })) as Promise<{holes: Record<number, number>, settings?: PaceSettings}>
      ]);
      
      setHoles(holesData || []);
      setPaceMinutes(config.holes || {});
      if (config.settings) {
        setPaceSettings(config.settings);
      }
    } catch (e) {
      console.error("Failed to load hole or pace data", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMinsChange = (holeNumber: number, val: string) => {
    const mins = val === '' ? 0 : (parseInt(val) || 0);
    setPaceMinutes(prev => ({ ...prev, [holeNumber]: mins }));
  };

  const handleSave = async () => {
    const clubId = user?.homeClubId || 'club_pinetina';
    if (!selectedCourseId) return;

    try {
      await paceOfPlayService.saveConfig(clubId, selectedCourseId, paceMinutes, paceSettings);
      
      const updatedConfigs = {
        ...(localRulesData.paceOfPlayConfigs || {}),
        [selectedCourseId]: paceMinutes
      };
      onSave({ ...localRulesData, paceOfPlayConfigs: updatedConfigs });

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (e: any) {
      console.error("Errore salvataggio:", e);
      alert("Errore durante il salvataggio dei dati.");
    }
  };

  const totalPar = holes.reduce<number>((acc, h) => acc + (h.par || 0), 0);
  const totalLength = holes.reduce<number>((acc, h) => acc + (h.length || 0), 0);
  const totalMins = Object.values(paceMinutes).reduce<number>((acc, curr) => acc + (Number(curr) || 0), 0);
  const totalHours = Math.floor(totalMins / 60);
  const remainingMins = totalMins % 60;

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans overflow-hidden text-slate-900">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-30 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">Peace Of Play</h1>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-orange-600 tracking-widest mt-1">
              <Clock size={12} /> Configurazione Tempi & Trigger
            </div>
          </div>
        </div>
        <button 
          onClick={handleSave}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 flex items-center gap-2 transition-all active:scale-95"
        >
          <Save size={18} /> Salva Tutto
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 w-full mx-auto">
        {showSuccess && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 shadow-sm">
            <CheckCircle2 size={20} className="text-emerald-500" />
            <span className="font-bold text-sm">Configurazione salvata correttamente.</span>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          
          <div className="xl:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Percorso:</label>
                <div className="flex items-center gap-2">
                  <select 
                    value={selectedCourseId}
                    onChange={e => setSelectedCourseId(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-orange-500/10 transition-all min-w-[200px] shadow-sm"
                  >
                    {officialCourses.map(c => <option key={c.courseId} value={c.courseId}>{c.name}</option>)}
                  </select>
                  <button onClick={loadOfficialCourses} disabled={isSyncingCourses} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg">
                    <RefreshCw size={16} className={isSyncingCourses ? "animate-spin" : ""} />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                  <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-2 shadow-sm">
                      <Flag size={14} />
                      <span className="text-xs font-black uppercase">PAR {totalPar} ({totalLength}m)</span>
                  </div>
                  <div className="bg-orange-50 text-orange-700 px-4 py-2 rounded-xl border border-orange-100 flex items-center gap-2 shadow-sm">
                      <Clock size={14} />
                      <span className="text-xs font-black uppercase">Tempo: {totalHours}h {remainingMins}m ({totalMins} min)</span>
                  </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {isLoading ? (
                  <div className="p-20 flex flex-col items-center justify-center gap-4 text-orange-600/50">
                      <Loader2 size={48} className="animate-spin" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Sincronizzazione dati...</p>
                  </div>
              ) : (
                  <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-black uppercase text-[10px] tracking-widest">
                          <tr>
                              <th className="px-8 py-4">Buca</th>
                              <th className="px-6 py-4">PAR / Metri</th>
                              <th className="px-6 py-4">Tempo Target (min)</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                          {holes.map((hole) => (
                              <tr key={hole.number} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-8 py-4">
                                      <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                                          {hole.number}
                                      </div>
                                  </td>
                                  <td className="px-6 py-4">
                                      <div className="flex flex-col">
                                        <span className="font-bold text-slate-700">PAR {hole.par}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">{hole.length}m</span>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                          <input 
                                              type="number"
                                              value={paceMinutes[hole.number] !== undefined ? paceMinutes[hole.number] : ''}
                                              onChange={e => handleMinsChange(hole.number, e.target.value)}
                                              placeholder="0"
                                              className="w-20 bg-white border border-slate-300 p-2.5 rounded-xl text-sm font-black text-slate-900 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-sm"
                                          />
                                          <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">min</span>
                                      </div>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
                        <Settings2 size={20} />
                    </div>
                    <h3 className="font-black text-sm uppercase tracking-widest">Soglie di Allerta</h3>
                </div>

                <div className="space-y-5">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                <AlertTriangle size={12} className="text-amber-500" /> Soglia Warning (Giallo)
                            </label>
                            <span className="text-xs font-black text-amber-600">+{paceSettings.warningThreshold}m</span>
                        </div>
                        <input 
                            type="range" min="1" max="15" 
                            value={paceSettings.warningThreshold}
                            onChange={e => setPaceSettings({...paceSettings, warningThreshold: parseInt(e.target.value)})}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                <AlertTriangle size={12} className="text-red-500" /> Soglia Alert (Rosso)
                            </label>
                            <span className="text-xs font-black text-red-600">+{paceSettings.alertThreshold}m</span>
                        </div>
                        <input 
                            type="range" min="10" max="30" 
                            value={paceSettings.alertThreshold}
                            onChange={e => setPaceSettings({...paceSettings, alertThreshold: parseInt(e.target.value)})}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-red-500"
                        />
                    </div>
                </div>
            </section>

            <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                        <Bell size={20} />
                    </div>
                    <h3 className="font-black text-sm uppercase tracking-widest">Trigger Automatici</h3>
                </div>

                <div className="space-y-4">
                    <TriggerItem 
                        icon={<MessageSquare size={18} />}
                        title="Notifica Giocatore"
                        desc="Invia messaggio AI al superamento soglia Alert."
                        active={paceSettings.autoNotifyPlayer}
                        onClick={() => setPaceSettings({...paceSettings, autoNotifyPlayer: !paceSettings.autoNotifyPlayer})}
                    />
                    <TriggerItem 
                        icon={<ShieldCheck size={18} />}
                        title="Notifica Marshall"
                        desc="Avvisa lo staff quando un flight è in ritardo grave."
                        active={paceSettings.autoNotifyMarshall}
                        onClick={() => setPaceSettings({...paceSettings, autoNotifyMarshall: !paceSettings.autoNotifyMarshall})}
                    />
                    <TriggerItem 
                        icon={<Volume2 size={18} />}
                        title="Alert Sonori"
                        desc="Riproduce suoni nel monitor Marshall per i ritardi."
                        active={paceSettings.enableAudioAlerts}
                        onClick={() => setPaceSettings({...paceSettings, enableAudioAlerts: !paceSettings.enableAudioAlerts})}
                    />
                </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

const TriggerItem = ({ icon, title, desc, active, onClick }: any) => (
    <div 
        onClick={onClick}
        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${active ? 'bg-emerald-50 border-emerald-100 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}
    >
        <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-xl transition-colors ${active ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-200 text-slate-500'}`}>
                {icon}
            </div>
            <div>
                <p className="text-xs font-black uppercase text-slate-900 tracking-tight">{title}</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase">{desc}</p>
            </div>
        </div>
        <div className={`w-10 h-6 rounded-full p-1 transition-colors ${active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${active ? 'translate-x-4' : 'translate-x-0'}`} />
        </div>
    </div>
);