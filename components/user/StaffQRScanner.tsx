import React, { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { timeclockService } from "../../services/timeclock.service";

interface StaffQRScannerProps {
  onClose: () => void;
  staff: any;
}

export const StaffQRScanner: React.FC<StaffQRScannerProps> = ({ onClose, staff }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanStatus, setScanStatus] = useState<'scanning' | 'success' | 'error'>('scanning');
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let animationFrameId: number;
    const video = videoRef.current;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        streamRef.current = stream;
        if (video) {
          video.srcObject = stream;
          video.setAttribute("playsinline", "true");
          video.play();
          animationFrameId = requestAnimationFrame(scan);
        }
      } catch (err) {
        setScanStatus('error');
        setErrorMessage("Impossibile accedere alla fotocamera. Verifica i permessi.");
      }
    };

    const scan = () => {
      if (!videoRef.current || !canvasRef.current || isProcessing) {
        animationFrameId = requestAnimationFrame(scan);
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      const video = videoRef.current;

      if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, canvas.width, canvas.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data) {
          if (code.data === "STAFF_CLOCK" || code.data.includes("STAFF_CLOCK")) {
            handlePunchAction();
            return;
          }
        }
      }

      animationFrameId = requestAnimationFrame(scan);
    };

    const handlePunchAction = async () => {
      setIsProcessing(true);
      if (navigator.vibrate) navigator.vibrate(100);

      try {
        const nextType = staff.shiftStatus === 'clocked_in' ? 'clock_out' : 'clock_in';
        
        await timeclockService.punch({
          workerUid: staff.uid,
          clubId: staff.clubId,
          type: nextType,
          punchedBy: staff.uid,
          timestamp: Date.now()
        });

        setScanStatus('success');
        setTimeout(() => {
          onClose();
        }, 1500);
      } catch (err) {
        setScanStatus('error');
        setErrorMessage("Errore durante la registrazione. Riprova.");
        setIsProcessing(false);

        setTimeout(() => {
          setScanStatus('scanning');
          animationFrameId = requestAnimationFrame(scan);
        }, 3000);
      }
    };

    startCamera();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [staff, isProcessing]);

  return (
    <div className="fixed inset-0 bg-slate-950 z-[300] flex flex-col font-sans overflow-hidden">
      <div className="bg-slate-900 px-6 py-5 flex justify-between items-center z-10 shrink-0 border-b border-white/5">
        <div>
          <h3 className="text-white font-black text-xs uppercase tracking-widest">Timbratura Personale</h3>
          <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-tighter">Inquadra il codice QR del club</p>
        </div>
        <button 
          onClick={onClose} 
          className="p-3 bg-white/10 text-white rounded-2xl hover:bg-white/20 transition-all active:scale-95"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 relative bg-black overflow-hidden flex items-center justify-center">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted
          className="w-full h-full object-cover" 
        />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className={`w-72 h-72 border-2 rounded-[3.5rem] relative shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] transition-colors duration-300 ${
            scanStatus === 'success' ? 'border-emerald-500 bg-emerald-500/10' : 
            scanStatus === 'error' ? 'border-red-500 bg-red-500/10' : 
            'border-emerald-500/30'
          }`}>
            <div className={`absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 rounded-tl-[2rem] transition-colors ${scanStatus === 'success' ? 'border-emerald-400' : 'border-emerald-500'}`} />
            <div className={`absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 rounded-tr-[2rem] transition-colors ${scanStatus === 'success' ? 'border-emerald-400' : 'border-emerald-500'}`} />
            <div className={`absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 rounded-bl-[2rem] transition-colors ${scanStatus === 'success' ? 'border-emerald-400' : 'border-emerald-500'}`} />
            <div className={`absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 rounded-br-[2rem] transition-colors ${scanStatus === 'success' ? 'border-emerald-400' : 'border-emerald-500'}`} />
            
            {scanStatus === 'scanning' && !isProcessing && (
              <div className="absolute top-0 left-4 right-4 h-1 bg-emerald-500/80 shadow-[0_0_15px_#10b981] animate-bounce-slow" style={{ top: '50%' }} />
            )}

            <div className="absolute inset-0 flex items-center justify-center">
              {isProcessing && scanStatus !== 'success' && (
                <Loader2 className="animate-spin text-emerald-400" size={48} />
              )}
              {scanStatus === 'success' && (
                <CheckCircle2 className="text-emerald-400 animate-in zoom-in duration-300" size={64} />
              )}
              {scanStatus === 'error' && (
                <AlertCircle className="text-red-400 animate-in shake duration-300" size={64} />
              )}
            </div>
          </div>
          
          <div className="mt-12 text-center px-8 max-w-xs">
            {scanStatus === 'scanning' && (
              <p className="text-white font-black text-[10px] uppercase tracking-[0.2em] bg-emerald-600/20 border border-emerald-500/30 px-6 py-3 rounded-full backdrop-blur-md">
                Ricerca Codice QR...
              </p>
            )}
            {scanStatus === 'success' && (
              <p className="text-emerald-400 font-black text-xs uppercase tracking-widest bg-emerald-950/80 px-6 py-3 rounded-full border border-emerald-500/50">
                Timbratura Registrata!
              </p>
            )}
            {scanStatus === 'error' && (
              <p className="text-red-400 font-black text-[10px] uppercase tracking-widest bg-red-950/80 px-6 py-3 rounded-full border border-red-500/50 leading-tight">
                {errorMessage}
              </p>
            )}
          </div>
        </div>
        
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="bg-slate-900 p-8 shrink-0 border-t border-white/5">
        <button 
          onClick={onClose} 
          disabled={isProcessing}
          className="w-full py-4 bg-white/5 border border-white/10 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all disabled:opacity-30"
        >
          Annulla Operazione
        </button>
      </div>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(-100px); opacity: 0.2; }
          50% { transform: translateY(100px); opacity: 0.8; }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s infinite ease-in-out;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};
