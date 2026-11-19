import BarcodeScanning from '@react-native-ml-kit/barcode-scanning';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { Sun } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { GestureResponderEvent, Pressable, StyleSheet, View } from 'react-native';
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
  usePhotoOutput,
} from 'react-native-vision-camera';

import { CameraControls } from '@/components/scanner/camera-controls';
import { FocusIndicator } from '@/components/scanner/focus-indicator';
import {
  ScannedDetails,
  ScannedProductDialog,
} from '@/components/scanner/scanned-product-dialog';
import { ViewfinderOverlay } from '@/components/scanner/viewfinder-overlay';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useProducts } from '@/context/products-context';

const ZOOM_LEVELS = [
  { label: '1x', value: 1 },
  { label: '1.5x', value: 1.5 },
  { label: '2x', value: 2 },
  { label: '3x', value: 3 },
];

const EXPOSURE_STEPS = [
  { label: '-2', ev: -2 },
  { label: '-1', ev: -1 },
  { label: '0', ev: 0 },
  { label: '+1', ev: 1 },
  { label: '+2', ev: 2 },
];

export default function ScannerScreen() {
  const { findProductByBarcode } = useProducts();
  const cameraRef = useRef<CameraRef>(null);
  const isScanningFrameRef = useRef(false);
  const { hasPermission, requestPermission } = useCameraPermission();
  const photoOutput = usePhotoOutput();

  const [isFocused, setIsFocused] = useState(true);
  const [isPreviewReady, setIsPreviewReady] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(0);
  const [exposureIndex, setExposureIndex] = useState(2); // Default '0' EV
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number; key: number } | null>(
    null
  );
  const [scannedDetails, setScannedDetails] = useState<ScannedDetails | null>(null);

  const device = useCameraDevice(facing);
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
      };
    }, [])
  );

  // Periodic barcode scan via VisionCamera v5 PhotoOutput + ML Kit
  useEffect(() => {
    if (!isFocused || !isPreviewReady || !hasPermission || !device || scannedDetails) return;

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
            const matchedProduct = findProductByBarcode(hit.value);

            Haptics.notificationAsync(
              matchedProduct
                ? Haptics.NotificationFeedbackType.Success
                : Haptics.NotificationFeedbackType.Warning
            );

            setScannedDetails({
              result: {
                data: hit.value,
                type: String(hit.format ?? 'barcode'),
              },
              product: matchedProduct,
              scannedAt: new Date().toLocaleTimeString(),
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
    }, 750);

    return () => clearInterval(interval);
  }, [
    isFocused,
    isPreviewReady,
    hasPermission,
    device,
    scannedDetails,
    photoOutput,
    findProductByBarcode,
  ]);

  const toggleFacing = () => {
    flipOpacity.value = withSequence(
      withTiming(0.3, { duration: 110 }),
      withTiming(1, { duration: 200 })
    );
    flipScale.value = withSequence(
      withTiming(0.95, { duration: 110 }),
      withTiming(1, { duration: 200 })
    );

    setIsPreviewReady(false);
    setFacing((prev) => {
      const next = prev === 'back' ? 'front' : 'back';
      if (next === 'front') setTorchEnabled(false);
      setZoomIndex(0);
      return next;
    });
  };

  const cycleZoom = () => {
    const nextIndex = (zoomIndex + 1) % ZOOM_LEVELS.length;
    setZoomIndex(nextIndex);
  };

  const handleTapToFocus = async (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    setFocusPoint({ x: locationX, y: locationY, key: Date.now() });

    try {
      await cameraRef.current?.focusTo({ x: locationX, y: locationY });
    } catch {
      // Ignore focus cancellation if user taps rapidly
    }
  };

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

  const isSessionActive = isFocused && !scannedDetails;
  const isCameraReady = isSessionActive && isPreviewReady;

  const zoomValue = Math.min(ZOOM_LEVELS[zoomIndex].value, device.maxZoom);

  const targetEv = EXPOSURE_STEPS[exposureIndex].ev;
  const exposureValue = device.supportsExposureBias
    ? Math.max(device.minExposureBias, Math.min(device.maxExposureBias, targetEv))
    : undefined;

  const torchMode =
    isCameraReady && device.hasTorch
      ? facing === 'back' && torchEnabled
        ? 'on'
        : 'off'
      : undefined;

  const handleCloseDialog = () => {
    setScannedDetails(null);
  };

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
      <Pressable onPress={handleTapToFocus} style={styles.cameraWrapper}>
        <Animated.View style={[StyleSheet.absoluteFill, cameraTransitionStyle]}>
          <Camera
            key={device.id}
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={isSessionActive}
            outputs={[photoOutput]}
            zoom={isCameraReady ? zoomValue : undefined}
            exposure={isCameraReady ? exposureValue : undefined}
            torchMode={torchMode}
            onPreviewStarted={() => setIsPreviewReady(true)}
            onPreviewStopped={() => setIsPreviewReady(false)}
          />
        </Animated.View>

        <FocusIndicator point={focusPoint} />
        <ViewfinderOverlay onScanBoxLayout={() => {}} />
      </Pressable>

      {/* Exposure (EV) Selector */}
      <View className="mt-2.5 flex-row items-center justify-center gap-1.5 px-4">
        <Sun size={14} color="#facc15" />
        <Text className="mr-1 text-xs font-medium text-muted-foreground">EV</Text>
        {EXPOSURE_STEPS.map((step, index) => {
          const isSelected = exposureIndex === index;
          return (
            <Pressable
              key={step.label}
              onPress={() => setExposureIndex(index)}
              className={`rounded-full border px-2.5 py-0.5 ${
                isSelected
                  ? 'border-amber-400 bg-amber-400/20'
                  : 'border-border bg-secondary'
              }`}
            >
              <Text
                className={`text-xs ${
                  isSelected ? 'font-bold text-amber-400' : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

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
        onClose={handleCloseDialog}
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