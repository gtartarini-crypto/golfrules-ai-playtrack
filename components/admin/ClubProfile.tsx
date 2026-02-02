import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, Building2, CheckCircle2, Flag, Loader2, Crosshair, Map as MapIcon, Lock, Info, RefreshCw, Radio } from 'lucide-react';
import { Language, LocalRulesData, GolfCourseSub, UserProfile } from '../../types';
import { courseDataService } from '../../services/firebase';

interface ClubProfileProps {
  user: UserProfile | null;
  localRulesData: LocalRulesData;
  onBack: () => void;
  lang: Language;
  onSave: (data: LocalRulesData) => void;
}

export const ClubProfile: React.FC<ClubProfileProps> = ({ user, localRulesData, onBack, lang, onSave }) => {
  const [formData, setFormData] = useState<LocalRulesData>(localRulesData);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    setFormData(localRulesData);
  }, [localRulesData]);

  const syncCoursesWithOfficialSource = async () => {
      const clubId = user?.homeClubId;
      if (!clubId) return;

      setIsLoadingCourses(true);
      try {
          const officialCourses = await courseDataService.getClubCourses(clubId);
          
          setFormData(prev => {
              const currentSubs = prev.subCourses || [];
              const synchronizedSubs = officialCourses.map(off => {
                  const existing = currentSubs.find(s => s.id === off.courseId);
                  return {
                      id: off.courseId,
                      startHole: existing?.startHole || 1,
                      buvetteAfterHole: existing?.buvetteAfterHole,
                      ...existing,
                      name: off.name,
                      holesCount: off.holesCount,
                      status: off.status as "active" | "inactive" | undefined
                  };
              });

              return { ...prev, subCourses: synchronizedSubs };
          });
          
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 2000);
      } catch (e) {
          console.error("Sync error:", e);
      } finally {
          setIsLoadingCourses(false);
      }
  };

  useEffect(() => {
    if (!mapRef.current || !(window as any).google) return;

    const initMap = async () => {
        const { Map } = await (window as any).google.maps.importLibrary("maps");
        const { AdvancedMarkerElement, PinElement } = await (window as any).google.maps.importLibrary("marker");

        if (!mapInstanceRef.current) {
            mapInstanceRef.current = new Map(mapRef.current, {
                center: { lat: formData.latitude || 45.7123, lng: formData.longitude || 9.0234 },
                zoom: formData.latitude ? 17 : 6,
                mapTypeId: 'hybrid',
                mapId: 'CLUB_PROFILE_LOCATOR', 
                disableDefaultUI: true,
                zoomControl: true,
                tilt: 0,
            });

            const pin = new PinElement({ background: "#10b981", glyphColor: "#fff", borderColor: "#fff" });
            markerRef.current = new AdvancedMarkerElement({
                position: { lat: formData.latitude || 45.7123, lng: formData.longitude || 9.0234 },
                map: mapInstanceRef.current,
                gmpDraggable: true,
                content: pin // Fix: Passed PinElement directly instead of pin.element
            });

            markerRef.current.addListener('dragend', (e: any) => {
                const newLat = e.latLng.lat();
                const newLng = e.latLng.lng();
                setFormData(prev => ({ ...prev, latitude: newLat, longitude: newLng }));
            });
        }
    };
    initMap();
  }, [formData.latitude, formData.longitude]);

  const handleSave = () => {
    onSave({
        ...formData,
        latitude: parseFloat(String(formData.latitude)),
        longitude: parseFloat(String(formData.longitude))
    });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleGPSIdentify = () => {
      if (!navigator.geolocation) return;
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(async (pos) => {
          const { latitude, longitude } = pos.coords;
          setFormData(prev => ({ ...prev, latitude, longitude }));
          if(mapInstanceRef.current) {
              mapInstanceRef.current.panTo({ lat: latitude, lng: longitude });
              if (markerRef.current) markerRef.current.position = { lat: latitude, lng: longitude };
          }
          setIsLocating(false);
      }, () => setIsLocating(false));
  };

  const handleUpdateCourse = (id: string, field: keyof GolfCourseSub, value: any) => {
      setFormData(prev => ({ ...prev, subCourses: (prev.subCourses || []).map(c => c.id === id ? { ...c, [field]: value } : c) }));
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans overflow-hidden text-slate-900">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-30 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">{formData.club || 'Golf Club'}</h1>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-emerald-600 tracking-widest mt-1">
              <MapIcon size={12} /> Configurazione & Percorsi
            </div>
          </div>
        </div>
        <button 
          onClick={handleSave} 
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 flex items-center gap-2 transition-all active:scale-95"
        >
          <Save size={18} /> Salva Metadati
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 w-full mx-auto max-w-7xl">
        {showSuccess && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in shadow-sm">
            <CheckCircle2 size={20} className="text-emerald-500" />
            <span className="font-bold text-sm">Configurazione aggiornata.</span>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6 items-start">
            <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"> Clubhouse Location</h2>
                <button onClick={handleGPSIdentify} disabled={isLocating} className="bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95"><Crosshair size={14} /> GPS Sync</button>
              </div>
              <div className="p-4 relative flex flex-col gap-4">
                <div ref={mapRef} className="h-[400px] lg:h-[500px] rounded-[1.5rem] bg-slate-100 border border-slate-200 overflow-hidden shadow-inner" />
                
                <button 
                    onClick={() => setFormData({...formData, allowExtendedTracking: !formData.allowExtendedTracking})}
                    className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest border transition-all flex items-center justify-center gap-3 shadow-sm ${formData.allowExtendedTracking ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}
                >
                    <Radio size={16} className={formData.allowExtendedTracking ? "animate-pulse" : ""} />
                    {formData.allowExtendedTracking ? 'Tracciamento Esteso ATTIVO' : 'Attiva Tracciamento Esteso'}
                </button>
              </div>
            </section>

            <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <div className="flex flex-col">
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400"> Percorsi del Circolo</h2>
                    <p className="text-[8px] text-emerald-600 font-bold uppercase mt-1">Sincronizzazione ClubLink</p>
                </div>
                <button onClick={syncCoursesWithOfficialSource} disabled={isLoadingCourses} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"><RefreshCw size={14} className={isLoadingCourses ? "animate-spin" : ""} /></button>
              </div>
              <div className="p-6 space-y-4">
                {formData.subCourses?.map((course, idx) => (
                  <div key={course.id} className="bg-slate-50 border border-slate-200 rounded-[1.5rem] p-5 space-y-4 shadow-sm hover:border-emerald-200 transition-all">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs">{idx + 1}</div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">ID: {course.id}</span>
                            <span className="text-lg font-black text-slate-900 tracking-tight">{course.name}</span>
                        </div>
                      </div>
                      <Lock size={14} className="text-slate-300" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Buche</label>
                        <div className="w-full bg-white border border-slate-300 p-3 rounded-xl text-sm font-bold text-slate-900">{course.holesCount}</div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Tee Partenza</label>
                        <input type="number" value={course.startHole} onChange={e => handleUpdateCourse(course.id, 'startHole', parseInt(e.target.value) || 1)} className="w-full bg-white border border-slate-400 p-3 rounded-xl text-sm font-black text-slate-900 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
        </div>
      </main>
    </div>
  );
};