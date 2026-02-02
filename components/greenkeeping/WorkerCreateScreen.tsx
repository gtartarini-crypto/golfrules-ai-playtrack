import React, { useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Language, StaffWorker, UserProfile } from '../../types';
import { staffWorkersService } from '../../services/staffWorkers.service';
import { WorkerForm } from './WorkerForm';

interface Props {
  clubId: string;
  onBack: () => void;
  lang: Language;
  user: UserProfile | null;
}

export const WorkerCreateScreen: React.FC<Props> = ({ clubId, onBack, lang, user }) => {
  const [saving, setSaving] = useState(false);

  const handleCreate = async (formData: Partial<StaffWorker>) => {
    setSaving(true);
    try {
      // Fix: Removed 'createdBy' property from createWorker call as it's not defined in Partial<StaffWorker>
      await staffWorkersService.createWorker({
        ...formData,
        clubId,
        createdAt: Date.now()
      });
      onBack();
    } catch (err) {
      alert("Errore durante la creazione del profilo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans">
      
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 px-8 py-6 flex items-center gap-4 shrink-0">
        <button 
          onClick={onBack} 
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-700"
        >
          <ArrowLeft size={20}/>
        </button>
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">
            Nuovo Operaio
          </h1>
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">
            Creazione Profilo
          </p>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <div className="max-w-6xl mx-auto">
          <WorkerForm 
            initialData={null}
            isLoading={saving}
            onSubmit={handleCreate}
            onCancel={onBack}
            currentUserRole={user?.role || 'golf_club_admin'}
            isCreation={true}
          />
        </div>
      </main>
    </div>
  );
};