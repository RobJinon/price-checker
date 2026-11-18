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
  useAnimatedProps,
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

const AnimatedCameraView = Animated.createAnimatedComponent(CameraView);

const ZOOM_LEVELS = [
  { label: '1x', value: 0.16 },
  { label: '1.5x', value: 0.3 },
  { label: '2x', value: 0.5 },
  { label: '3x', value: 0.9 },
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

  const animatedZoom = useSharedValue(ZOOM_LEVELS[0].value);
  const flipOpacity = useSharedValue(1);
  const flipScale = useSharedValue(1);

  const animatedCameraProps = useAnimatedProps(() => ({
    zoom: animatedZoom.value,
  }));

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
      return next;
    });
  };

  const cycleZoom = () => {
    const nextIndex = (zoomIndex + 1) % ZOOM_LEVELS.length;
    setZoomIndex(nextIndex);
    animatedZoom.value = withTiming(ZOOM_LEVELS[nextIndex].value, { duration: 220 });
  };

  const handleTapToFocus = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    setFocusPoint({ x: locationX, y: locationY, key: Date.now() });

    // Briefly toggle autofocus off -> on to force the lens to re-focus
    setAutofocus('off');
    setTimeout(() => setAutofocus('on'), 120);
  };

  if (!permission) {
    return <View style={styles.container} />;
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

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (!scanBoxLayout || !result.bounds) return;

    const { origin, size } = result.bounds;
    const barcodeCenterX = origin.x + size.width / 2;
    const barcodeCenterY = origin.y + size.height / 2;

    const isInsideBox =
      barcodeCenterX >= scanBoxLayout.x &&
      barcodeCenterX <= scanBoxLayout.x + scanBoxLayout.width &&
      barcodeCenterY >= scanBoxLayout.y &&
      barcodeCenterY <= scanBoxLayout.y + scanBoxLayout.height;

    if (!isInsideBox) return;

    const matchedProduct = findProductByBarcode(result.data);

    Haptics.notificationAsync(
      matchedProduct
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning
    );

    cameraRef.current?.pausePreview();
    setScannedDetails({
      result,
      product: matchedProduct,
      scannedAt: new Date().toLocaleTimeString(),
    });
  };

  const handleCloseDialog = () => {
    setScannedDetails(null);
    cameraRef.current?.resumePreview();
  };

  return (
    <SafeAreaView>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
        <View>
          <Text className="text-xl font-bold text-foreground">Barcode Scanner</Text>
          <Text className="text-xs text-muted-foreground">
            Scan product barcode
          </Text>
        </View>
      </View>

      {/* 1:1 Square Camera & Overlay Wrapper */}
      <Pressable onPress={handleTapToFocus} style={styles.cameraWrapper}>
        {isFocused && (
          <Animated.View style={[StyleSheet.absoluteFill, cameraTransitionStyle]}>
            <AnimatedCameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing={facing}
              ratio="1:1"
              autofocus={autofocus}
              animatedProps={animatedCameraProps}
              enableTorch={facing === 'back' && torchEnabled}
              onBarcodeScanned={scannedDetails ? undefined : handleBarcodeScanned}
            />
          </Animated.View>
        )}

        <FocusIndicator point={focusPoint} />
        <ViewfinderOverlay onScanBoxLayout={setScanBoxLayout} />
      </Pressable>
      
      <View className='flex flex-col justify-center my-2 items-center gap-1'>
        <Text className='text-neutral-500 text-sm'>Camera Controls</Text>
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
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingTop: 64,
  },
  cameraWrapper: {
    width: '100%',
    aspectRatio: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
});