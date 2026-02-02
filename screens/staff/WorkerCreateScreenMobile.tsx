
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { WorkerFormMobile } from '../../components/staff/WorkerFormMobile';
import { staffWorkersService } from '../../services/staffWorkers.service';

export const WorkerCreateScreenMobile = ({ onBack, params }: any) => {
  const { uid, email, clubId, currentUserRole } = params;

  const handleSubmit = async (formData: any) => {
    await staffWorkersService.createWorker({
      ...formData,
      uid,
      email,
      clubId
    });
    alert("Profilo creato con successo");
    onBack();
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <header className="px-6 py-5 border-b border-slate-100 flex items-center gap-4 shrink-0">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-400"><ArrowLeft size={24} /></button>
        <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Completa Profilo</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        <WorkerFormMobile 
          initialData={{ email, role: 'grounds_worker', active: true }}
          onSubmit={handleSubmit}
          currentUserRole={currentUserRole}
        />
      </div>
    </div>
  );
};
