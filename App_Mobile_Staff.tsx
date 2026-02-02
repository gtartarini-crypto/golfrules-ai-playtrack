import React, { useState, useEffect } from "react";
import { dbData } from "./services/firebase";
import { doc, getDoc } from "firebase/firestore";

import { LoginScreenMobile } from "./screens/staff/LoginScreenMobile";
import { HomeScreenMobile } from "./screens/staff/HomeScreenMobile";
import { HistoryScreenMobile } from "./screens/staff/HistoryScreenMobile";
import { ProfileScreenMobile } from "./screens/staff/ProfileScreenMobile";
import { StaffInternalChatWidget } from "./components/staff/StaffInternalChatWidget";

import { Clock, History, User, Loader2 } from "lucide-react";

// 🔐 Permessi Capacitor
import { Camera } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';

interface Props {
  initialUser?: any;
}

export default function App_Mobile_Staff({ initialUser }: Props) {
  const [user, setUser] = useState<any>(initialUser);
  const [staffData, setStaffData] = useState<any>(null);
  const [initializing, setInitializing] = useState(true);
  
  const [showHistory, setShowHistory] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // 🔐 Richiesta permessi (Camera + GPS)
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        await Camera.requestPermissions();
        await Geolocation.requestPermissions();
        console.log("Permessi staff richiesti correttamente");
      } catch (err) {
        console.error("Errore richiesta permessi staff:", err);
      }
    };

    requestPermissions();
  }, []);

  useEffect(() => {
    const fetchStaffDetails = async () => {
      if (initialUser) {
        try {
          const snap = await getDoc(doc(dbData!, "staff", initialUser.uid));
          if (snap.exists()) {
            setStaffData({ uid: initialUser.uid, ...snap.data() });
          }
        } catch (e) {
          console.error("Error loading staff data:", e);
        }
      }
      setInitializing(false);
    };
    fetchStaffDetails();
  }, [initialUser]);

  const openHistory = () => {
    setShowProfile(false);
    setShowHistory(true);
  };

  const openProfile = () => {
    setShowHistory(false);
    setShowProfile(true);
  };

  const closePopups = () => {
    setShowHistory(false);
    setShowProfile(false);
  };

  if (initializing) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 gap-4 font-sans">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
          Inizializzazione Staff Portal...
        </p>
      </div>
    );
  }

  if (!user) return <LoginScreenMobile />;

  return (
    <div className="h-[100dvh] flex flex-col bg-white overflow-hidden relative font-sans">
      <div className="flex-1 overflow-hidden">
        <HomeScreenMobile 
          user={user} 
          staffData={staffData} 
          onOpenHistory={openHistory}
          onOpenProfile={openProfile}
        />
      </div>

      {showHistory && (
        <div className="fixed inset-0 z-[400] bg-white animate-in slide-in-from-bottom duration-300">
          <HistoryScreenMobile 
            user={user} 
            staffData={staffData} 
            onClose={closePopups} 
          />
        </div>
      )}

      {showProfile && (
        <div className="fixed inset-0 z-[400] bg-white animate-in slide-in-from-bottom duration-300">
          <ProfileScreenMobile 
            worker={staffData} 
            onClose={closePopups} 
          />
        </div>
      )}

      <StaffInternalChatWidget 
        clubId={staffData?.clubId} 
        currentUser={user} 
      />

      <div className="h-20 bg-white border-t border-slate-100 flex justify-around items-center shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-[350] pb-safe">
        <TabBtn 
          icon={<Clock size={20} />} 
          label="Timbro" 
          active={!showHistory && !showProfile} 
          onClick={closePopups} 
        />
        <TabBtn 
          icon={<History size={20} />} 
          label="Storico" 
          active={showHistory} 
          onClick={openHistory} 
        />
        <TabBtn 
          icon={<User size={20} />} 
          label="Profilo" 
          active={showProfile} 
          onClick={openProfile} 
        />
      </div>
    </div>
  );
}

function TabBtn({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`flex flex-col items-center gap-1 font-black text-[10px] uppercase tracking-tighter transition-all ${
        active ? "text-emerald-600 scale-110" : "text-slate-400"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
