import React, { useState, useEffect } from 'react';
import {
  AppView, Language, UserProfile, LocalRulesData,
  ChatMessage, GameContext
} from '../types';

import {
  ShieldCheck, LogOut,
  Map as MapIcon, Flag, Activity, Users, QrCode,
  Building2, Clock, Globe, Terminal,
  Download, BarChart3, HardHat,
  CheckCircle2, HeartPulse
} from 'lucide-react';

import { LandingPage } from '../components/user/LandingPage';
import { AuthScreen } from '../components/AuthScreen';
import { QRScanner } from '../components/user/QRScanner';
import { PrivacyConsent } from '../components/user/PrivacyConsent';
import { PlayerHome } from '../components/user/PlayerHome';
import { ClubDashboard } from '../components/admin/ClubDashboard';
import { CourseSetup } from '../components/admin/CourseSetup';
import { ClubProfile } from '../components/admin/ClubProfile';
import { ClubMenu } from '../components/admin/ClubMenu';
import { PaceOfPlay } from '../components/admin/PaceOfPlay';
import { StatisticsOfRound } from '../components/admin/StatisticsOfRound';
import { Statistics } from '../components/admin/Statistics';
import { PaceAnalytics } from '../components/admin/PaceAnalytics';
import { PaceAnalyticsHistory } from '../components/admin/PaceAnalyticsHistory';
import { MarshallMobileView } from '../components/admin/MarshallMobileView';
import { PlayerMonitor } from '../components/admin/PlayerMonitor';
import { MonitorSetup } from '../components/admin/MonitorSetup';
import { TeamManagement } from '../components/admin/TeamManagement';
import { SuperAdminDashboard } from '../components/superadmin/SuperAdminDashboard';
import { DebugDashboard } from '../components/superadmin/DebugDashboard';

import { WorkersListScreen } from '../components/greenkeeping/WorkersListScreen';
import { WorkerCreateScreen } from '../components/greenkeeping/WorkerCreateScreen';
import { WorkerEditorScreen } from '../components/greenkeeping/WorkerEditorScreen';
import { WorkerProfileScreen } from '../components/greenkeeping/WorkerProfileScreen';
import { TimeclockScreen } from '../components/greenkeeping/TimeclockScreen';
import { TimeclockExportPanel } from '../components/greenkeeping/TimeclockExportPanel';

import { dbData } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import App_Mobile_Staff from '../App_Mobile_Staff';



interface RenderMainViewProps {
  view: AppView;
  setView: (view: AppView) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  user: UserProfile | null;
  localRulesData: LocalRulesData | null;
  messages: ChatMessage[];
  inputMessage: string;
  setInputMessage: (val: string) => void;
  isThinking: boolean;
  handleSendMessage: (text?: string) => void;
  handleQuickSearch: (query: string) => void;
  handleScanResult: (data: string) => void;
  handleSaveClubData: (data: LocalRulesData) => void;
  handleImageCapture: (e: React.ChangeEvent<HTMLInputElement>) => void;
  logout: () => void;
  isMobile: boolean;
  gameContext: GameContext;
  setGameContext: React.Dispatch<React.SetStateAction<GameContext>>;
  activeFlightId: string | null;
  capturedImage: string | null;
  setCapturedImage: (val: string | null) => void;
  syncStatusLog: string;
  roundStatus: 'not_started' | 'started' | 'closing';
  chatEndRef: React.RefObject<HTMLDivElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  confirmEndRound: () => Promise<void>; 
  popup: any;
  setPopup: (p: any) => void;
  onStopRound: () => void;
}

export const MainViewRenderer: React.FC<RenderMainViewProps> = (props) => {
  const {
    view, setView, lang, setLang, user, localRulesData, messages,
    inputMessage, setInputMessage, isThinking, handleSendMessage,
    handleQuickSearch, handleScanResult, handleSaveClubData,
    handleImageCapture, logout, isMobile, gameContext, setGameContext,
    activeFlightId, capturedImage, setCapturedImage, syncStatusLog,
    roundStatus, chatEndRef, fileInputRef, confirmEndRound, popup, setPopup,
    onStopRound
  } = props;

  const [navParams, setNavParams] = useState<any>(null);
  const [activeHealthAlerts, setActiveHealthAlerts] = useState<any[]>([]);

  const isAdminView = [
    'club_dashboard', 'qr_management', 'course_setup', 'club_profile', 'club_menu',
    'pace_of_play', 'team_management', 'player_monitor', 'statistics',
    'statistics_of_round', 'pace_analytics', 'pace_analytics_history',
    'admin_greenkeeping_workers', 'admin_greenkeeping_timeclock',
    'admin_greenkeeping_timeclock_export',
    'admin_greenkeeping_worker_create', 'admin_greenkeeping_worker_edit', 'admin_greenkeeping_worker_profile'
  ].includes(view);

  const isPremium = localRulesData?.subscription?.tier === 'premium';

  useEffect(() => {
    if (!user?.homeClubId || !dbData || !isAdminView) return;
    const q = query(collection(dbData, 'alerts'), where('clubId', '==', user.homeClubId), where('status', '==', 'active'));
    const unsub = onSnapshot(q, (snap) => {
      const alerts = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((a: any) => a.type === 'HEALTH')
        .sort((a: any, b: any) => {
          const tsA = a.timestamp?.toMillis ? a.timestamp.toMillis() : (a.timestamp || 0);
          const tsB = b.timestamp?.toMillis ? b.timestamp.toMillis() : (b.timestamp || 0);
          return tsB - tsA;
        });
      setActiveHealthAlerts(alerts);
    });
    return unsub;
  }, [user?.homeClubId, isAdminView]);

  useEffect(() => {
    if (!user) return;
    const adminViews: AppView[] = [
      'super_admin_dashboard', 'club_dashboard', 'qr_management', 'course_setup',
      'club_profile', 'club_menu', 'pace_of_play', 'monitor_setup',
      'player_monitor', 'team_management', 'statistics', 'pace_analytics',
      'admin_greenkeeping_workers'
    ];
    if (user.role === 'player' && adminViews.includes(view)) setView('player_home');
    if (user.role !== 'sys_admin' && view === 'super_admin_dashboard') setView(user.role === 'player' ? 'player_home' : 'club_dashboard');
  }, [view, user, setView]);

  const handleNavigate = (newView: AppView, params?: any) => {
    setNavParams(params);
    setView(newView);
  };

  const handleAdminLogout = async () => { await logout(); };

  const handlePortalEntry = () => {
    if (!user) { setView('auth'); return; }
    if (user.role === 'sys_admin') setView('super_admin_dashboard');
    else if (user.role === 'club_admin') setView('club_dashboard');
    else if (user.role === 'marshall') setView('player_monitor');
    else if (user.role === 'greenkeeper') setView('staff_home_mobile');
    else setView('player_home');
  };

  const menuItems = [
    { id: 'club_profile', icon: MapIcon, label: lang === 'it' ? 'Mappatura Club' : 'Club Mapping' },
    { id: 'course_setup', icon: Flag, label: lang === 'it' ? 'Mappa campo' : 'Course Map' },
    { id: 'pace_of_play', icon: Clock, label: 'Peace Of Play' },
    { id: 'team_management', icon: Users, label: lang === 'it' ? 'TEAM STAFF' : 'STAFF TEAM', premium: true },
    { id: 'qr_management', icon: QrCode, label: lang === 'it' ? 'Gestione QrCode' : 'QrCode Management' },
    { type: 'separator' },
    { id: 'player_monitor', icon: Activity, label: 'PlayTrack', premium: true },
    { id: 'statistics', icon: BarChart3, label: lang === 'it' ? 'Statistiche' : 'Statistics', premium: true },
    { id: 'statistics_of_round', icon: BarChart3, label: 'Live Statistics' },
    { id: 'pace_analytics', icon: BarChart3, label: 'Pace Analytics', premium: true },
    { id: 'pace_analytics_history', icon: BarChart3, label: 'Pace Analytics History', premium: true },
    { type: 'separator' },
    { id: 'admin_greenkeeping_workers', icon: HardHat, label: lang === 'it' ? 'Gestione Operai' : 'Workers' },
    { id: 'admin_greenkeeping_timeclock', icon: Clock, label: lang === 'it' ? 'Timeclock Staff' : 'Timeclock' },
    { id: 'admin_greenkeeping_timeclock_export', icon: Download, label: lang === 'it' ? 'Export Timbrature' : 'Export' },
    { type: 'separator' },
    { id: 'debug_dashboard', icon: Terminal, label: lang === 'it' ? 'Diagnostica' : 'System Debug' },
  ];

  const renderSidebar = () => (
    <aside className="hidden lg:flex w-80 bg-slate-900 flex-col flex-shrink-0 shadow-2xl z-40 border-r border-white/5">
      <div className="p-10 border-b border-white/5 flex items-center gap-4">
        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/40">
          <ShieldCheck size={30} className="text-white" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-white uppercase tracking-tighter leading-none">ClubLink</h1>
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-1.5">Admin Management</span>
        </div>
      </div>
      <nav className="flex-1 p-6 space-y-1 overflow-y-auto scrollbar-hide">
        {menuItems.map((item: any, idx: number) => {
          if (item.type === 'separator') return <div key={`sep-${idx}`} className="h-px bg-white/10 my-4 mx-2" />;
          const isActive = view === item.id;
          const locked = item.premium && !isPremium;
          return (
            <button key={item.id} onClick={() => !locked && handleNavigate(item.id as AppView)} className={`w-full flex items-center justify-between p-4 rounded-[1rem] transition-all group ${isActive ? 'bg-emerald-50 text-slate-950 shadow-lg shadow-emerald-500/20 border border-white/10' : locked ? 'opacity-20 cursor-not-allowed text-slate-500' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
              <div className="flex items-center gap-4">
                {item.icon && <item.icon size={20} className={isActive ? 'text-slate-950' : 'text-slate-500 group-hover:text-white'} />}
                <span className="text-xs font-black tracking-tight uppercase">{item.label}</span>
              </div>
              {locked && <Clock size={12} className="text-slate-500" />}
            </button>
          );
        })}
      </nav>
      <div className="p-6 border-t border-white/5">
        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-[1.25rem] border border-white/5">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 font-black border border-emerald-500/20">{user?.displayName?.charAt(0) || 'A'}</div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-black text-white truncate">{user?.displayName}</span>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{user?.role}</span>
          </div>
          <button onClick={handleAdminLogout} className="ml-auto p-2 text-slate-500 hover:text-red-400 transition-colors"><LogOut size={18} /></button>
        </div>
      </div>
    </aside>
  );

  const renderMasterHeader = () => (
    <div className="flex flex-col z-30 shrink-0">
      {activeHealthAlerts.length > 0 && (
        <div onClick={() => handleNavigate('player_monitor', { flightId: activeHealthAlerts[0].flightId })} className="bg-red-600 animate-pulse text-white px-10 py-4 flex items-center justify-between cursor-pointer hover:bg-red-700 transition-colors border-b border-red-500 shadow-2xl">
          <div className="flex items-center gap-4">
            <HeartPulse size={24} className="animate-bounce" />
            <div>
              <p className="text-xs font-black uppercase tracking-widest leading-none">SOS Emergenza Medica Attiva</p>
              <h3 className="text-lg font-black uppercase tracking-tighter">{activeHealthAlerts[0].userName} alla {activeHealthAlerts[0].areaContext}</h3>
            </div>
          </div>
          <button className="bg-white text-red-600 px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-xl">Intervieni Ora</button>
        </div>
      )}
      <header className="bg-white border-b border-slate-200 px-10 py-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <Building2 className="text-slate-400" size={20} />
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">{localRulesData?.club || 'Golf Club'}</h2>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest"><Globe size={12} className="text-emerald-500" /> {localRulesData?.country || '---'}</span>
              <div className="h-1 w-1 bg-slate-300 rounded-full" />
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase ${isPremium ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>{isPremium ? <ShieldCheck size={10} /> : <Clock size={10} />}{isPremium ? 'Account Premium Attivo' : 'Piano Base'}</div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />Cloud Sync Active</div>
          <button onClick={() => setView('debug_dashboard')} className="p-2 text-slate-400 hover:text-slate-900 transition-colors" title="Diagnostica"><Terminal size={20} /></button>
        </div>
      </header>
    </div>
  );

  const renderContent = () => {
    switch (view) {
      case 'landing':
        return <LandingPage onStartScanner={() => setView('qr_scanner')} onLogin={handlePortalEntry} lang={lang} onToggleLang={setLang} user={user} onLogout={logout} clubName={localRulesData?.name || localRulesData?.club || ""} />;
      case 'auth':
        return <AuthScreen isMobile={isMobile} onLoginGoogle={() => {}} onContinueGuest={() => setView('landing')} lang={lang} onToggleLang={setLang} onBack={() => setView('landing')} />;
      case 'qr_scanner':
        return <div className="h-full relative"><QRScanner onScan={handleScanResult} onClose={() => setView(user ? 'player_home' : 'landing')} /></div>;
      case 'staff_home_mobile':
        return <App_Mobile_Staff initialUser={user} />;
      case 'privacy_consent':
        return <PrivacyConsent lang={lang} onAccept={() => setView('player_home')} onDeny={() => setView('landing')} clubName={localRulesData?.name || localRulesData?.club || ""} />;
      case 'player_home':
        return <PlayerHome user={user} lang={lang} localRulesData={localRulesData} messages={messages} input={inputMessage} setInput={setInputMessage} isThinking={isThinking} onSend={handleSendMessage} onStartScanner={() => setView('qr_scanner')} onStopRound={onStopRound} onShowLocalRules={() => {}} onShowCartRules={() => {}} isTrackingActive={roundStatus === 'started'} activeFlightId={activeFlightId} gameContext={gameContext} setGameContext={setGameContext} capturedImage={capturedImage} setCapturedImage={setCapturedImage} onImageClick={() => fileInputRef.current?.click()} fileInputRef={fileInputRef} handleImageCapture={handleImageCapture} chatEndRef={chatEndRef} onBack={() => setView('landing')} syncLog={syncStatusLog} roundStatus={roundStatus} />;
      case 'club_dashboard':
      case 'qr_management':
        return <ClubDashboard user={user} localRulesData={localRulesData!} onSave={handleSaveClubData} onLogout={logout} onNavigate={handleNavigate} lang={lang} view={view} />;
      case 'course_setup':
        return <CourseSetup user={user} localRulesData={localRulesData!} onBack={() => setView('club_dashboard')} onSave={handleSaveClubData} lang={lang} />;
      case 'club_profile':
        return <ClubProfile user={user} localRulesData={localRulesData!} onBack={() => setView('club_dashboard')} onSave={handleSaveClubData} lang={lang} />;
      case 'club_menu':
        return <ClubMenu user={user} localRulesData={localRulesData!} onNavigate={handleNavigate} onLogout={logout} lang={lang} />;
      case 'pace_of_play':
        return <PaceOfPlay user={user} localRulesData={localRulesData!} onBack={() => setView('club_dashboard')} onSave={handleSaveClubData} lang={lang} />;
      case 'statistics_of_round':
        return <StatisticsOfRound user={user} localRulesData={localRulesData!} onBack={() => setView('club_dashboard')} lang={lang} />;
      case 'statistics':
        return <Statistics user={user} localRulesData={localRulesData!} onBack={() => setView('club_dashboard')} lang={lang} />;
      case 'pace_analytics':
        return <PaceAnalytics user={user} localRulesData={localRulesData!} onBack={() => setView('club_dashboard')} lang={lang} />;
      case 'pace_analytics_history':
        return <PaceAnalyticsHistory user={user} onBack={() => setView('club_dashboard')} lang={lang} />;
      case 'player_monitor':
        if (user?.role === 'marshall' || isMobile) return <MarshallMobileView userId={user?.uid || ''} userDisplayName={user?.displayName || 'Marshall'} isAuthenticated={!!user} isPlayTrackOn={true} clubId={user?.homeClubId || 'club_pinetina'} localRulesData={localRulesData!} onLogout={logout} user={user} />;
        return <PlayerMonitor user={user} localRulesData={localRulesData!} onBack={() => setView('club_dashboard')} lang={lang} navParams={navParams} />;
      case 'monitor_setup':
        return <MonitorSetup localRulesData={localRulesData!} onSave={handleSaveClubData} onBack={() => setView('club_dashboard')} lang={lang} />;
      case 'team_management':
        return <TeamManagement user={user} onBack={() => setView('club_dashboard')} lang={lang} />;
      case 'admin_greenkeeping_workers':
        return <WorkersListScreen clubId={user?.homeClubId || ''} user={user} lang={lang} onNavigate={handleNavigate} onBack={() => setView('club_dashboard')} />;
      case 'admin_greenkeeping_worker_create':
        return <WorkerCreateScreen clubId={user?.homeClubId || ''} lang={lang} user={user} onBack={() => setView('admin_greenkeeping_workers')} />;
      case 'admin_greenkeeping_worker_edit':
        return <WorkerEditorScreen uid={navParams?.uid || ''} clubId={user?.homeClubId || ''} lang={lang} onBack={() => setView('admin_greenkeeping_workers')} user={user} />;
      case 'admin_greenkeeping_worker_profile':
        return <WorkerProfileScreen uid={navParams?.uid || ''} clubId={user?.homeClubId || ''} lang={lang} user={user} onBack={() => setView('admin_greenkeeping_workers')} />;
      case 'admin_greenkeeping_timeclock':
        return <TimeclockScreen clubId={user?.homeClubId || ''} lang={lang} user={user} onBack={() => setView('club_dashboard')} />;
      case 'admin_greenkeeping_timeclock_export':
        return <TimeclockExportPanel clubId={user?.homeClubId || ''} onBack={() => setView('admin_greenkeeping_workers')} user={user} lang={lang} />;
      case 'super_admin_dashboard':
        return <SuperAdminDashboard user={user} onLogout={logout} lang={lang} onNavigate={setView} />;
      case 'debug_dashboard':
        return <DebugDashboard onBack={() => setView(user?.role === 'sys_admin' ? 'super_admin_dashboard' : 'club_dashboard')} lang={lang} />;
      default: return null;
    }
  };

  if (isAdminView && !isMobile) {
    return (
      <div className="min-h-screen bg-slate-50 flex font-sans overflow-hidden">
        {renderSidebar()}
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          {renderMasterHeader()}
          <div className="flex-1 overflow-hidden">{renderContent()}</div>
        </main>
      </div>
    );
  }
  return renderContent();
};
