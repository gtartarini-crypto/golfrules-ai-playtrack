import { useState, useCallback } from 'react';
import { ChatMessage, Language, GameContext, LocalRulesData, AppView } from '../../types';
import { searchRuleOnline } from '../../services/geminiService';

interface UseChatProps {
  lang: Language;
  gameContext: GameContext;
  localRulesData: LocalRulesData | null;
  capturedImage: string | null;
  setCapturedImage: (val: string | null) => void;
  setView: (view: AppView) => void;
}

export const useChat = ({
  lang,
  gameContext,
  localRulesData,
  capturedImage,
  setCapturedImage,
  setView
}: UseChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const handleSendMessage = useCallback(async (textOverride?: string) => {
    const text = textOverride || inputMessage;
    if (!text.trim() && !capturedImage) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text || (lang === 'it' ? "Analisi immagine..." : "Image analysis..."),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsThinking(true);

    try {
      const response = await searchRuleOnline(
        text,
        gameContext,
        lang,
        capturedImage,
        localRulesData?.local_rules
      );

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text,
        timestamp: Date.now(),
        generatedImage: response.generatedImage
      };

      setMessages(prev => [...prev, aiMsg]);
      setCapturedImage(null);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        text: lang === 'it' ? "Errore di connessione. Riprova." : "Connection error. Please try again.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  }, [inputMessage, capturedImage, gameContext, lang, localRulesData]);

  const handleQuickSearch = (query: string) => {
    if (!query.trim()) return;
    setView('player_home');
    // Piccolo delay per permettere al componente di montarsi prima di avviare l'AI
    setTimeout(() => handleSendMessage(query), 100);
  };

  return {
    messages,
    setMessages,
    inputMessage,
    setInputMessage,
    isThinking,
    handleSendMessage,
    handleQuickSearch
  };
};