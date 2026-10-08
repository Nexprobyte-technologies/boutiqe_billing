import React, { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, X } from 'lucide-react';
import { decodeEanFrame } from './eanScanner';
import { decodeQrFrame, loadQrLibrary } from './qrScanner';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => Promise<string | null>;
}

type NativeBarcodeDetector = new () => {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
};

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ isOpen, onClose, onScan }) => {
  const [manualCode, setManualCode] = useState('');
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [scannerMessage, setScannerMessage] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onScanRef = useRef(onScan);
  const lastProcessedRef = useRef<{ code: string; at: number } | null>(null);
  onScanRef.current = onScan;

  const triggerScan = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;
    setLastScanned(code);
    setScanResult('Checking barcode against the product catalog…');
    try {
      const productName = await onScanRef.current(code);
      setScanResult(productName ? `Matched: ${productName} — added to bill` : `No product found for barcode ${code}`);
      setManualCode('');
    } catch (error) {
      setScanResult(error instanceof Error ? error.message : 'Could not check this barcode.');
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    let scanTimer = 0;
    let stream: MediaStream | null = null;
    let detecting = false;

    const startCamera = async () => {
      const Detector = (window as Window & { BarcodeDetector?: NativeBarcodeDetector }).BarcodeDetector;
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Camera access requires localhost or a secure HTTPS connection.');
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        const detector = Detector ? new Detector() : null;
        setScannerMessage('Camera ready. Scan a QR code or EAN / UPC barcode.');
        setCameraReady(true);

        void loadQrLibrary().then(() => {
          if (!cancelled) setScannerMessage('QR and EAN / UPC scanning ready.');
        }).catch(() => {
          if (!cancelled && !detector) setScannerMessage('EAN / UPC scanning ready. QR decoder could not load; check your internet connection.');
        });

        const detectFrame = async () => {
          if (cancelled) return;
          if (!detecting && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            detecting = true;
            try {
              let code: string | undefined;
              if (detector) {
                try {
                  const hits = await detector.detect(video);
                  code = hits.find((hit) => hit.rawValue)?.rawValue?.trim();
                } catch {
                  // Use the built-in EAN / UPC decoder if native detection fails.
                }
              }
              if (!code && canvasRef.current) code = decodeQrFrame(video, canvasRef.current) || undefined;
              if (!code && canvasRef.current) code = decodeEanFrame(video, canvasRef.current) || undefined;
              const now = Date.now();
              const previous = lastProcessedRef.current;
              if (code && (!previous || previous.code !== code || now - previous.at > 1500)) {
                lastProcessedRef.current = { code, at: now };
                await triggerScan(code);
              }
            } catch {
              // An undecodable frame is expected while the camera is moving.
            } finally {
              detecting = false;
            }
          }
          scanTimer = window.setTimeout(() => void detectFrame(), 180);
        };
        detectFrame();
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Camera could not be opened.';
          setCameraError(message.toLowerCase().includes('permission')
            ? 'Allow camera access in your browser, then reopen the scanner.'
            : `Camera could not be opened: ${message}`);
        }
      }
    };

    setCameraError(null);
    setScannerMessage('');
    setCameraReady(false);
    void startCamera();

    return () => {
      cancelled = true;
      window.clearTimeout(scanTimer);
      stream?.getTracks().forEach((track) => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      setCameraReady(false);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void triggerScan(manualCode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-800"><Camera className="h-5 w-5" /></span>
            <div>
              <h3 className="font-semibold text-stone-900">Camera barcode scanner</h3>
              <p className="text-xs text-stone-500">Scan a product to match it to your catalog</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close scanner" className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-4 p-6">
          <div className="relative aspect-video overflow-hidden rounded-xl bg-stone-950">
            <video ref={videoRef} className="h-full w-full object-cover" autoPlay muted playsInline />
            <canvas ref={canvasRef} className="hidden" />
            <div className="pointer-events-none absolute inset-x-[14%] top-1/2 h-24 -translate-y-1/2 rounded-xl border-2 border-amber-400 shadow-[0_0_0_999px_rgba(0,0,0,0.25)]" />
            {!cameraReady && !cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-stone-950/90 text-sm text-stone-200">
                <Camera className="h-7 w-7 animate-pulse text-amber-400" /> Starting camera…
              </div>
            )}
            {cameraError && <div className="absolute inset-0 flex items-center justify-center bg-stone-950/95 px-8 text-center text-xs leading-relaxed text-stone-200">{cameraError}</div>}
          </div>

          {scannerMessage && <p className="text-[11px] text-stone-500">{scannerMessage}</p>}
          {lastScanned && <p className="text-xs font-mono text-stone-600">Scanned: {lastScanned}</p>}
          {scanResult && <p role="status" className={`rounded-lg px-3 py-2 text-xs ${scanResult.startsWith('Matched:') ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>{scanResult}</p>}
          <p className="text-[11px] text-stone-500">Hold the barcode inside the frame. Matching items are added to the current bill.</p>

          <form onSubmit={handleManualSubmit} className="flex gap-2 border-t border-stone-100 pt-4">
            <input
              type="text"
              value={manualCode}
              onChange={(event) => setManualCode(event.target.value)}
              placeholder="Or enter a barcode / use USB scanner"
              className="min-w-0 flex-1 rounded-xl border border-stone-200 px-3.5 py-2.5 font-mono text-xs focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              autoFocus
            />
            <button type="submit" disabled={!manualCode.trim()} className="rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-medium text-white hover:bg-stone-800 disabled:opacity-50">Check code</button>
          </form>
        </div>
      </div>
    </div>
  );
};
