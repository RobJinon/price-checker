import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { useCallback, useRef, useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera,
  CameraRef,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';

import { CameraControls } from '@/components/scanner/camera-controls';
import { ExposureSlider } from '@/components/scanner/exposure-slider';
import { FocusIndicator } from '@/components/scanner/focus-indicator';
import {
  ScannedDetails,
  ScannedProductDialog,
} from '@/components/scanner/scanned-product-dialog';
import { ViewfinderOverlay } from '@/components/scanner/viewfinder-overlay';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useProducts } from '@/context/products-context';
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner';
import { useCameraFocusExposure } from '@/hooks/use-camera-focus-exposure';

const ZOOM_LEVELS = [
  { label: '1x', value: 1 },
  { label: '1.5x', value: 1.5 },
  { label: '2x', value: 2 },
  { label: '3x', value: 3 },
];

export default function ScannerScreen() {
  const { findProductByBarcode } = useProducts();
  const cameraRef = useRef<CameraRef>(null);
  const { hasPermission, requestPermission } = useCameraPermission();

  const [isFocused, setIsFocused] = useState(true);
  const [isPreviewReady, setIsPreviewReady] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(0);
  const [zoomValue, setZoomValue] = useState(ZOOM_LEVELS[0].value);
  const zoomFrameRef = useRef<number | null>(null);
  const [scannedDetails, setScannedDetails] = useState<ScannedDetails | null>(null);

  useEffect(() => {
    return () => {
      if (zoomFrameRef.current !== null) {
        cancelAnimationFrame(zoomFrameRef.current);
      }
    };
  }, []);

  const device = useCameraDevice(facing);
  const minExposure = device?.supportsExposureBias ? device.minExposureBias : -2;
  const maxExposure = device?.supportsExposureBias ? device.maxExposureBias : 2;

  const {
    exposure,
    appliedExposure,
    isFocusLocked,
    focusPoint,
    panHandlers,
    updateExposure,
    flushExposure,
    unlockFocus,
    resetAll,
  } = useCameraFocusExposure({
    cameraRef,
    minExposure,
    maxExposure,
  });

  const isSessionActive = isFocused && !scannedDetails;
  const isCameraReady = isSessionActive && isPreviewReady;

  const { photoOutput } = useBarcodeScanner({
    isActive: isCameraReady && hasPermission && Boolean(device),
    onBarcodeDetected: useCallback(
      (result) => {
        const matchedProduct = findProductByBarcode(result.data);

        Haptics.notificationAsync(
          matchedProduct
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Warning
        );

        setScannedDetails({
          result,
          product: matchedProduct,
          scannedAt: new Date().toLocaleTimeString(),
        });
      },
      [findProductByBarcode]
    ),
  });

  const flipOpacity = useSharedValue(1);
  const flipScale = useSharedValue(1);

  const cameraTransitionStyle = useAnimatedStyle(() => ({
    opacity: flipOpacity.value,
    transform: [{ scale: flipScale.value }],
  }));

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => {
        setIsFocused(false);
        setIsPreviewReady(false);
        setTorchEnabled(false);
        resetAll(false);
      };
    }, [resetAll])
  );

  const toggleFacing = () => {
    flipOpacity.value = withSequence(
      withTiming(0.3, { duration: 110 }),
      withTiming(1, { duration: 200 })
    );
    flipScale.value = withSequence(
      withTiming(0.95, { duration: 110 }),
      withTiming(1, { duration: 200 })
    );

    if (zoomFrameRef.current !== null) {
      cancelAnimationFrame(zoomFrameRef.current);
      zoomFrameRef.current = null;
    }

    setIsPreviewReady(false);
    resetAll(true);
    setFacing((prev) => {
      const next = prev === 'back' ? 'front' : 'back';
      if (next === 'front') setTorchEnabled(false);
      setZoomIndex(0);
      setZoomValue(ZOOM_LEVELS[0].value);
      return next;
    });
  };

  const cycleZoom = () => {
    const nextIndex = (zoomIndex + 1) % ZOOM_LEVELS.length;
    const maxZoom = device?.maxZoom ?? 4;
    const startZoom = zoomValue;
    const targetZoom = Math.min(ZOOM_LEVELS[nextIndex].value, maxZoom);

    setZoomIndex(nextIndex);

    if (zoomFrameRef.current !== null) {
      cancelAnimationFrame(zoomFrameRef.current);
    }

    const duration = 220;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic curve matching Reanimated's default timing feel
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startZoom + (targetZoom - startZoom) * eased;

      setZoomValue(Number(current.toFixed(3)));

      if (progress < 1) {
        zoomFrameRef.current = requestAnimationFrame(animate);
      } else {
        zoomFrameRef.current = null;
      }
    };

    zoomFrameRef.current = requestAnimationFrame(animate);
  };

  const handleCameraError = useCallback((error: unknown) => {
    const errStr = String(error);
    if (
      errStr.includes('OperationCanceledException') ||
      errStr.includes('Cancelled by another')
    ) {
      return;
    }
    console.warn('Camera error:', error);
  }, []);

  if (!hasPermission) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background px-6">
        <Text className="text-center text-base text-foreground">
          Camera access is needed to scan barcodes.
        </Text>
        <Button onPress={requestPermission}>
          <Text>Grant Camera Permission</Text>
        </Button>
      </View>
    );
  }

  if (!device) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-center text-base text-muted-foreground">
          No {facing} camera device found.
        </Text>
      </View>
    );
  }

  const clampedExposure = device.supportsExposureBias
    ? Math.max(minExposure, Math.min(maxExposure, appliedExposure))
    : undefined;
  const exposureValue = isCameraReady ? clampedExposure : undefined;

  const torchMode =
    isCameraReady && device.hasTorch
      ? facing === 'back' && torchEnabled
        ? 'on'
        : 'off'
      : undefined;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
        <View>
          <Text className="text-xl font-bold text-foreground">Barcode Scanner</Text>
          <Text className="text-xs text-muted-foreground">Scan product barcode</Text>
        </View>
      </View>

      {/* 1:1 Square Camera & Overlay Wrapper */}
      <View style={styles.cameraWrapper}>
        <Animated.View style={[StyleSheet.absoluteFill, cameraTransitionStyle]}>
          <Camera
            key={device.id}
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={isSessionActive}
            outputs={[photoOutput]}
            zoom={isCameraReady ? zoomValue : undefined}
            exposure={exposureValue}
            torchMode={torchMode}
            onPreviewStarted={() => setIsPreviewReady(true)}
            onPreviewStopped={() => setIsPreviewReady(false)}
            onError={handleCameraError}
          />
        </Animated.View>

        <ViewfinderOverlay onScanBoxLayout={() => {}} />

        {/* Full Viewfinder Touch Layer for Tap-to-Focus, Focus Lock, and Vertical Drag Exposure */}
        <View style={StyleSheet.absoluteFill} {...panHandlers} />

        <FocusIndicator
          point={focusPoint}
          isLocked={isFocusLocked}
          exposure={exposure}
          minExposure={minExposure}
          maxExposure={maxExposure}
        />

        {/* AF Lock Top Banner */}
        {isFocusLocked && (
          <View className="absolute top-3 self-center z-20" pointerEvents="box-none">
            <Button
              variant="default"
              size="sm"
              onPress={unlockFocus}
              className="h-7 gap-1.5 rounded-full bg-amber-400 px-3 shadow-md active:bg-amber-500"
            >
              <Lock size={12} color="#000" />
              <Text className="text-xs font-bold text-black tracking-wide">
                AF LOCK
              </Text>
              <Text className="text-[10px] font-medium text-black/75">
                - Tap to unlock
              </Text>
            </Button>
          </View>
        )}
      </View>

      {/* Exposure (EV) Slider */}
      <ExposureSlider
        value={exposure}
        min={minExposure}
        max={maxExposure}
        onChange={updateExposure}
        onSettled={flushExposure}
        onReset={() => flushExposure(0)}
        disabled={!device.supportsExposureBias}
      />

      {/* Camera Controls */}
      <View className="my-2 flex flex-col items-center justify-center gap-1">
        <Text className="text-sm text-neutral-500">Camera Controls</Text>
        <CameraControls
          zoomLabel={ZOOM_LEVELS[zoomIndex].label}
          onCycleZoom={cycleZoom}
          torchEnabled={torchEnabled}
          onToggleTorch={() => setTorchEnabled((prev) => !prev)}
          isFrontCamera={facing === 'front'}
          onToggleFacing={toggleFacing}
        />
      </View>

      <ScannedProductDialog
        scannedDetails={scannedDetails}
        onClose={() => setScannedDetails(null)}
        onProductCreated={(product) =>
          setScannedDetails((prev) => (prev ? { ...prev, product } : null))
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cameraWrapper: {
    width: '100%',
    aspectRatio: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});