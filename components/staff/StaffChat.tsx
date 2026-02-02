import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Clock, Loader2, MessageSquare } from 'lucide-react';
import { dbData } from '../../services/firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: any;
}

export const StaffChat: React.FC<{ clubId: string; currentUser: any }> = ({ clubId, currentUser }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dbData || !clubId) return;
    const q = query(
      collection(dbData, 'staff_chats', clubId, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(100)
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
      setLoading(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return unsub;
  }, [clubId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !dbData) return;
    const text = input;
    setInput('');
    try {
        await addDoc(collection(dbData, 'staff_chats', clubId, 'messages'), {
            text,
            senderId: currentUser.uid,
            senderName: currentUser.displayName || currentUser.email || 'Utente',
            timestamp: serverTimestamp()
        });
    } catch (e) {
        console.error("Chat send error:", e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white font-sans">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-2">
            <Loader2 className="animate-spin" size={24} />
            <p className="text-[10px] font-black uppercase">Connessione Chat...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-20 text-slate-500">
             <MessageSquare size={48} />
             <p className="text-[10px] font-black uppercase mt-4">Nessun messaggio recente</p>
          </div>
        ) : (
          messages.map(m => {
            const isMe = m.senderId === currentUser.uid;
            return (
              <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${isMe ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
                  {!isMe && <p className="text-[9px] font-black uppercase text-emerald-600 mb-1">{m.senderName}</p>}
                  <p className="leading-relaxed">{m.text}</p>
                </div>
                <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">
                  {m.timestamp?.toMillis ? new Date(m.timestamp.toMillis()).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '...'}
                </p>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
      
      <form onSubmit={handleSend} className="p-4 border-t border-slate-100 flex gap-2 bg-slate-50/30">
        <input 
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Scrivi messaggio..."
          className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all"
        />
        <button type="submit" className="p-3 bg-emerald-600 text-white rounded-xl active:scale-95 transition-all shadow-lg shadow-emerald-200">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};