import React from 'react';
import { 
  LogOut, MapPin, Briefcase, Mail, HardHat, ShieldCheck, X, 
  Phone, User, Calendar, FileText, ShieldAlert, Fingerprint, 
  MapIcon, BadgeCheck, Smartphone, UserCircle, Home, Key
} from 'lucide-react';
import { auth } from "../../services/firebase";

export const ProfileScreenMobile = ({ worker, onClose }: any) => {
  const handleLogout = () => auth.signOut();

  const infoGroups = [
    {
      title: "Identità",
      icon: <UserCircle size={14} className="text-emerald-600" />,
      items: [
        { label: "Nome completo", value: `${worker?.firstName} ${worker?.lastName}`, icon: <User size={14} /> },
        { label: "Nickname", value: worker?.displayName, icon: <BadgeCheck size={14} /> },
        { label: "Codice Fiscale / NI", value: worker?.niNumber, icon: <Fingerprint size={14} />, highlight: true },
        { label: "Data di Nascita", value: worker?.dateOfBirth, icon: <Calendar size={14} /> },
      ]
    },
    {
      title: "Recapiti & Accesso",
      icon: <Smartphone size={14} className="text-blue-600" />,
      items: [
        { label: "Email di sistema", value: worker?.email, icon: <Mail size={14} /> },
        { label: "Cellulare Personale", value: worker?.mobile, icon: <Smartphone size={14} />, isLink: `tel:${worker?.mobile}` },
        { label: "Telefono Fisso", value: worker?.phone, icon: <Phone size={14} /> },
      ]
    },
    {
      title: "Indirizzo & Domicilio",
      icon: <Home size={14} className="text-purple-600" />,
      items: [
        { label: "Indirizzo", value: worker?.addressLine1, icon: <MapPin size={14} /> },
        { label: "Complemento", value: worker?.addressLine2, icon: <MapPin size={14} /> },
        { label: "Città & CAP", value: worker?.city ? `${worker.postalCode} ${worker.city}` : null, icon: <MapIcon size={14} /> },
      ]
    },
    {
      title: "Posizione Lavorativa",
      icon: <HardHat size={14} className="text-amber-600" />,
      items: [
        { label: "Ruolo", value: worker?.role?.replace('_', ' ')?.toUpperCase(), icon: <Briefcase size={14} /> },
        { label: "Circolo", value: worker?.clubId?.replace('club_', '')?.toUpperCase(), icon: <ShieldCheck size={14} /> },
        { label: "Registrato il", value: worker?.createdAt?.toMillis ? new Date(worker.createdAt.toMillis()).toLocaleDateString() : null, icon: <Calendar size={14} /> },
      ]
    }
  ];

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans overflow-hidden">
      {/* HEADER PROFILO */}
      <header className="p-8 pb-6 flex flex-col items-center bg-white border-b border-slate-100 shrink-0 relative">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-500 active:scale-90 transition-all"
        >
          <X size={20} />
        </button>
        
        <div className="w-20 h-20 rounded-[2rem] bg-emerald-50 flex items-center justify-center border-2 border-emerald-100 shadow-lg mb-4 relative">
          <HardHat size={40} className="text-emerald-600" />
          <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-lg border-2 border-white">
            <BadgeCheck size={12} />
          </div>
        </div>
        
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          {worker?.firstName} {worker?.lastName}
        </h1>
        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] mt-0.5">
          Profilo Staff Attivo
        </p>
      </header>

      {/* CONTENUTO INFORMAZIONI */}
      <main className="flex-1 p-4 space-y-4 overflow-y-auto scrollbar-hide pb-20">
        
        {infoGroups.map((group, gIdx) => (
          <div key={gIdx} className="bg-white rounded-[1.5rem] overflow-hidden border border-slate-100 shadow-sm">
            <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2">
              {group.icon}
              <h3 className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{group.title}</h3>
            </div>
            <div className="p-5 space-y-4">
              {group.items.map((item, iIdx) => (
                item.value ? (
                  <div key={iIdx} className="flex items-start gap-3">
                    <div className="p-2 bg-slate-50 rounded-lg text-slate-400 shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-1">{item.label}</p>
                      {item.isLink ? (
                        <a href={item.isLink} className="text-sm font-bold text-emerald-600 underline decoration-emerald-500/20">{item.value}</a>
                      ) : (
                        <p className={`text-sm font-bold ${item.highlight ? 'text-emerald-700' : 'text-slate-800'}`}>{item.value}</p>
                      )}
                    </div>
                  </div>
                ) : null
              ))}
            </div>
          </div>
        ))}

        {/* SEZIONE NOTE / INFO MEDICHE */}
        {(worker?.notes || worker?.medicalInfo) && (
          <div className="space-y-4">
            {worker?.notes && (
              <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={14} className="text-amber-500" />
                  <h3 className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Note Aziendali</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium italic">{worker.notes}</p>
              </div>
            )}
            {worker?.medicalInfo && (
              <div className="bg-rose-50 p-5 rounded-[1.5rem] border border-rose-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert size={14} className="text-rose-500" />
                  <h3 className="text-[9px] font-black uppercase text-rose-900 tracking-widest">Info Mediche</h3>
                </div>
                <p className="text-xs text-rose-800 leading-relaxed font-bold">{worker.medicalInfo}</p>
              </div>
            )}
          </div>
        )}

        <div className="pt-2 pb-6">
          <button 
            onClick={handleLogout}
            className="w-full py-4 bg-rose-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-rose-500/20"
          >
            <LogOut size={16} />
            Disconnetti Account
          </button>
        </div>
      </main>
    </div>
  );
};