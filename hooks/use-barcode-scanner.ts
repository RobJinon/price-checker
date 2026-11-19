import BarcodeScanning from '@react-native-ml-kit/barcode-scanning';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useEffect, useRef } from 'react';
import { LayoutRectangle } from 'react-native';
import { usePhotoOutput } from 'react-native-vision-camera';

type UseBarcodeScannerOptions = {
  isActive: boolean;
  intervalMs?: number;
  scanBoxLayout: LayoutRectangle | null;
  containerLayout: { width: number; height: number } | null;
  isFrontCamera?: boolean;
  onBarcodeDetected: (result: { data: string; type: string }) => void;
};

export function useBarcodeScanner({
  isActive,
  intervalMs = 750,
  scanBoxLayout,
  containerLayout,
  isFrontCamera = false,
  onBarcodeDetected,
}: UseBarcodeScannerOptions) {
  const photoOutput = usePhotoOutput();
  const isScanningFrameRef = useRef(false);
  const callbackRef = useRef(onBarcodeDetected);
  const layoutRef = useRef({ scanBoxLayout, containerLayout, isFrontCamera });

  useEffect(() => {
    callbackRef.current = onBarcodeDetected;
  }, [onBarcodeDetected]);

  useEffect(() => {
    layoutRef.current = { scanBoxLayout, containerLayout, isFrontCamera };
  }, [scanBoxLayout, containerLayout, isFrontCamera]);

  useEffect(() => {
    if (!isActive) return;

    const getCropRegion = (photoWidth: number, photoHeight: number) => {
      const {
        scanBoxLayout: box,
        containerLayout: container,
        isFrontCamera: mirrored,
      } = layoutRef.current;

      if (!box || !container || !photoWidth || !photoHeight) return null;

      // manipulateAsync normalizes EXIF rotation into upright portrait dimensions
      const uprightWidth = Math.min(photoWidth, photoHeight);
      const uprightHeight = Math.max(photoWidth, photoHeight);

      // Map the 1:1 preview ("cover" scaling) back to upright image pixels
      const scale = Math.max(container.width / uprightWidth, container.height / uprightHeight);
      const offsetX = (uprightWidth * scale - container.width) / 2;
      const offsetY = (uprightHeight * scale - container.height) / 2;

      const boxX = mirrored ? container.width - (box.x + box.width) : box.x;

      const originX = Math.max(0, Math.round((boxX + offsetX) / scale));
      const originY = Math.max(0, Math.round((box.y + offsetY) / scale));
      const width = Math.min(uprightWidth - originX, Math.round(box.width / scale));
      const height = Math.min(uprightHeight - originY, Math.round(box.height / scale));

      if (width <= 0 || height <= 0) return null;
      return { originX, originY, width, height };
    };

    const interval = setInterval(async () => {
      if (isScanningFrameRef.current) return;
      isScanningFrameRef.current = true;

      try {
        const photo = await photoOutput.capturePhoto({}, {});
        try {
          const crop = getCropRegion(photo.width, photo.height);
          if (!crop) return;

          const tempPath = await photo.saveToTemporaryFileAsync();
          const fileUri = tempPath.startsWith('file://')
            ? tempPath
            : `file://${tempPath}`;

          const cropped = await manipulateAsync(fileUri, [{ crop }], {
            format: SaveFormat.JPEG,
          });

          const barcodes = await BarcodeScanning.scan(cropped.uri);
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