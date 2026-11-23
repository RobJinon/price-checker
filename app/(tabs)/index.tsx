import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  GestureResponderEvent,
  LayoutRectangle,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  { label: '1.5x', value: 0.2 },
  { label: '1x', value: 0 },
  { label: '2x', value: 0.35 },
  { label: '3x', value: 0.65 },
];

export default function ScannerScreen() {
  const { findProductByBarcode } = useProducts();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [isFocused, setIsFocused] = useState(true);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(0);
  const [autofocus, setAutofocus] = useState<'on' | 'off'>('on');
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number; key: number } | null>(
    null
  );
  const [scanBoxLayout, setScanBoxLayout] = useState<LayoutRectangle | null>(null);
  const [scannedDetails, setScannedDetails] = useState<ScannedDetails | null>(null);

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
        setTorchEnabled(false);
      };
    }, [])
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

  const handleTapToFocus = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    setFocusPoint({ x: locationX, y: locationY, key: Date.now() });

    // Briefly cycle autofocus off -> on to re-trigger focus in expo-camera
    setAutofocus('off');
    setTimeout(() => setAutofocus('on'), 150);
  };

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (!result.data) return;

    if (scanBoxLayout && result.bounds) {
      const { origin, size } = result.bounds;
      const barcodeCenterX = origin.x + size.width / 2;
      const barcodeCenterY = origin.y + size.height / 2;

      const isInsideBox =
        barcodeCenterX >= scanBoxLayout.x &&
        barcodeCenterX <= scanBoxLayout.x + scanBoxLayout.width &&
        barcodeCenterY >= scanBoxLayout.y &&
        barcodeCenterY <= scanBoxLayout.y + scanBoxLayout.height;

      if (!isInsideBox) return;
    }

    const matchedProduct = findProductByBarcode(result.data);

    Haptics.notificationAsync(
      matchedProduct
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning
    );

    setScannedDetails({
      result: {
        data: result.data,
        type: result.type,
      },
      product: matchedProduct,
      scannedAt: new Date().toLocaleTimeString(),
    });
  };

  const handleCloseDialog = () => {
    setScannedDetails(null);
  };

  if (!permission) {
    return <View className="flex-1 bg-background" />;
  }

  if (!permission.granted) {
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

  return (
    <SafeAreaView className="flex bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
        <View>
          <Text className="text-xl font-bold text-foreground">Barcode Scanner</Text>
          <Text className="text-xs text-muted-foreground">Scan product barcode</Text>
        </View>
      </View>

      {/* 1:1 Square Camera & Overlay Wrapper */}
      <Pressable onPress={handleTapToFocus} style={styles.cameraWrapper}>
        {isFocused && (
          <Animated.View style={[StyleSheet.absoluteFill, cameraTransitionStyle]}>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing={facing}
              zoom={ZOOM_LEVELS[zoomIndex].value}
              autofocus={autofocus}
              enableTorch={facing === 'back' && torchEnabled}
              barcodeScannerSettings={{
                barcodeTypes: [
                  'qr',
                  'ean13',
                  'ean8',
                  'code128',
                  'code39',
                  'upc_a',
                  'upc_e',
                  'itf14',
                  'codabar',
                  'datamatrix',
                ],
              }}
              onBarcodeScanned={scannedDetails ? undefined : handleBarcodeScanned}
            />
          </Animated.View>
        )}

        <FocusIndicator point={focusPoint} />
        <ViewfinderOverlay onScanBoxLayout={setScanBoxLayout} />
      </Pressable>

      {/* Camera Controls */}
      <View className="mt-4 flex flex-col items-center justify-center gap-1">
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
