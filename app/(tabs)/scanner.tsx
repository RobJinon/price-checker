import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { LayoutRectangle, ScrollView, StyleSheet, View } from 'react-native';

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
import { Text } from '@/components/ui/text';
import { findProductByBarcode, Product } from '@/data/mock-products';

const SCAN_BOX_WIDTH = 280;
const SCAN_BOX_HEIGHT = 170;
const CORNER_RADIUS = 16;
const MASK_BORDER_WIDTH = 1000;

type ScannedDetails = {
  result: BarcodeScanningResult;
  product: Product | null;
  scannedAt: string;
};

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isFocused, setIsFocused] = useState(true);
  const [scanBoxLayout, setScanBoxLayout] = useState<LayoutRectangle | null>(null);
  const [scannedDetails, setScannedDetails] = useState<ScannedDetails | null>(null);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, [])
  );

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

    setScannedDetails({
      result,
      product: findProductByBarcode(result.data),
      scannedAt: new Date().toLocaleTimeString(),
    });
  };

  return (
    <View style={styles.container}>
      {isFocused && (
        <CameraView
          style={styles.camera}
          facing="back"
          ratio="16:9"
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

      {/* Scanned Product Details Dialog */}
      {scannedDetails && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setScannedDetails(null);
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
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle className="text-destructive">Product Not Found</DialogTitle>
                  <DialogDescription selectable>
                    No match for {scannedDetails.result.type.toUpperCase()}:{' '}
                    {scannedDetails.result.data}
                  </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                  <Button className="w-full" onPress={() => setScannedDetails(null)}>
                    <Text>Scan Again</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  camera: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
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