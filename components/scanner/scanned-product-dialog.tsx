import { Plus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, ScrollView, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

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
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { useProducts } from '@/context/products-context';
import { Product } from '@/data/mock-products';

export type ScannedDetails = {
  result: {
    data: string;
    type: string;
  };
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
  const { products, getVendorById, addProduct, upsertVendorPrice } = useProducts();
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isAddingPrice, setIsAddingPrice] = useState(false);
  const keyboardOffset = useSharedValue(0);

  const animatedDialogStyle = useAnimatedStyle(() => ({
    marginBottom: keyboardOffset.value,
  }));

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      keyboardOffset.value = withTiming(e.endCoordinates.height, { duration: 250 });
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      keyboardOffset.value = withTiming(0, { duration: 200 });
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    setIsAddingProduct(false);
    setIsAddingPrice(false);
    keyboardOffset.value = 0;
  }, [scannedDetails?.result.data]);

  if (!scannedDetails) return null;

  const liveProduct = scannedDetails.product
    ? (products.find((p) => p.id === scannedDetails.product?.id) ?? scannedDetails.product)
    : null;

  const handleSaveNewProduct = (data: {
    name: string;
    vendorName: string;
    vendorCategory?: import('@/data/mock-vendors').VendorCategory;
    vendorLocation?: string;
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

  const handleSaveVendorPrice = (data: {
    vendorName: string;
    vendorCategory?: import('@/data/mock-vendors').VendorCategory;
    vendorLocation?: string;
    price: number;
  }) => {
    if (!liveProduct) return;
    upsertVendorPrice(
      liveProduct.id,
      {
        name: data.vendorName,
        category: data.vendorCategory,
        location: data.vendorLocation,
      },
      data.price
    );
    setIsAddingPrice(false);
  };

  const sortedPrices = liveProduct
    ? [...liveProduct.prices]
        .sort((a, b) => a.price - b.price)
        .map((entry) => ({
          ...entry,
          vendor: getVendorById(entry.vendorId),
        }))
    : [];
  const lowestEntry = sortedPrices[0];

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-full w-[92vw] max-w-md border-0 bg-transparent p-0 shadow-none">
        <Animated.View
          style={animatedDialogStyle}
          className="max-h-[85vh] gap-4 rounded-lg border border-border bg-background p-6 shadow-lg"
        >
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
                </View>
                {lowestEntry && (
                  <View className="flex-row items-baseline gap-2">
                    <Text className="text-2xl font-extrabold text-emerald-500">
                      ₱{lowestEntry.price.toFixed(2)}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      lowest at {lowestEntry.vendor?.name ?? 'Unknown Store'}
                    </Text>
                  </View>
                )}
              </DialogHeader>

              <ScrollView
                className="max-h-full flex-shrink my-4"
                nestedScrollEnabled
                showsVerticalScrollIndicator
              >
                <View className="gap-4 pr-1" onStartShouldSetResponder={() => true}>
                  <View className="gap-1.5">
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
                    <View className='gap-1 my-2'>
                      {sortedPrices.map((entry, index) => (
                        <View
                          key={`${entry.vendorId}-${index}`}
                          className="flex-row items-center justify-between rounded-md bg-secondary/60 px-3 py-2"
                        >
                          <View className="flex-1 pr-2">
                            <Text className="text-sm font-medium text-foreground">
                              {entry.vendor?.name ?? 'Unknown Store'}
                            </Text>
                            <Text className="text-[11px] text-muted-foreground">
                              {entry.vendor?.location ? `${entry.vendor.location} • ` : ''}
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
                  </View>

                  <Separator />

                  <View className="gap-1">
                    <Text className="text-xs font-semibold uppercase text-muted-foreground">
                      Product Details
                    </Text>
                    <Text className="text-sm leading-relaxed text-foreground">
                      {liveProduct.details}
                    </Text>
                  </View>

                  <Separator />

                  <View className="gap-1">
                    <Text className="text-xs font-semibold uppercase text-muted-foreground">
                      Barcode
                    </Text>
                    <View className='flex flex-row w-full justify-between '>
                      <Text className="font-mono text-sm text-foreground" selectable>
                        {scannedDetails.result.data}
                      </Text>
                      <Badge variant="secondary">
                        <Text>{scannedDetails.result.type.toUpperCase()}</Text>
                      </Badge>
                    </View>
                  </View>
                </View>
              </ScrollView>

              <DialogFooter className="flex-row gap-3 mt-4">
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
        </Animated.View>
      </DialogContent>
    </Dialog>
  );
}