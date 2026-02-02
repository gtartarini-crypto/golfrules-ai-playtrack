import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp, 
  where,
  increment,
  updateDoc
} from 'firebase/firestore';
import { dbData } from './firebase';
import { SupportMessage, SupportThread } from '../types';

export const supportChatService = {
  /**
   * Invia un messaggio in un thread di supporto specifico.
   */
  sendMessage: async (params: {
    clubId: string;
    flightId: string;
    text: string;
    senderId: string;
    senderName: string;
    senderRole: 'player' | 'staff';
  }) => {
    if (!dbData) return;

    const threadRef = doc(dbData, 'support_chats', params.clubId, 'threads', params.flightId);
    const messagesRef = collection(threadRef, 'messages');

    // 1. Aggiungi il messaggio
    await addDoc(messagesRef, {
      text: params.text,
      senderId: params.senderId,
      senderName: params.senderName,
      senderRole: params.senderRole,
      timestamp: serverTimestamp()
    });

    // 2. Aggiorna metadata thread
    const updatePayload: any = {
      lastMessage: params.text,
      updatedAt: serverTimestamp(),
      status: 'active',
      clubId: params.clubId,
      playerName: params.senderRole === 'player' ? params.senderName : undefined
    };

    // Incrementa contatore messaggi non letti per la controparte
    if (params.senderRole === 'player') {
      updatePayload.unreadCountStaff = increment(1);
    } else {
      updatePayload.unreadCountPlayer = increment(1);
    }

    await setDoc(threadRef, updatePayload, { merge: true });
  },

  /**
   * Ascolta i messaggi di un thread specifico.
   */
  listenToThread: (clubId: string, flightId: string, callback: (messages: SupportMessage[]) => void) => {
    if (!dbData) return () => {};
    const messagesRef = collection(dbData, 'support_chats', clubId, 'threads', flightId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    return onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as SupportMessage));
      callback(msgs);
    });
  },

  /**
   * Ascolta tutti i thread attivi di un club (per Marshall).
   */
  listenToAllThreads: (clubId: string, callback: (threads: SupportThread[]) => void) => {
    if (!dbData) return () => {};
    const threadsRef = collection(dbData, 'support_chats', clubId, 'threads');
    const q = query(threadsRef, where('status', '==', 'active'), orderBy('updatedAt', 'desc'));

    return onSnapshot(q, (snap) => {
      const threads = snap.docs.map(d => ({ id: d.id, ...d.data() } as SupportThread));
      callback(threads);
    });
  },

  /**
   * Reset del contatore non letti.
   */
  markAsRead: async (clubId: string, flightId: string, role: 'player' | 'staff') => {
    if (!dbData) return;
    const threadRef = doc(dbData, 'support_chats', clubId, 'threads', flightId);
    await updateDoc(threadRef, {
      [role === 'player' ? 'unreadCountPlayer' : 'unreadCountStaff']: 0
    });
  }
};