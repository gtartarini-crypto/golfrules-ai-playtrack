import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Language } from '../../types';

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
  interpretation: any;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface VoiceButtonProps {
  onResult: (text: string) => void;
  disabled?: boolean;
  lang: Language;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({ onResult, disabled, lang }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  const getLangCode = (l: Language) => {
      switch(l) {
          case 'it': return 'it-IT';
          case 'fr': return 'fr-FR';
          case 'de': return 'de-DE';
          case 'es': return 'es-ES';
          default: return 'en-US';
      }
  };

  useEffect(() => {
    const win = window as any;
    const SpeechRecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRecognitionCtor) {
      const recog = new SpeechRecognitionCtor() as SpeechRecognition;
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = getLangCode(lang);

      recog.onresult = (event: SpeechRecognitionEvent) => {
        if (event.results.length > 0) {
            const transcript = event.results[0][0].transcript;
            onResult(transcript);
        }
        setIsListening(false);
      };

      recog.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recog.onend = () => {
        setIsListening(false);
      };

      setRecognition(recog);
    } else {
      setIsSupported(false);
    }
  }, [onResult, lang]);

  useEffect(() => {
    if (recognition) {
      recognition.lang = getLangCode(lang);
    }
  }, [lang, recognition]);

  const toggleListening = useCallback(() => {
    if (!recognition) return;
    
    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
        setIsListening(true);
      } catch (e) {
        console.error("Failed to start recognition", e);
      }
    }
  }, [isListening, recognition]);

  if (!isSupported) return null;
  
  const labels: Record<Language, {start: string, stop: string}> = {
      it: { start: "Inizia ascolto", stop: "Stop ascolto" },
      en: { start: "Start listening", stop: "Stop listening" },
      fr: { start: "Écouter", stop: "Arrêter" },
      de: { start: "Zuhören", stop: "Stoppen" },
      es: { start: "Escuchar", stop: "Parar" }
  };

  return (
    <button
      onClick={toggleListening}
      disabled={disabled}
      className={`
        p-3 rounded-full transition-all duration-200 shadow-md
        ${isListening 
          ? 'bg-red-500 text-white animate-pulse' 
          : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      type="button"
      aria-label={isListening ? labels[lang].stop : labels[lang].start}
    >
      {isListening ? <Loader2 className="w-6 h-6 animate-spin" /> : <Mic className="w-6 h-6" />}
    </button>
  );
};