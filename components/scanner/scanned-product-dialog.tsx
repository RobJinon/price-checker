import { BarcodeScanningResult } from 'expo-camera';
import { Plus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { AddProductForm } from '@/components/scanner/add-product-form';
import { AddVendorPriceForm } from '@/components/scanner/add-vendor-price-form';
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
  const { products, addProduct, upsertVendorPrice } = useProducts();
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isAddingPrice, setIsAddingPrice] = useState(false);

  useEffect(() => {
    setIsAddingProduct(false);
    setIsAddingPrice(false);
  }, [scannedDetails?.result.data]);

  if (!scannedDetails) return null;

  const liveProduct = scannedDetails.product
    ? (products.find((p) => p.id === scannedDetails.product?.id) ?? scannedDetails.product)
    : null;

  const handleSaveNewProduct = (data: {
    name: string;
    vendor: string;
    price: number;
    details: string;
  }) => {
    const created = addProduct({
      barcode: scannedDetails.result.data,
      ...data,
    });
    setIsAddingProduct(false);
    onProductCreated(created);
  };

  const handleSaveVendorPrice = (data: { vendor: string; price: number }) => {
    if (!liveProduct) return;
    upsertVendorPrice(liveProduct.id, data.vendor, data.price);
    setIsAddingPrice(false);
  };

  const sortedPrices = liveProduct
    ? [...liveProduct.prices].sort((a, b) => a.price - b.price)
    : [];
  const lowestEntry = sortedPrices[0];

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] w-[92vw] max-w-md">
        {liveProduct && isAddingPrice ? (
          <AddVendorPriceForm
            productName={liveProduct.name}
            existingPrices={liveProduct.prices}
            onSave={handleSaveVendorPrice}
            onCancel={() => setIsAddingPrice(false)}
          />
        ) : liveProduct ? (
          <>
            <DialogHeader>
              <View className="flex-row items-start justify-between gap-2 pr-6">
                <DialogTitle className="flex-1 text-lg">{liveProduct.name}</DialogTitle>
                <Badge variant="secondary">
                  <Text>{scannedDetails.result.type.toUpperCase()}</Text>
                </Badge>
              </View>
              {lowestEntry && (
                <View className="flex-row items-baseline gap-2">
                  <Text className="text-2xl font-extrabold text-emerald-500">
                    ₱{lowestEntry.price.toFixed(2)}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    lowest at {lowestEntry.vendor}
                  </Text>
                </View>
              )}
            </DialogHeader>

            <ScrollView
              className="max-h-full flex-shrink"
              nestedScrollEnabled
              showsVerticalScrollIndicator
            >
              <View className="gap-4 pr-1" onStartShouldSetResponder={() => true}>
                <View className="gap-1.5 border-b border-border pb-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs font-semibold uppercase text-muted-foreground">
                      Prices by Store ({sortedPrices.length})
                    </Text>
                    <Pressable
                      onPress={() => setIsAddingPrice(true)}
                      className="flex-row items-center gap-1 rounded-md bg-secondary px-2.5 py-1 active:opacity-75"
                    >
                      <Plus size={13} color="#10b981" />
                      <Text className="text-xs font-semibold text-emerald-500">Add Price</Text>
                    </Pressable>
                  </View>
                  {sortedPrices.map((entry, index) => (
                    <View
                      key={`${entry.vendor}-${index}`}
                      className="flex-row items-center justify-between rounded-md bg-secondary/60 px-3 py-2"
                    >
                      <View>
                        <Text className="text-sm font-medium text-foreground">
                          {entry.vendor}
                        </Text>
                        <Text className="text-[11px] text-muted-foreground">
                          Updated {entry.updatedAt}
                        </Text>
                      </View>
                      <Text
                        className={`text-sm font-bold ${
                          index === 0 ? 'text-emerald-500' : 'text-foreground'
                        }`}
                      >
                        ₱{entry.price.toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>

                <View className="gap-1 border-b border-border pb-3">
                  <Text className="text-xs font-semibold uppercase text-muted-foreground">
                    Product Details
                  </Text>
                  <Text className="text-sm leading-relaxed text-foreground">
                    {liveProduct.details}
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