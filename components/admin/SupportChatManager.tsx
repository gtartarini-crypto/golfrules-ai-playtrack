import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, User, Loader2, ArrowLeft, Users, Headset, Circle } from 'lucide-react';
import { SupportMessage, SupportThread, UserProfile } from '../../types';
import { supportChatService } from '../../services/supportChatService';

interface SupportChatManagerProps {
  user: UserProfile | null;
  clubId: string;
}

export const SupportChatManager: React.FC<SupportChatManagerProps> = ({ user, clubId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [input, setInput] = useState('');
  
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!clubId) return;
    return supportChatService.listenToAllThreads(clubId, setThreads);
  }, [clubId]);

  useEffect(() => {
    if (!selectedThreadId || !clubId) {
      setMessages([]);
      return;
    }

    supportChatService.markAsRead(clubId, selectedThreadId, 'staff');

    return supportChatService.listenToThread(clubId, selectedThreadId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
  }, [selectedThreadId, clubId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || !selectedThreadId || !clubId) return;
    const text = input;
    setInput('');
    await supportChatService.sendMessage({
      clubId,
      flightId: selectedThreadId,
      text,
      senderId: user.uid,
      senderName: user.displayName || 'Staff',
      senderRole: 'staff'
    });
  };

  const selectedThread = threads.find(t => t.id === selectedThreadId);
  const totalUnread = threads.reduce((acc, t) => acc + (t.unreadCountStaff || 0), 0);

  return (
    <div className="fixed bottom-6 left-6 z-[200] flex flex-col items-start gap-4">
      {isOpen && (
        <div className="w-[320px] md:w-[350px] h-[500px] md:h-[550px] bg-white rounded-[2.5rem] shadow-[0_20px_80px_rgba(0,0,0,0.4)] border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          
          <header className="bg-emerald-950 p-5 md:p-6 flex justify-between items-center shrink-0">
            {selectedThreadId ? (
              <button onClick={() => setSelectedThreadId(null)} className="flex items-center gap-3 text-white">
                <ArrowLeft size={20} />
                <div>
                  <h3 className="font-black text-xs uppercase tracking-widest truncate max-w-[120px]">{selectedThread?.playerName}</h3>
                  <p className="text-[9px] font-bold text-emerald-400 uppercase">Flight #{selectedThreadId.slice(-4)}</p>
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-3 text-white">
                <Headset size={20} className="text-emerald-400" />
                <h3 className="font-black text-xs uppercase tracking-widest">Supporto Giocatori</h3>
              </div>
            )}
            <button onClick={() => setIsOpen(false)} className="p-2 text-white/40 hover:text-white"><X size={24}/></button>
          </header>

          <div className="flex-1 overflow-y-auto bg-slate-50/50">
            {!selectedThreadId ? (
              <div className="divide-y divide-slate-100">
                {threads.length === 0 ? (
                  <div className="py-20 text-center px-10 opacity-20 flex flex-col items-center gap-4">
                    <Users size={48} />
                    <p className="text-[10px] font-black uppercase">Nessuna conversazione attiva</p>
                  </div>
                ) : (
                  threads.map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => setSelectedThreadId(t.id)}
                      className="w-full p-6 flex items-center justify-between hover:bg-white transition-colors text-left group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                            <User size={24}/>
                          </div>
                          {t.unreadCountStaff > 0 && <Circle size={12} fill="#ef4444" className="text-red-500 absolute -top-1 -right-1" />}
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-slate-900 uppercase leading-none mb-1.5">{t.playerName}</h4>
                          <p className="text-[10px] text-slate-500 font-medium truncate max-w-[120px]">{t.lastMessage || 'Nessun messaggio'}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[8px] font-black text-slate-400 uppercase">
                          {t.updatedAt?.toMillis ? new Date(t.updatedAt.toMillis()).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}
                        </span>
                        {t.unreadCountStaff > 0 && (
                          <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">{t.unreadCountStaff}</span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-hide">
                  {messages.map(m => {
                    const isMe = m.senderRole === 'staff';
                    return (
                      <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${isMe ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-sm'}`}>
                          <p className="leading-relaxed font-medium">{m.text}</p>
                        </div>
                        <span className="text-[7px] font-bold text-slate-400 mt-1 uppercase">
                          {m.timestamp?.toMillis ? new Date(m.timestamp.toMillis()).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '...'}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={endRef} />
                </div>
                
                <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-2">
                  <input 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Rispondi..."
                    className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-400"
                  />
                  <button type="submit" className="bg-emerald-600 text-white p-3 rounded-xl shadow-lg active:scale-90 transition-all">
                    <Send size={18} />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-90 border-4 border-white ${isOpen ? 'bg-slate-900 text-white' : 'bg-emerald-600 text-white'}`}
      >
        <MessageSquare size={28} />
        {!isOpen && totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-7 h-7 rounded-full flex items-center justify-center border-4 border-white animate-pulse">
            {totalUnread}
          </span>
        )}
      </button>
    </div>
  );
};