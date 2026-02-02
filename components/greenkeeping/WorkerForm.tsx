import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { StaffWorker } from '../../types';

interface Props {
  initialData: StaffWorker | null;
  isLoading: boolean;
  onSubmit: (data: Partial<StaffWorker>) => void;
  onCancel: () => void;
  currentUserRole: string;
  isCreation: boolean;
}

export const WorkerForm: React.FC<Props> = ({
  initialData,
  isLoading,
  onSubmit,
  onCancel,
  currentUserRole,
  isCreation
}) => {
  const [form, setForm] = useState<Partial<StaffWorker>>({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    displayName: initialData?.displayName || '',
    role: initialData?.role || 'grounds_worker',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    mobile: initialData?.mobile || '',
    addressLine1: initialData?.addressLine1 || '',
    addressLine2: initialData?.addressLine2 || '',
    city: initialData?.city || '',
    postalCode: initialData?.postalCode || '',
    dateOfBirth: initialData?.dateOfBirth || '',
    niNumber: initialData?.niNumber || '',
    medicalInfo: initialData?.medicalInfo || '',
    notes: initialData?.notes || '',
    password: ''
  });

  const updateField = (field: keyof StaffWorker, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10 text-slate-900 pb-20">

      {/* SEZIONE 1: IDENTITÀ & RUOLO */}
      <section className="space-y-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-emerald-600 border-b border-emerald-100 pb-2">Identità & Ruolo</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-[10px] font-black uppercase mb-2 text-slate-400">Nome *</label>
            <input
              type="text"
              value={form.firstName}
              onChange={e => updateField('firstName', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white font-bold"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase mb-2 text-slate-400">Cognome *</label>
            <input
              type="text"
              value={form.lastName}
              onChange={e => updateField('lastName', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white font-bold"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase mb-2 text-slate-400">Ruolo Operativo</label>
            <select
              value={form.role}
              onChange={e => updateField('role', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white font-bold"
            >
              <option value="grounds_worker">Grounds Worker (Operaio)</option>
              <option value="greenkeeper">Greenkeeper (Supervisor)</option>
              <option value="marshall">Marshall</option>
              <option value="golf_club_admin">Direzione / Admin</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-black uppercase mb-2 text-slate-400">Nome Visualizzato (Nickname)</label>
            <input
              type="text"
              value={form.displayName}
              onChange={e => updateField('displayName', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white font-bold"
              placeholder="Esempio: Mario R."
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase mb-2 text-slate-400">Data di nascita</label>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={e => updateField('dateOfBirth', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white font-bold"
            />
          </div>
        </div>
      </section>

      {/* SEZIONE 2: CONTATTI & ACCESSO */}
      <section className="space-y-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-emerald-600 border-b border-emerald-100 pb-2">Contatti & Accesso</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-[10px] font-black uppercase mb-2 text-slate-400">Email di Accesso *</label>
            <input
              type="email"
              value={form.email}
              onChange={e => updateField('email', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white font-bold"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase mb-2 text-slate-400">Cellulare Operativo</label>
            <input
              type="text"
              value={form.mobile}
              onChange={e => updateField('mobile', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white font-bold"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase mb-2 text-slate-400">Telefono Fisso</label>
            <input
              type="text"
              value={form.phone}
              onChange={e => updateField('phone', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white font-bold"
            />
          </div>
        </div>
        {isCreation && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-[10px] font-black uppercase mb-2 text-slate-400">Password Iniziale</label>
              <input
                type="password"
                value={form.password}
                onChange={e => updateField('password', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white font-bold"
                required
                placeholder="Minimo 6 caratteri"
              />
            </div>
          </div>
        )}
      </section>

      {/* SEZIONE 3: INDIRIZZO & FISCALE */}
      <section className="space-y-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-emerald-600 border-b border-emerald-100 pb-2">Residenza & Dati Fiscali</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-black uppercase mb-2 text-slate-400">Indirizzo (Via/Piazza e n°)</label>
            <input
              type="text"
              value={form.addressLine1}
              onChange={e => updateField('addressLine1', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white font-bold"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase mb-2 text-slate-400">Indirizzo riga 2 (Appartamento, interno, ecc.)</label>
            <input
              type="text"
              value={form.addressLine2}
              onChange={e => updateField('addressLine2', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white font-bold"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-[10px] font-black uppercase mb-2 text-slate-400">Città</label>
            <input
              type="text"
              value={form.city}
              onChange={e => updateField('city', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white font-bold"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase mb-2 text-slate-400">CAP</label>
            <input
              type="text"
              value={form.postalCode}
              onChange={e => updateField('postalCode', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white font-bold"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase mb-2 text-slate-400">Codice Fiscale / NI Number</label>
            <input
              type="text"
              value={form.niNumber}
              onChange={e => updateField('niNumber', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white font-bold uppercase"
            />
          </div>
        </div>
      </section>

      {/* SEZIONE 4: INFORMAZIONI AGGIUNTIVE */}
      <section className="space-y-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-rose-600 border-b border-rose-100 pb-2">Informazioni Riservate</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-black uppercase mb-2 text-slate-400">Note Aziendali</label>
            <textarea
              value={form.notes}
              onChange={e => updateField('notes', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white font-medium h-32 outline-none focus:border-emerald-500 transition-all"
              placeholder="Inserisci note interne..."
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase mb-2 text-rose-400">Informazioni Mediche / Emergenze</label>
            <textarea
              value={form.medicalInfo}
              onChange={e => updateField('medicalInfo', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-900 font-medium h-32 outline-none focus:border-rose-400 transition-all shadow-inner"
              placeholder="Allergie, patologie o contatti d'emergenza..."
            />
          </div>
        </div>
      </section>

      {/* FOOTER AZIONI */}
      <div className="flex items-center justify-end gap-4 pt-10 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-8 py-4 rounded-2xl border border-slate-300 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
        >
          Annulla
        </button>

        <button
          type="submit"
          disabled={isLoading}
          className="px-10 py-4 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest shadow-2xl shadow-emerald-500/30 hover:bg-emerald-700 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            isCreation ? 'Registra Operaio' : 'Salva Modifiche'
          )}
        </button>
      </div>

    </form>
  );
};