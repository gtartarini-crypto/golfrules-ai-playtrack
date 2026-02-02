
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { WorkerFormMobile } from '../../components/staff/WorkerFormMobile';
import { staffWorkersService } from '../../services/staffWorkers.service';

export const WorkerEditorScreenMobile = ({ onBack, params }: any) => {
  const { uid, currentUserRole } = params;
  const [worker, setWorker] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    staffWorkersService.getWorker(uid).then(data => {
      setWorker(data);
      setLoading(false);
    });
  }, [uid]);

  const handleSubmit = async (data: any) => {
    await staffWorkersService.updateWorker(uid, data);
    alert("Profilo aggiornato");
    onBack();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
        <Loader2 size={40} className="animate-spin text-emerald-500" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Caricamento...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <header className="px-6 py-5 border-b border-slate-100 flex items-center gap-4 shrink-0">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-400"><ArrowLeft size={24} /></button>
        <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Modifica Profilo</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        <WorkerFormMobile 
          initialData={worker}
          onSubmit={handleSubmit}
          currentUserRole={currentUserRole}
          isEdit
        />
      </div>
    </div>
  );
};
