import { BarcodeScanningResult } from 'expo-camera';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { AddProductForm } from '@/components/scanner/add-product-form';
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
import { useProducts } from '@/context/products-context';
import { Product } from '@/data/mock-products';

export type ScannedDetails = {
  result: BarcodeScanningResult;
  product: Product | null;
  scannedAt: string;
};

type ScannedProductDialogProps = {
  scannedDetails: ScannedDetails | null;
  onClose: () => void;
  onProductCreated: (product: Product) => void;
};

export function ScannedProductDialog({
  scannedDetails,
  onClose,
  onProductCreated,
}: ScannedProductDialogProps) {
  const { addProduct } = useProducts();
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  useEffect(() => {
    setIsAddingProduct(false);
  }, [scannedDetails?.result.data]);

  if (!scannedDetails) return null;

  const handleSaveNewProduct = (data: { name: string; price: number; details: string }) => {
    const created = addProduct({
      barcode: scannedDetails.result.data,
      ...data,
    });
    setIsAddingProduct(false);
    onProductCreated(created);
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
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
              <Button variant="outline" className="flex-1" onPress={onClose}>
                <Text>Scan Again</Text>
              </Button>
              <Button className="flex-1" onPress={() => {}}>
                <Text>Add to Cart</Text>
              </Button>
            </DialogFooter>
          </>
        ) : isAddingProduct ? (
          <AddProductForm
            barcode={scannedDetails.result.data}
            barcodeType={scannedDetails.result.type}
            onSave={handleSaveNewProduct}
            onCancel={() => setIsAddingProduct(false)}
          />
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
              <Button variant="outline" className="flex-1" onPress={onClose}>
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
  );
}