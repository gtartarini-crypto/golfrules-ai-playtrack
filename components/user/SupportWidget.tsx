import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Loader2, Headset } from 'lucide-react';
import { SupportMessage, UserProfile } from '../../types';
import { supportChatService } from '../../services/supportChatService';

interface SupportWidgetProps {
  user: UserProfile | null;
  flightId: string | null;
  clubId: string;
}

export const SupportWidget: React.FC<SupportWidgetProps> = ({ user, flightId, clubId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [input, setInput] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !flightId || !clubId) return;

    // Reset non letti all'apertura
    supportChatService.markAsRead(clubId, flightId, 'player');

    return supportChatService.listenToThread(clubId, flightId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
  }, [isOpen, flightId, clubId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || !flightId || !clubId) return;
    const text = input;
    setInput('');
    await supportChatService.sendMessage({
      clubId,
      flightId,
      text,
      senderId: user.uid,
      senderName: user.displayName || 'Player',
      senderRole: 'player'
    });
  };

  if (!flightId) return null;

  return (
    <div className="fixed bottom-32 right-4 z-[200] flex flex-col items-end gap-4 pointer-events-none">
      {isOpen && (
        <div className="w-[320px] h-[450px] bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-slate-200 flex flex-col overflow-hidden pointer-events-auto animate-in slide-in-from-bottom-4 duration-300">
          <header className="bg-slate-900 p-5 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                <Headset size={20} />
              </div>
              <div>
                <h3 className="text-white font-black text-xs uppercase tracking-widest">Segreteria Club</h3>
                <p className="text-[9px] font-bold text-emerald-500 uppercase">Supporto in tempo reale</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 text-slate-500 hover:text-white"><X size={20}/></button>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-slate-50/50">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-30 gap-4">
                <MessageCircle size={48} className="text-slate-400" />
                <p className="text-[10px] font-black uppercase text-slate-500">Invia un messaggio per parlare con un Marshall o la Segreteria</p>
              </div>
            ) : (
              messages.map(m => {
                const isMe = m.senderRole === 'player';
                return (
                  <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${isMe ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-sm'}`}>
                      {!isMe && <p className="text-[8px] font-black uppercase text-emerald-600 mb-1">Staff</p>}
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
              placeholder="Scrivi allo staff..."
              className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-400"
            />
            <button type="submit" className="bg-emerald-500 text-slate-950 p-3 rounded-xl shadow-lg active:scale-90 transition-all">
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center pointer-events-auto transition-all active:scale-90 border-4 border-white ${isOpen ? 'bg-slate-900 text-white rotate-90' : 'bg-emerald-500 text-slate-950'}`}
      >
        {isOpen ? <X size={28} /> : <Headset size={28} />}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};