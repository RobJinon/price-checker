import { BarcodeScanningResult, BarcodeSettings } from 'expo-camera';
import { useCallback, useEffect, useRef } from 'react';
import { LayoutRectangle } from 'react-native';

type UseBarcodeScannerOptions = {
  isActive: boolean;
  intervalMs?: number;
  scanBoxLayout: LayoutRectangle | null;
  containerLayout: { width: number; height: number } | null;
  isFrontCamera?: boolean;
  onBarcodeDetected: (result: { data: string; type: string }) => void;
};

const BARCODE_SETTINGS: BarcodeSettings = {
  barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'],
};

export function useBarcodeScanner({
  isActive,
  intervalMs = 750,
  scanBoxLayout,
  containerLayout,
  isFrontCamera = false,
  onBarcodeDetected,
}: UseBarcodeScannerOptions) {
  const lastScanTimeRef = useRef(0);
  const callbackRef = useRef(onBarcodeDetected);
  const layoutRef = useRef({ scanBoxLayout, containerLayout, isFrontCamera });

  useEffect(() => {
    callbackRef.current = onBarcodeDetected;
  }, [onBarcodeDetected]);

  useEffect(() => {
    layoutRef.current = { scanBoxLayout, containerLayout, isFrontCamera };
  }, [scanBoxLayout, containerLayout, isFrontCamera]);

  const handleBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      if (!isActive || !result.data) return;

      const now = Date.now();
      if (now - lastScanTimeRef.current < intervalMs) return;

      const { scanBoxLayout: box } = layoutRef.current;
      if (box && result.bounds?.origin && result.bounds?.size) {
        const centerX = result.bounds.origin.x + result.bounds.size.width / 2;
        const centerY = result.bounds.origin.y + result.bounds.size.height / 2;
        const isInsideBox =
          centerX >= box.x &&
          centerX <= box.x + box.width &&
          centerY >= box.y &&
          centerY <= box.y + box.height;

        if (!isInsideBox) return;
      }

      lastScanTimeRef.current = now;
      callbackRef.current({
        data: result.data,
        type: String(result.type ?? 'barcode'),
      });
    },
    [isActive, intervalMs]
  );

  return {
    onBarcodeScanned: isActive ? handleBarcodeScanned : undefined,
    barcodeScannerSettings: BARCODE_SETTINGS,
  };
}