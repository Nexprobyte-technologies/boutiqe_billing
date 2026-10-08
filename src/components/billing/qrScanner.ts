declare global {
  interface Window {
    jsQR?: (
      data: Uint8ClampedArray,
      width: number,
      height: number,
      options?: { inversionAttempts?: 'attemptBoth' | 'dontInvert' | 'onlyInvert' | 'invertFirst' }
    ) => { data: string } | null;
  }
}

let qrLibraryPromise: Promise<void> | null = null;

export function loadQrLibrary(): Promise<void> {
  if (window.jsQR) return Promise.resolve();
  if (qrLibraryPromise) return qrLibraryPromise;

  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
    script.async = true;
    script.onload = () => window.jsQR ? resolve() : reject(new Error('QR decoder did not load.'));
    script.onerror = () => reject(new Error('Could not load QR decoder. Check your internet connection.'));
    document.head.appendChild(script);
  }).catch((error) => {
    qrLibraryPromise = null;
    throw error;
  });
  qrLibraryPromise = promise;

  return promise;
}

export function decodeQrFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement): string | null {
  if (!window.jsQR || !video.videoWidth || !video.videoHeight) return null;

  const scale = Math.min(1, 720 / video.videoWidth);
  const width = Math.max(1, Math.round(video.videoWidth * scale));
  const height = Math.max(1, Math.round(video.videoHeight * scale));
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(video, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height);
  return window.jsQR(pixels.data, width, height, { inversionAttempts: 'dontInvert' })?.data || null;
}
