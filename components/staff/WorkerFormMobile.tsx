
import React, { useState } from 'react';
import { User, Phone, MapPin, Briefcase, Info, Save, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { StaffRole } from '../../types/StaffTypes';

interface Props {
  initialData: any;
  onSubmit: (data: any) => Promise<void>;
  currentUserRole: StaffRole;
  isEdit?: boolean;
}

export const WorkerFormMobile: React.FC<Props> = ({ initialData, onSubmit, currentUserRole, isEdit }) => {
  const [form, setForm] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState({ identity: true, contacts: false, address: false, pro: false });

  const toggleSection = (s: keyof typeof sections) => setSections(prev => ({ ...prev, [s]: !prev[s] }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await onSubmit(form);
    } catch (err) {
      alert("Errore durante il salvataggio");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all placeholder:text-slate-300";
  const labelClass = "text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2 block";
  const sectionHeaderClass = "flex items-center justify-between p-6 bg-white border-b border-slate-50 cursor-pointer select-none";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 pb-24">
      {/* IDENTITA */}
      <div className="bg-white border-b border-slate-100 overflow-hidden">
        <div className={sectionHeaderClass} onClick={() => toggleSection('identity')}>
          <div className="flex items-center gap-3 text-emerald-600">
            <User size={20} />
            <h3 className="font-black text-xs uppercase tracking-widest">Identità</h3>
          </div>
          {sections.identity ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
        {sections.identity && (
          <div className="p-6 space-y-5 animate-in slide-in-from-top-2">
            <div>
              <label className={labelClass}>Ruolo Operativo</label>
              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                {['grounds_worker', 'greenkeeper'].map(r => (
                  <button 
                    key={r}
                    type="button"
                    onClick={() => setForm({...form, role: r})}
                    className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase transition-all ${form.role === r ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    {r === 'greenkeeper' ? 'Supervisor' : 'Operaio'}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nome *</label>
                <input required className={inputClass} value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
              </div>
              <div>
                <label className={labelClass}>Cognome *</label>
                <input required className={inputClass} value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Data di Nascita</label>
              <input type="date" className={inputClass} value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth: e.target.value})} />
            </div>
          </div>
        )}
      </div>

      {/* CONTATTI */}
      <div className="bg-white border-b border-slate-100 overflow-hidden">
        <div className={sectionHeaderClass} onClick={() => toggleSection('contacts')}>
          <div className="flex items-center gap-3 text-emerald-600">
            <Phone size={20} />
            <h3 className="font-black text-xs uppercase tracking-widest">Contatti</h3>
          </div>
          {sections.contacts ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
        {sections.contacts && (
          <div className="p-6 space-y-5 animate-in slide-in-from-top-2">
            <div>
              <label className={labelClass}>Email Accesso</label>
              <input readOnly className={`${inputClass} opacity-50`} value={form.email} />
            </div>
            <div>
              <label className={labelClass}>Cellulare *</label>
              <input required type="tel" className={inputClass} value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} placeholder="+39..." />
            </div>
          </div>
        )}
      </div>

      <div className="p-6">
        <button 
          type="submit"
          disabled={loading}
          className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {isEdit ? 'Aggiorna Profilo' : 'Crea Profilo'}
        </button>
      </div>
    </form>
  );
};
