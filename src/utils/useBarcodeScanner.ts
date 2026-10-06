import { useEffect, useRef } from 'react';

interface BarcodeScannerOptions {
  onScan: (barcode: string) => void;
  minChars?: number;
  maxDelayMs?: number;
  enabled?: boolean;
}

export function useBarcodeScanner({
  onScan,
  minChars = 3,
  maxDelayMs = 60,
  enabled = true,
}: BarcodeScannerOptions) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // If user is actively typing in a standard input or textarea, don't hijack unless it's barcode scanner input
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      
      const now = Date.now();
      const timeDiff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        if (bufferRef.current.length >= minChars) {
          // If rapid buffer accumulated, fire scan
          const scannedCode = bufferRef.current.trim();
          bufferRef.current = '';
          e.preventDefault();
          onScan(scannedCode);
        }
        bufferRef.current = '';
        return;
      }

      // If key is single printable char
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // Barcode scanners type very quickly (<50ms per key)
        if (timeDiff > maxDelayMs && !isInput) {
          // Reset buffer if delay too long and not already typing
          bufferRef.current = e.key;
        } else {
          bufferRef.current += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onScan, minChars, maxDelayMs, enabled]);
}
