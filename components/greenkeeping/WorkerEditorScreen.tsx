import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Language, StaffWorker, UserProfile } from '../../types';
import { staffWorkersService } from '../../services/staffWorkers.service';
import { WorkerForm } from './WorkerForm';

interface Props {
  uid: string;
  // Added missing clubId prop to fix usage errors in main view renderers
  clubId: string;
  onBack: () => void;
  lang: Language;
  user: UserProfile | null;
}

export const WorkerEditorScreen: React.FC<Props> = ({ uid, clubId, onBack, lang, user }) => {
  const [worker, setWorker] = useState<StaffWorker | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const data = await staffWorkersService.getWorker(uid);

      if (data && !data.clubId) {
        data.clubId = clubId || user?.homeClubId || '';
      }

      setWorker(data);
      setLoading(false);
    };

    load();
  }, [uid, clubId]);

  const handleUpdate = async (formData: Partial<StaffWorker>) => {
    setSaving(true);
    try {
      await staffWorkersService.updateWorker(uid, formData);
      onBack();
    } catch (err) {
      alert("Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 size={48} className="animate-spin text-emerald-600" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          Caricamento Profilo...
        </p>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="p-12 text-center text-slate-400 font-bold uppercase">
        Operaio non trovato.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-200 px-8 py-6 flex items-center gap-4 shrink-0">
        <button 
          onClick={onBack} 
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-700"
        >
          <ArrowLeft size={20}/>
        </button>
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">
            Modifica Profilo
          </h1>
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">
            {worker.displayName}
          </p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <div className="max-w-6xl mx-auto">
          <WorkerForm 
            initialData={worker}
            isLoading={saving}
            onSubmit={handleUpdate}
            onCancel={onBack}
            currentUserRole={user?.role || 'golf_club_admin'}
            isCreation={false}
          />
        </div>
      </main>
    </div>
  );
};