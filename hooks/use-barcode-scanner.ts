import BarcodeScanning from '@react-native-ml-kit/barcode-scanning';
import { useEffect, useRef } from 'react';
import { usePhotoOutput } from 'react-native-vision-camera';

type UseBarcodeScannerOptions = {
  isActive: boolean;
  intervalMs?: number;
  onBarcodeDetected: (result: { data: string; type: string }) => void;
};

export function useBarcodeScanner({
  isActive,
  intervalMs = 750,
  onBarcodeDetected,
}: UseBarcodeScannerOptions) {
  const photoOutput = usePhotoOutput();
  const isScanningFrameRef = useRef(false);
  const callbackRef = useRef(onBarcodeDetected);

  useEffect(() => {
    callbackRef.current = onBarcodeDetected;
  }, [onBarcodeDetected]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(async () => {
      if (isScanningFrameRef.current) return;
      isScanningFrameRef.current = true;

      try {
        const photo = await photoOutput.capturePhoto({}, {});
        try {
          const tempPath = await photo.saveToTemporaryFileAsync();
          const fileUri = tempPath.startsWith('file://')
            ? tempPath
            : `file://${tempPath}`;

          const barcodes = await BarcodeScanning.scan(fileUri);
          const hit = barcodes.find((b) => Boolean(b.value));

          if (hit?.value) {
            callbackRef.current({
              data: hit.value,
              type: String(hit.format ?? 'barcode'),
            });
          }
        } finally {
          photo.dispose();
        }
      } catch {
        // Ignore transient capture errors while focusing or switching cameras
      } finally {
        isScanningFrameRef.current = false;
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isActive, intervalMs, photoOutput]);

  return { photoOutput };
}