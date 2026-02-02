import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Loader2, Headset, User } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { dbData } from '../../services/firebase';

interface StaffInternalChatWidgetProps {
  clubId: string;
  currentUser: any;
}

export const StaffInternalChatWidget: React.FC<StaffInternalChatWidgetProps> = ({ clubId, currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dbData || !clubId || !isOpen) return;

    const q = query(
      collection(dbData, 'staff_chats', clubId, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return unsub;
  }, [clubId, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !dbData) return;
    const text = input;
    setInput('');
    try {
      await addDoc(collection(dbData, 'staff_chats', clubId, 'messages'), {
        text,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'Staff',
        senderRole: 'staff_internal',
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.error("Staff chat send error:", e);
    }
  };

  if (!clubId) return null;

  return (
    <div className="fixed bottom-24 right-4 z-[500] flex flex-col items-end gap-4 pointer-events-none">
      {isOpen && (
        <div className="w-[320px] h-[450px] bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-slate-200 flex flex-col overflow-hidden pointer-events-auto animate-in slide-in-from-bottom-4 duration-300">
          <header className="bg-emerald-900 p-5 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-emerald-300 border border-white/10">
                <Headset size={20} />
              </div>
              <div>
                <h3 className="text-white font-black text-xs uppercase tracking-widest">Chat Interna</h3>
                <p className="text-[9px] font-bold text-emerald-400 uppercase leading-none mt-0.5">Segreteria Club</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 text-white/40 hover:text-white transition-colors"><X size={20}/></button>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-slate-50/50">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center opacity-30 gap-2">
                <Loader2 className="animate-spin" size={24} />
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-30 gap-4">
                <MessageSquare size={48} className="text-slate-400" />
                <p className="text-[10px] font-black uppercase text-slate-500">Comunica in tempo reale con la segreteria o il direttore</p>
              </div>
            ) : (
              messages.map(m => {
                const isMe = m.senderId === currentUser.uid;
                return (
                  <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${isMe ? 'bg-emerald-600 text-white rounded-tr-none shadow-md' : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-sm'}`}>
                      {!isMe && <p className="text-[8px] font-black uppercase text-emerald-600 mb-1">{m.senderName}</p>}
                      <p className="leading-relaxed font-medium">{m.text}</p>
                    </div>
                    <span className="text-[7px] font-bold text-slate-400 mt-1 uppercase">
                      {m.timestamp?.toMillis ? new Date(m.timestamp.toMillis()).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '...'}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-2">
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Scrivi alla segreteria..."
              className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-400"
            />
            <button type="submit" className="bg-emerald-600 text-white p-3 rounded-xl shadow-lg active:scale-90 transition-all">
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center pointer-events-auto transition-all active:scale-90 border-4 border-white ${isOpen ? 'bg-slate-900 text-white rotate-90' : 'bg-emerald-600 text-white'}`}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
};