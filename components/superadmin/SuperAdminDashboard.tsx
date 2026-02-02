import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, LogOut, Search, Building2, CheckCircle, XCircle, Calendar, Edit2, Save, Loader2, Database, Terminal, Wifi, RotateCcw, Activity } from 'lucide-react';
import { LocalRulesData, UserProfile, SubscriptionTier, SubscriptionStatus, AppView } from '../../types';
import { getAllClubs, updateClubSubscription, seedFirestoreDatabase, checkFirestoreConnection, fixPinetinaData } from '../../services/firebase';
import { APP_NAME } from '../../constants';

interface SuperAdminDashboardProps {
  user: UserProfile | null;
  onLogout: () => void;
  lang: string;
  onNavigate?: (view: AppView) => void;
}

interface ClubRow {
    id: string;
    data: LocalRulesData;
    isEditing: boolean;
    tempTier?: SubscriptionTier;
    tempStatus?: SubscriptionStatus;
    tempExpiry?: string;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ user, onLogout, lang, onNavigate }) => {
  const [clubs, setClubs] = useState<ClubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchClubs();
  }, []);

  useEffect(() => {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [debugLogs]);

  const addLog = (msg: string) => {
      setDebugLogs(prev => [...prev, msg]);
  };

  const fetchClubs = async () => {
      setLoading(true);
      try {
          const data = await getAllClubs();
          const rows: ClubRow[] = data.map(c => ({
              id: c.id,
              data: c.data,
              isEditing: false
          }));
          setClubs(rows);
      } catch (e) {
          addLog("Errore nel caricamento club.");
      }
      setLoading(false);
  };

  const handleTestConnection = async () => {
      setDebugLogs([]);
      setSeeding(true);
      try {
          await checkFirestoreConnection(addLog);
      } catch (e: any) {
          addLog(`Eccezione UI: ${e.message}`);
      }
      setSeeding(false);
  };

  const handleFixPinetina = async () => {
      setDebugLogs([]);
      setSeeding(true);
      try {
          const success = await fixPinetinaData(addLog);
          if (success) {
              await fetchClubs();
          }
      } catch (e: any) {
          addLog(`Eccezione UI: ${e.message}`);
      }
      setSeeding(false);
  };

  const handleSeedDatabase = async () => {
      if(!window.confirm("Attenzione: Questo creerà/sovrascriverà i dati di esempio nelle collezioni 'clubs' e 'users'. Continuare?")) return;
      
      setDebugLogs([]);
      setSeeding(true);
      
      try {
          const success = await seedFirestoreDatabase(addLog);
          if(success) {
              fetchClubs();
          }
      } catch (e: any) {
          addLog(`EXCEPTION: ${e.message}`);
      }
      
      setSeeding(false);
  };

  const startEdit = (id: string) => {
      setClubs(prev => prev.map(c => {
          if (c.id === id) {
              return {
                  ...c,
                  isEditing: true,
                  tempTier: c.data.subscription?.tier || 'base',
                  tempStatus: c.data.subscription?.status || 'active',
                  tempExpiry: c.data.subscription?.expiryDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
              };
          }
          return c;
      }));
  };

  const cancelEdit = (id: string) => {
      setClubs(prev => prev.map(c => c.id === id ? { ...c, isEditing: false } : c));
  };

  const saveEdit = async (id: string) => {
      const club = clubs.find(c => c.id === id);
      if (!club || !club.tempTier || !club.tempStatus) return;

      const newSub = {
          tier: club.tempTier,
          status: club.tempStatus,
          expiryDate: club.tempExpiry
      };

      try {
          await updateClubSubscription(id, newSub);
          
          setClubs(prev => prev.map(c => {
              if (c.id === id) {
                  return {
                      ...c,
                      isEditing: false,
                      data: {
                          ...c.data,
                          subscription: newSub
                      }
                  };
              }
              return c;
          }));
      } catch (e) {
          alert("Failed to update subscription");
      }
  };

  const filteredClubs = clubs.filter(c => {
      const clubName = (c.data?.club || "").toLowerCase();
      const adminEmail = (c.data?.adminEmail || "").toLowerCase();
      const term = searchTerm.toLowerCase();
      return clubName.includes(term) || adminEmail.includes(term) || c.id.toLowerCase().includes(term);
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="bg-purple-500/20 p-2 rounded-lg border border-purple-500/50">
                <ShieldCheck size={24} className="text-purple-400" />
             </div>
             <div>
                <h1 className="text-xl font-bold leading-tight">Super Admin Portal</h1>
                <p className="text-xs text-slate-400 uppercase tracking-wider">{APP_NAME}</p>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
             <button 
               onClick={() => onNavigate && onNavigate('debug_dashboard')}
               className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg transition-colors text-xs font-medium border border-emerald-500 shadow-sm"
             >
               <Activity size={16} />
               <span>Debug System</span>
             </button>
             <button 
               onClick={onLogout}
               className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-lg transition-colors text-xs font-medium border border-slate-700"
             >
               <LogOut size={16} />
               <span>Logout</span>
             </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        
        <div className="mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Database Tools</h2>
                    <p className="text-sm text-gray-500">Gestione e migrazione dati (Golfrules & Clublink)</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                    <button 
                        onClick={handleTestConnection}
                        disabled={seeding}
                        className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-xl font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
                    >
                        <Wifi size={18} />
                        Test
                    </button>

                    <button 
                        onClick={handleFixPinetina}
                        disabled={seeding}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
                    >
                        {seeding ? <Loader2 size={18} className="animate-spin" /> : <RotateCcw size={18} />}
                        Fix La Pinetina
                    </button>

                    <button 
                        onClick={handleSeedDatabase}
                        disabled={seeding}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
                    >
                        <Database size={18} />
                        Seed DB
                    </button>
                </div>
            </div>

            <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs overflow-hidden shadow-inner border border-slate-700">
                <div className="flex items-center gap-2 text-slate-400 mb-2 border-b border-slate-700 pb-2">
                    <Terminal size={14} />
                    <span>System Output</span>
                </div>
                <div className="h-40 overflow-y-auto space-y-1 text-emerald-400">
                    {debugLogs.length === 0 ? (
                        <span className="text-slate-600 italic">// Console pronta. Usa 'Fix La Pinetina' per correggere i nomi nel DB.</span>
                    ) : (
                        debugLogs.map((log, i) => (
                            <div key={i} className={`${log.includes('ERRORE') || log.includes('FAILURE') || log.includes('Eccezione') ? 'text-red-400' : (log.includes('SUCCESSO') ? 'text-green-300 font-bold' : 'text-emerald-400')}`}>
                                &gt; {log}
                            </div>
                        ))
                    )}
                    <div ref={logsEndRef} />
                </div>
            </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Building2 className="text-slate-500" size={20} />
                    Club Registrati
                </h2>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Cerca club..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-purple-500"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                {loading ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="animate-spin text-purple-600" size={32} />
                    </div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase">
                            <tr>
                                <th className="px-6 py-4">Club</th>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Piano</th>
                                <th className="px-6 py-4">Stato</th>
                                <th className="px-6 py-4 text-right">Azioni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredClubs.map(club => (
                                <tr key={club.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{club.data.club || 'N/D'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <code className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{club.id}</code>
                                    </td>
                                    <td className="px-6 py-4">
                                        {club.isEditing ? (
                                            <select 
                                                value={club.tempTier}
                                                onChange={(e) => setClubs(prev => prev.map(c => c.id === club.id ? { ...c, tempTier: e.target.value as SubscriptionTier } : c))}
                                                className="p-1 border rounded text-xs"
                                            >
                                                <option value="base">BASE</option>
                                                <option value="premium">PREMIUM</option>
                                            </select>
                                        ) : (
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${club.data.subscription?.tier === 'premium' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {club.data.subscription?.tier || 'base'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1">
                                            {club.data.subscription?.status === 'active' ? <CheckCircle size={14} className="text-emerald-500" /> : <XCircle size={14} className="text-red-400" />}
                                            <span className="text-xs font-bold uppercase">{club.data.subscription?.status || 'active'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {club.isEditing ? (
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => saveEdit(club.id)} className="p-1.5 bg-emerald-500 text-white rounded hover:bg-emerald-600"><Save size={14} /></button>
                                                <button onClick={() => cancelEdit(club.id)} className="p-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"><XCircle size={14} /></button>
                                            </div>
                                        ) : (
                                            <button onClick={() => startEdit(club.id)} className="p-1.5 text-slate-400 hover:text-purple-600"><Edit2 size={14} /></button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
      </main>
    </div>
  );
};