import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { Flashlight, FlashlightOff, SwitchCamera } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { LayoutRectangle, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { useProducts } from '@/context/products-context';
import { Product } from '@/data/mock-products';

const SCAN_BOX_WIDTH = 280;
const SCAN_BOX_HEIGHT = 170;
const CORNER_RADIUS = 16;
const MASK_BORDER_WIDTH = 1000;

const ZOOM_LEVELS = [
  { label: '1x', value: 0 },
  { label: '1.5x', value: 0.15 },
  { label: '2x', value: 0.3 },
];

type ScannedDetails = {
  result: BarcodeScanningResult;
  product: Product | null;
  scannedAt: string;
};

export default function ScannerScreen() {
  const { findProductByBarcode, addProduct } = useProducts();
  const [permission, requestPermission] = useCameraPermissions();
  const [isFocused, setIsFocused] = useState(true);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(0);
  const [scanBoxLayout, setScanBoxLayout] = useState<LayoutRectangle | null>(null);
  const [scannedDetails, setScannedDetails] = useState<ScannedDetails | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [details, setDetails] = useState('');

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
    setFacing((prev) => {
      const next = prev === 'back' ? 'front' : 'back';
      if (next === 'front') setTorchEnabled(false);
      return next;
    });
  };

  const cycleZoom = () => {
    setZoomIndex((prev) => (prev + 1) % ZOOM_LEVELS.length);
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

    setIsAddingProduct(false);
    setName('');
    setPrice('');
    setDetails('');
    setScannedDetails({
      result,
      product: matchedProduct,
      scannedAt: new Date().toLocaleTimeString(),
    });
  };

  const closeDialog = () => {
    setScannedDetails(null);
    setIsAddingProduct(false);
  };

  const handleSaveNewProduct = () => {
    if (!scannedDetails) return;
    const parsedPrice = parseFloat(price);
    if (!name.trim() || Number.isNaN(parsedPrice) || parsedPrice < 0) return;

    const created = addProduct({
      barcode: scannedDetails.result.data,
      name,
      price: parsedPrice,
      details,
    });

    setScannedDetails({ ...scannedDetails, product: created });
    setIsAddingProduct(false);
  };

  return (
    <View style={styles.container}>
      {/* 1:1 Square Camera & Overlay Wrapper */}
      <View style={styles.cameraWrapper}>
        {isFocused && (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing={facing}
            ratio="1:1"
            zoom={ZOOM_LEVELS[zoomIndex].value}
            enableTorch={facing === 'back' && torchEnabled}
            onBarcodeScanned={scannedDetails ? undefined : handleBarcodeScanned}
          />
        )}

        {/* Viewfinder Cutout Overlay */}
        <View style={styles.overlay} pointerEvents="none">
          <View style={styles.cutoutMask} />

          <View
            style={styles.scanWindow}
            onLayout={(event) => setScanBoxLayout(event.nativeEvent.layout)}
          >
            <Text className="absolute -top-9 self-center text-sm font-medium text-slate-200">
              Align barcode within the frame
            </Text>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            <View style={styles.scanLine} />
          </View>
        </View>
      </View>

      {/* Bottom Center Camera Controls */}
      <View className="flex-row items-center my-4 gap-5 rounded-full border border-white/15 bg-black/75 px-5 py-2.5">
        <Pressable
          onPress={cycleZoom}
          className="h-11 w-11 items-center justify-center rounded-full bg-white/10 active:opacity-75"
        >
          <Text className="text-xs font-bold text-slate-100">
            {ZOOM_LEVELS[zoomIndex].label}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setTorchEnabled((prev) => !prev)}
          disabled={facing === 'front'}
          className="h-12 w-12 items-center justify-center rounded-full bg-white/10 active:opacity-75 disabled:opacity-40"
        >
          {torchEnabled && facing === 'back' ? (
            <Flashlight size={22} color="#facc15" />
          ) : (
            <FlashlightOff size={22} color="#f8fafc" />
          )}
        </Pressable>

        <Pressable
          onPress={toggleFacing}
          className="h-11 w-11 items-center justify-center rounded-full bg-white/10 active:opacity-75"
        >
          <SwitchCamera size={21} color="#f8fafc" />
        </Pressable>
      </View>

      {/* Scanned Product Details Dialog */}
      {scannedDetails && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) closeDialog();
          }}
        >
          <DialogContent className="w-[92vw] max-w-md">
            {scannedDetails.product ? (
              <>
                <DialogHeader>
                  <View className="flex-row items-start justify-between gap-2 pr-6">
                    <DialogTitle className="flex-1 text-lg">
                      {scannedDetails.product.name}
                    </DialogTitle>
                    <Badge variant="secondary">
                      <Text>{scannedDetails.result.type.toUpperCase()}</Text>
                    </Badge>
                  </View>
                  <Text className="text-2xl font-extrabold text-emerald-500">
                    ₱{scannedDetails.product.price.toFixed(2)}
                  </Text>
                </DialogHeader>

                <ScrollView className="max-h-80">
                  <View className="gap-3">
                    <View className="gap-1 border-b border-border pb-3">
                      <Text className="text-xs font-semibold uppercase text-muted-foreground">
                        Product Details
                      </Text>
                      <Text className="text-sm leading-relaxed text-foreground">
                        {scannedDetails.product.details}
                      </Text>
                    </View>

                    <View className="gap-1">
                      <Text className="text-xs font-semibold uppercase text-muted-foreground">
                        Barcode
                      </Text>
                      <Text className="font-mono text-sm text-foreground" selectable>
                        {scannedDetails.result.data}
                      </Text>
                    </View>
                  </View>
                </ScrollView>

                <DialogFooter className="flex-row gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onPress={() => setScannedDetails(null)}
                  >
                    <Text>Scan Again</Text>
                  </Button>
                  <Button className="flex-1" onPress={() => {}}>
                    <Text>Add to Cart</Text>
                  </Button>
                </DialogFooter>
              </>
            ) : isAddingProduct ? (
              <>
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                  <DialogDescription>
                    Barcode: {scannedDetails.result.data} ({scannedDetails.result.type.toUpperCase()})
                  </DialogDescription>
                </DialogHeader>

                <ScrollView className="max-h-80" keyboardShouldPersistTaps="handled">
                  <View className="gap-3 py-1">
                    <View className="gap-1.5">
                      <Label nativeID="product-name">Product Name *</Label>
                      <Input
                        aria-labelledby="product-name"
                        placeholder="e.g. Kopiko Blanca Twin Pack"
                        value={name}
                        onChangeText={setName}
                      />
                    </View>

                    <View className="gap-1.5">
                      <Label nativeID="product-price">Price (₱) *</Label>
                      <Input
                        aria-labelledby="product-price"
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                        value={price}
                        onChangeText={setPrice}
                      />
                    </View>

                    <View className="gap-1.5">
                      <Label nativeID="product-details">Details</Label>
                      <Textarea
                        aria-labelledby="product-details"
                        placeholder="Size, variant, or short description..."
                        value={details}
                        onChangeText={setDetails}
                      />
                    </View>
                  </View>
                </ScrollView>

                <DialogFooter className="flex-row gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onPress={() => setIsAddingProduct(false)}
                  >
                    <Text>Back</Text>
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={!name.trim() || !price.trim() || Number.isNaN(parseFloat(price))}
                    onPress={handleSaveNewProduct}
                  >
                    <Text>Save Product</Text>
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle className="text-destructive">Product Not Found</DialogTitle>
                  <DialogDescription selectable>
                    No match for {scannedDetails.result.type.toUpperCase()}:{' '}
                    {scannedDetails.result.data}
                  </DialogDescription>
                </DialogHeader>

                <DialogFooter className="flex-row gap-3">
                  <Button variant="outline" className="flex-1" onPress={closeDialog}>
                    <Text>Scan Again</Text>
                  </Button>
                  <Button className="flex-1" onPress={() => setIsAddingProduct(true)}>
                    <Text>Add Product</Text>
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      )}
    </View>
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
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cutoutMask: {
    position: 'absolute',
    width: SCAN_BOX_WIDTH + MASK_BORDER_WIDTH * 2,
    height: SCAN_BOX_HEIGHT + MASK_BORDER_WIDTH * 2,
    borderWidth: MASK_BORDER_WIDTH,
    borderColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: MASK_BORDER_WIDTH + CORNER_RADIUS,
  },
  scanWindow: {
    width: SCAN_BOX_WIDTH,
    height: SCAN_BOX_HEIGHT,
    backgroundColor: 'transparent',
    justifyContent: 'center',
  },
  scanLine: {
    height: 4,
    backgroundColor: 'rgba(246, 59, 59, 0.85)',
    marginHorizontal: 12,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#f63b3b',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: CORNER_RADIUS,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: CORNER_RADIUS,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: CORNER_RADIUS,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: CORNER_RADIUS,
  },
});