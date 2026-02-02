import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  deleteDoc, 
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  ArrowLeft, 
  Users, 
  Plus, 
  Trash2, 
  Mail, 
  ShieldCheck, 
  MapPin, 
  Edit2, 
  X, 
  Key, 
  Loader2,
  Save,
  User,
  Clock
} from 'lucide-react';
import { Language, UserProfile, TeamMember } from '../../types';
import { dbAuth } from '../../services/firebase';


interface TeamManagementProps {
  user: UserProfile | null;
  onBack: () => void;
  lang: Language;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({ user, onBack, lang }) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'marshall' as any,
    playTrackEnabled: true
  });

  const clubId = user?.homeClubId || 'club_pinetina';

  const fetchMembers = async () => {
    if (!dbAuth) return;
    setLoading(true);
    try {
      // REQUISITO: Filtrare utenti solo se role === "marshall"
      const q = query(collection(dbAuth, 'users'), 
                      where('homeClubId', '==', clubId),
                      where('role', '==', 'marshall'));
      
      const snap = await getDocs(q);
      const list: TeamMember[] = snap.docs
        .filter(d => d.id !== user?.uid) 
        .map(d => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name || data.displayName || 'Marshall',
            email: data.email || '',
            role: 'editor', 
            lastActive: data.lastSeen ? new Date(data.lastSeen.seconds * 1000).toLocaleDateString() : 'Mai',
            playTrackEnabled: true
          };
        });
      setMembers(list);
    } catch (e) {
      console.error("Error fetching team:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [clubId]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ name: '', email: '', password: '', role: 'marshall', playTrackEnabled: true });
    setShowModal(true);
  };

  const handleOpenEdit = (m: TeamMember) => {
    setEditingId(m.id);
    setFormData({ 
      name: m.name, 
      email: m.email, 
      password: '', 
      role: 'marshall', 
      playTrackEnabled: true 
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbAuth) return;
    setIsSubmitting(true);

    try {
      if (!editingId) {
        // CREA NUOVO MARSHALL
        const newUserRef = doc(collection(dbAuth, 'users'));
        const payload: any = {
          name: formData.name,
          email: formData.email,
          role: 'marshall',
          homeClubId: clubId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        if (formData.password) payload.tempPassword = formData.password;
  await setDoc(newUserRef, payload);
} else {

        const userRef = doc(dbAuth, 'users', editingId);
        // REQUISITO: Forza role: "marshall" e usa name: formData.name
        const payload: any = {
          name: formData.name,
          email: formData.email,
          role: 'marshall',
          homeClubId: clubId,
          updatedAt: serverTimestamp()
        };
        if (formData.password) payload.tempPassword = formData.password;
        await setDoc(userRef, payload, { merge: true });
      }
      
      setShowModal(false);
      fetchMembers();
    } catch (e: any) {
      alert(lang === 'it' ? `Errore: ${e.message}` : `Error: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!dbAuth) return;
    if (window.confirm(lang === 'it' ? 'Rimuovere definitivamente questo utente dallo staff?' : 'Permanently remove this staff member?')) {
      try {
        await deleteDoc(doc(dbAuth, 'users', id));
        fetchMembers();
      } catch {
        alert("Errore durante l'eliminazione.");
      }
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col font-sans overflow-hidden">
      <header className="bg-purple-900 text-white shadow-lg flex-shrink-0 z-20">
        <div className="w-full px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <button onClick={onBack} className="p-2 -ml-2 hover:bg-purple-800 rounded-full transition-colors mr-2">
               <ArrowLeft size={20} />
             </button>
             <div className="bg-white/10 p-2 rounded-lg">
                <Users size={20} className="text-purple-300" />
             </div>
             <div>
                <h1 className="text-lg font-bold leading-tight">Gestione Team</h1>
                <p className="text-xs text-purple-200 uppercase tracking-wider opacity-80">Collaboratori & Staff</p>
             </div>
          </div>
          
          <button 
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-purple-500 hover:bg-purple-400 text-white px-5 py-2.5 rounded-xl transition-all text-sm font-black uppercase tracking-widest shadow-lg active:scale-95"
          >
            <Plus size={18} />
            <span>Nuovo Membro</span>
          </button>
        </div>
      </header>

      <main className="flex-1 w-full mx-auto p-6 overflow-y-auto">
         <div className="bg-white rounded-[2rem] shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
                <div className="p-20 flex flex-col items-center justify-center gap-4 text-purple-600/50">
                    <Loader2 size={40} className="animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Sincronizzazione staff...</span>
                </div>
            ) : (
                <div className="divide-y divide-gray-100">
                    {members.length === 0 && (
                        <div className="p-16 text-center text-gray-400 uppercase font-black text-xs tracking-[0.2em]">Nessun Marshall nel team operativo</div>
                    )}
                    {members.map(member => (
                        <div key={member.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50/50 transition-colors group gap-6">
                            <div className="flex items-center gap-5">
                                <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center font-black text-xl border-2 transition-all group-hover:scale-105 bg-purple-50 text-purple-600 border-purple-100 shadow-purple-100/50`}>
                                    {member.name.charAt(0)}
                                </div>
                                <div className="space-y-1">
                                    <div className="font-black text-gray-900 text-lg flex items-center gap-3">
                                        {member.name}
                                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[8px] font-black uppercase border border-emerald-200 flex items-center gap-1">
                                            <MapPin size={8} /> STAFF MARSHALL
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center gap-3 font-medium">
                                        <div className="flex items-center gap-1"><Mail size={12} className="text-gray-400" /> {member.email}</div>
                                        <span className="text-gray-300">|</span>
                                        <div className="flex items-center gap-1"><Clock size={12} className="text-gray-400" /> Last Login: {member.lastActive}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border bg-blue-50 text-blue-700 border-blue-100`}>
                                    Operatore Staff
                                </span>
                                <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
                                    <button 
                                        onClick={() => handleOpenEdit(member)} 
                                        className="p-2 text-gray-500 hover:text-purple-600 hover:bg-white rounded-lg transition-all shadow-sm"
                                        title="Modifica"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button 
                                        onClick={() => handleRemove(member.id)} 
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-all shadow-sm"
                                        title="Elimina"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
         </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="p-8 bg-purple-900 text-white flex items-center justify-between relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-2xl font-black uppercase tracking-tighter">{editingId ? 'Modifica Marshall' : 'Nuovo Marshall'}</h2>
                        <p className="text-purple-200 text-[10px] font-bold uppercase tracking-widest mt-1 opacity-80">Registrazione Staff Operativo</p>
                    </div>
                    <button onClick={() => setShowModal(false)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors relative z-10"><X size={24} /></button>
                    <Users className="absolute -right-4 -bottom-4 text-white/5 w-32 h-32" />
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-6">
                    <div className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Nome Marshall</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                    required
                                    type="text" 
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500/50 outline-none transition-all"
                                    placeholder="es. Mario Rossi"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Email Accesso</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                    required
                                    disabled={!!editingId}
                                    type="email" 
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500/50 outline-none transition-all disabled:opacity-40"
                                    placeholder="email@golfpinetina.it"
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Password</label>
                            <div className="relative">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                    required={!editingId}
                                    type="text" 
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500/50 outline-none transition-all"
                                    placeholder="Almeno 6 caratteri"
                                    value={formData.password}
                                    onChange={e => setFormData({...formData, password: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-8">
                        <button 
                            type="button"
                            onClick={() => setShowModal(false)} 
                            className="flex-1 py-4 text-gray-400 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-gray-50 rounded-2xl transition-colors border border-transparent hover:border-gray-200"
                        >
                            Annulla
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="flex-[2] py-4 px-8 bg-purple-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-purple-700 shadow-2xl shadow-purple-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            {editingId ? 'Aggiorna Marshall' : 'Registra Marshall'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};