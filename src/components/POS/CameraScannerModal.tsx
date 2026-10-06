import { useEffect, useRef, useState } from 'react';
import { Camera, X, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { posSound } from '../../utils/sound';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (barcode: string) => void;
}

export function CameraScannerModal({
  isOpen,
  onClose,
  onDetected,
}: CameraScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [hasBarcodeDetector, setHasBarcodeDetector] = useState<boolean>(false);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setIsScanning(true);

    const hasDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;
    setHasBarcodeDetector(hasDetector);

    let stream: MediaStream | null = null;

    navigator.mediaDevices
      ?.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(() => {});
        }

        if (hasDetector) {
          // Initialize native BarcodeDetector
          try {
            // @ts-expect-error - BarcodeDetector is standard in modern Chromium/Edge
            const detector = new window.BarcodeDetector({
              formats: [
                'ean_13',
                'ean_8',
                'upc_a',
                'upc_e',
                'code_128',
                'code_39',
                'qr_code',
                'data_matrix',
              ],
            });

            const scanLoop = async () => {
              if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
                try {
                  const barcodes = await detector.detect(videoRef.current);
                  if (barcodes && barcodes.length > 0) {
                    const code = barcodes[0].rawValue;
                    if (code) {
                      posSound.playScanBeep();
                      onDetected(code);
                      onClose();
                      return;
                    }
                  }
                } catch {
                  // Frame decode skip
                }
              }
              animFrameRef.current = requestAnimationFrame(scanLoop);
            };

            animFrameRef.current = requestAnimationFrame(scanLoop);
          } catch (e) {
            console.error('BarcodeDetector error', e);
          }
        }
      })
      .catch((err) => {
        console.error('Camera access error', err);
        setErrorMsg('Camera access was denied or not available. You can type the barcode below.');
      });

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, onDetected, onClose]);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    posSound.playScanBeep();
    onDetected(manualCode.trim());
    setManualCode('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-slate-100">Barcode Scanner</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewfinder */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Aiming Reticle */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-32 border-2 border-dashed border-amber-400/80 rounded-lg relative flex items-center justify-center">
              <div className="w-full h-0.5 bg-rose-500/80 animate-pulse" />
              <span className="absolute -bottom-6 text-[10px] text-amber-300 font-mono tracking-wider bg-black/70 px-2 py-0.5 rounded">
                ALIGN BARCODE IN FRAME
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center">
              <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
              <p className="text-xs text-slate-300 mb-4">{errorMsg}</p>
            </div>
          )}
        </div>

        {/* Footer & Manual Fallback */}
        <div className="p-4 bg-slate-950 flex flex-col gap-3">
          <div className="text-xs text-slate-400 text-center">
            {hasBarcodeDetector
              ? 'Point camera at any Greeting Card, Gift Bag, or Product barcode'
              : 'Position code steady or type the numbers directly below:'}
          </div>

          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              autoFocus
              placeholder="Or enter barcode manually..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Enter
            </button>
          </form>

          <p className="text-[11px] text-slate-500 text-center">
            Tip: Plug-and-play USB barcode scanners also work instantly anywhere in the app!
          </p>
        </div>
      </div>
    </div>
  );
}
