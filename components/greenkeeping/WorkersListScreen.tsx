import React, { useEffect, useState } from "react";
import { ArrowLeft, Loader2, User, FileText, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { staffWorkersService } from "../../services/staffWorkers.service";
import { StaffWorker, Language, UserProfile } from "../../types";

interface Props {
  clubId: string;
  lang: Language;
  onNavigate: (view: string, params?: any) => void;
  onBack: () => void;
  user: UserProfile | null;
}

export const WorkersListScreen: React.FC<Props> = ({
  clubId,
  lang,
  onNavigate,
  onBack,
  user
}) => {
  const [workers, setWorkers] = useState<StaffWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadWorkers = async () => {
    setLoading(true);
    const list = await staffWorkersService.getWorkersByClub(clubId);
    setWorkers(list);
    setLoading(false);
  };

  const handleDelete = async (uid: string) => {
    if (confirmDeleteId !== uid) {
      setConfirmDeleteId(uid);
      setTimeout(() => setConfirmDeleteId(current => current === uid ? null : current), 3000);
      return;
    }

    setConfirmDeleteId(null);
    setDeleting(uid);
    try {
      await staffWorkersService.deleteWorker(uid, clubId);
      await loadWorkers();
    } catch (err) {
      console.error("Errore eliminazione:", err);
      alert("Impossibile eliminare l'operaio.");
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    if (!clubId) return;
    loadWorkers();
  }, [clubId]);

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-900 font-sans overflow-hidden">

      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 px-6 py-5 flex items-center justify-between gap-3 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1 className="text-lg font-black uppercase tracking-tight text-slate-900">
              Gestione Operai
            </h1>
            <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">
              Anagrafica Staff di Campo
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate("admin_greenkeeping_worker_create")}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg transition-all active:scale-95"
        >
          + Nuovo Operaio
        </button>
      </header>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center opacity-40 py-20">
            <Loader2 size={40} className="animate-spin mb-4 text-emerald-600" />
            <p className="text-[10px] font-black uppercase tracking-widest">
              Caricamento...
            </p>
          </div>
        ) : workers.length === 0 ? (
          <div className="py-20 text-center text-slate-400 font-black uppercase text-xs tracking-widest">
            Nessun operaio registrato
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
            {workers.map((worker) => (
              <div
                key={worker.uid}
                className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col gap-5 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                    <User size={28} />
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-black text-base uppercase leading-none truncate text-slate-900">
                      {worker.displayName || `${worker.firstName || ""} ${worker.lastName || ""}`.trim()}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                       <span className="text-[9px] font-black px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 uppercase">
                         {worker.role || "Operaio"}
                       </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 truncate">
                      {worker.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 border-t border-slate-50 pt-4">
                  <button
                    onClick={() => onNavigate("admin_greenkeeping_worker_profile", { uid: worker.uid })}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-[9px] font-black uppercase tracking-widest transition-colors"
                  >
                    <FileText size={14} />
                    Storico
                  </button>

                  <button
                    onClick={() => onNavigate("admin_greenkeeping_worker_edit", { uid: worker.uid })}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-[9px] font-black uppercase tracking-widest transition-colors"
                  >
                    <Pencil size={14} />
                    Modifica
                  </button>

                  <button
                    onClick={() => handleDelete(worker.uid)}
                    disabled={deleting === worker.uid}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                      confirmDeleteId === worker.uid 
                        ? "bg-amber-500 text-slate-950 scale-105 animate-pulse" 
                        : "bg-rose-50 hover:bg-rose-100 text-rose-600"
                    } disabled:opacity-50`}
                  >
                    {deleting === worker.uid ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : confirmDeleteId === worker.uid ? (
                      <AlertTriangle size={14} />
                    ) : (
                      <Trash2 size={14} />
                    )}
                    {confirmDeleteId === worker.uid ? "OK?" : "Elimina"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};