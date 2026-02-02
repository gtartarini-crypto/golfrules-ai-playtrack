import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Users, Radio, Activity, MapPin, Clock, RefreshCw, Shield, Mail, Database, Loader2, Terminal, Code, FlaskConical } from 'lucide-react';
import { subscribeActiveFlights, getAllUsers, subscribeDiagnostics } from '../../services/firebase';
import { Language } from '../../types';
import { TestLab } from '../TestLab';

interface DebugDashboardProps {
  onBack: () => void;
  lang: Language;
}

export const DebugDashboard: React.FC<DebugDashboardProps> = ({ onBack, lang }) => {
  const [activeFlights, setActiveFlights] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'flights' | 'users' | 'diagnostics' | 'test'>('flights');
  
  const logsEndRef = useRef<HTMLDivElement>(null);

  const fetchUsers = async () => {
    setIsRefreshing(true);
    try {
      const usersData = await getAllUsers();
      setUsers(usersData);
      setLastRefresh(new Date());
    } catch (e) {
      console.error("User fetch error:", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Real-time listener for flights
    const unsubFlights = subscribeActiveFlights((flights) => {
        setActiveFlights(flights);
        setLoading(false);
    });

    // Real-time listener for diagnostics
    const unsubLogs = subscribeDiagnostics((logs) => {
        setSystemLogs(logs);
    });

    fetchUsers();
    const interval = setInterval(fetchUsers, 15000);

    return () => {
        unsubFlights();
        unsubLogs();
        clearInterval(interval);
    };
  }, []);

  useEffect(() => {
      if (activeTab === 'diagnostics') {
          logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
  }, [systemLogs, activeTab]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans overflow-hidden">
      <header className="bg-slate-900 border-b border-white/10 px-6 py-4 flex items-center justify-between z-30 shadow-2xl flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 hover:bg-white/5 rounded-xl transition-colors text-slate-400">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight uppercase leading-none">System Diagnostic</h1>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-emerald-400 tracking-widest mt-1">
              <Activity size={12} /> GOLFRULES & PLAYTRACK LIVE
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-xl">
            <button onClick={() => setActiveTab('flights')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'flights' ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'}`}>Flights</button>
            <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'users' ? 'bg-blue-50 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'}`}>Users</button>
            <button onClick={() => setActiveTab('diagnostics')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'diagnostics' ? 'bg-purple-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'}`}>Diagnostics</button>
            <button onClick={() => setActiveTab('test')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'test' ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'}`}>Test Lab</button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 scrollbar-hide bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
        
        {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Connecting to real-time streams...</p>
            </div>
        ) : (
            <div className="w-full mx-auto">
                
                {activeTab === 'flights' && (
                    <section className="space-y-4 animate-in fade-in duration-500">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2">
                                <Radio size={14} className="text-emerald-500" /> LIVE GPS POSITIONS ({activeFlights.length})
                            </h2>
                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                                Real-time Active
                            </div>
                        </div>
                        <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-xl shadow-2xl">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-white/5 text-slate-400 font-black uppercase tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">Player / Flight</th>
                                        <th className="px-6 py-4">Coords</th>
                                        <th className="px-6 py-4">Detected Area</th>
                                        <th className="px-6 py-4">Source</th>
                                        <th className="px-6 py-4">Last Ping</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {activeFlights.map(flight => (
                                        <tr key={flight.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="font-black text-slate-100">{flight.playerName || 'Unknown'}</div>
                                                <div className="text-[9px] text-slate-500 uppercase tracking-tighter">ID: {flight.flightNumber || flight.id}</div>
                                            </td>
                                            <td className="px-6 py-5 font-mono text-emerald-400/70">
                                                {flight.location?.latitude?.toFixed(6)}, {flight.location?.longitude?.toFixed(6)}
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg font-black uppercase tracking-tighter text-[10px]">
                                                    {flight.currentArea || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">{flight.appSource || 'Manual'}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                                                    <span className="text-slate-300 font-bold">
                                                        {flight.lastUpdate?.toMillis ? new Date(flight.lastUpdate.toMillis()).toLocaleTimeString() : 'Recently'}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {activeFlights.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500 uppercase font-black tracking-widest opacity-30">
                                                No active GPS streams detected in golfrules-ai---playtrack
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {activeTab === 'users' && (
                    <section className="space-y-4 animate-in fade-in duration-500">
                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2">
                            <Users size={14} className="text-blue-500" /> REGISTERED ACCOUNTS ({users.length})
                        </h2>
                        <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-xl shadow-2xl">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-white/5 text-slate-400 font-black uppercase tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">User Profile</th>
                                        <th className="px-6 py-4">Auth Email</th>
                                        <th className="px-6 py-4">Current Role</th>
                                        <th className="px-6 py-4">Assigned Club</th>
                                        <th className="px-6 py-4">Last Activity</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {users.sort((a,b) => (b.lastSeen?.seconds || 0) - (a.lastSeen?.seconds || 0)).map(u => (
                                        <tr key={u.id} className={`hover:bg-white/5 transition-colors ${u.email === 'lumix4k@gmail.com' ? 'bg-blue-500/5 border-l-4 border-blue-500' : ''}`}>
                                            <td className="px-6 py-5">
                                                <div className="font-black text-slate-100">{u.displayName || 'Utente'}</div>
                                                <div className="text-[9px] text-slate-500 uppercase tracking-tighter">UID: {u.id}</div>
                                            </td>
                                            <td className="px-6 py-5 text-slate-300 font-medium">
                                                {u.email}
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`px-2 py-1 rounded-lg font-black uppercase text-[10px] ${
                                                    u.role === 'sys_admin' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/20' :
                                                    u.role === 'club_admin' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' :
                                                    'bg-slate-500/20 text-slate-400 border border-slate-500/20'
                                                }`}>
                                                    {u.role || 'player'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 font-mono text-slate-500 text-[10px]">
                                                {u.homeClubId || 'N/A'}
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-slate-400 font-bold">
                                                    {u.lastSeen?.seconds ? new Date(u.lastSeen.seconds * 1000).toLocaleString() : 'N/A'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {activeTab === 'diagnostics' && (
                    <section className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2">
                                <Terminal size={14} className="text-purple-500" /> LIVE SYSTEM DIAGNOSTICS (LOG_LEVEL: INFO)
                            </h2>
                            <button onClick={() => setSystemLogs([])} className="text-[9px] font-black uppercase text-slate-600 hover:text-white transition-colors">Clear Console</button>
                        </div>
                        <div className="bg-slate-900 border border-white/10 rounded-[2rem] p-6 font-mono text-[10px] h-[65vh] overflow-y-auto scrollbar-hide shadow-inner relative">
                            <div className="space-y-2">
                                {systemLogs.map((log, i) => (
                                    <div key={log.id || i} className="border-b border-white/5 pb-2 animate-in fade-in slide-in-from-left-2">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-slate-600">[{log.timestamp?.toMillis ? new Date(log.timestamp.toMillis()).toLocaleTimeString() : '...'} / {log.timestamp?.toMillis ? new Date(log.timestamp.toMillis()).getMilliseconds() : '000'}ms]</span>
                                            <span className={`font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                                                log.event === 'FLIGHT_ACTIVATED' ? 'bg-emerald-50 text-slate-950' :
                                                log.event === 'POSITION_SYNC_REQUEST' ? 'bg-blue-50 text-slate-950' :
                                                log.event === 'GPS_UPDATE' ? 'bg-amber-50 text-slate-950' :
                                                log.event === 'UI_POSITION_UPDATE' ? 'bg-indigo-50 text-slate-950' :
                                                'bg-slate-700 text-white'
                                            }`}>
                                                {log.event}
                                            </span>
                                        </div>
                                        <div className="pl-4 text-slate-400 space-y-0.5 overflow-x-auto whitespace-pre">
                                            {log.event === 'FLIGHT_ACTIVATED' && `• flightNumber: ${log.flightNumber}\n• userId: ${log.userId}\n• docPath: ${log.docPath}`}
                                            {log.event === 'POSITION_SYNC_REQUEST' && `• flightNumber: ${log.flightNumber}\n• lat/lng: ${log.lat}, ${log.lng}\n• accuracy: ${log.accuracy}m | heading: ${log.heading}° | speed: ${log.speed}m/s\n• docPath: ${log.docPath}`}
                                            {log.event === 'GPS_UPDATE' && `• lat/lng: ${log.lat}, ${log.lng}\n• accuracy: ${log.accuracy}m | heading: ${log.heading}° | speed: ${log.speed}m/s`}
                                            {log.event === 'FLIGHT_NUMBER_USED' && `• flightNumber: ${log.flightNumber}\n• context: ${log.context}`}
                                            {log.event === 'CHECK_DOC_EXISTENCE' && `• docPath: ${log.docPath}\n• exists: ${log.exists}`}
                                            {log.event === 'UI_POSITION_UPDATE' && `• flightNumber: ${log.flightNumber}\n• lat/lng: ${log.lat}, ${log.lng}`}
                                            {log.event === 'FIRESTORE_UPDATE' && `• docPath: ${log.docPath}\n• outcome: ${log.outcome} ${log.error ? `\n• error: ${log.error}` : ''}`}
                                            {log.event === 'QR_READ' && `• raw: ${log.rawData}\n• clubId: ${log.clubId}\n• action: ${log.action}`}
                                        </div>
                                    </div>
                                ))}
                                {systemLogs.length === 0 && (
                                    <div className="h-full flex items-center justify-center opacity-20 flex-col gap-4">
                                        <Code size={48} />
                                        <span className="font-black uppercase tracking-[0.3em]">Listening for system events...</span>
                                    </div>
                                )}
                                <div ref={logsEndRef} />
                            </div>
                        </div>
                    </section>
                )}

                {activeTab === 'test' && (
                    <section className="animate-in fade-in duration-500">
                        <TestLab />
                    </section>
                )}

            </div>
        )}
      </main>

      <footer className="bg-slate-900 border-t border-white/10 px-6 py-4 flex justify-between items-center z-30 flex-shrink-0">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">ClubLink System Debug Console - REAL DATA STREAMING ACTIVE</span>
      </footer>
    </div>
  );
};