import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import jsQR from 'jsqr';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError("Impossibile accedere alla fotocamera. Verifica i permessi del browser.");
      }
    };

    startCamera();

    const scanInterval = setInterval(() => {
      if (!isScanning) return;
      processFrame();
    }, 100);

    return () => {
      clearInterval(scanInterval);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isScanning]);

  const processFrame = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code && code.data) {
        console.log("QR Code detected:", code.data);
        setIsScanning(false);
        if (navigator.vibrate) navigator.vibrate(100);
        onScan(code.data);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col font-sans">
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
        <h2 className="text-white font-black text-xs uppercase tracking-widest">Scanner QR Club</h2>
        <button
          onClick={onClose}
          className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="w-64 h-64 border-2 border-emerald-500/30 rounded-[2.5rem] relative">
            <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-emerald-500 rounded-tl-[2rem]"></div>
            <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-emerald-500 rounded-tr-[2rem]"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-emerald-500 rounded-bl-[2rem]"></div>
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-emerald-500 rounded-br-[2rem]"></div>

            <div
              className="absolute top-0 left-4 right-4 h-1 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] opacity-50"
              style={{ animation: 'scanLine 2.5s infinite ease-in-out' }}
            ></div>
          </div>

          <div className="mt-12 px-8 text-center space-y-2">
            <p className="text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-sm">
              Inquadra il QR Code del Tee 1
            </p>
            <p className="text-white/40 text-[8px] font-bold uppercase tracking-widest">
              Posa la palla, scansiona e inizia il giro
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scanLine {
          0%, 100% { top: 10%; opacity: 0.2; }
          50% { top: 90%; opacity: 0.8; }
        }
      `}</style>

      {error && (
        <div className="absolute bottom-10 left-6 right-6 bg-red-500/90 backdrop-blur-md text-white p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center animate-in slide-in-from-bottom-4 duration-300">
          {error}
        </div>
      )}

      {!isScanning && !error && (
        <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-full animate-bounce">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      )}
    </div>
  );
};
