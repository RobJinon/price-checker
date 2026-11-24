import * as Haptics from 'expo-haptics';
import { Plus, ShoppingCart } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Image, Keyboard, Platform, Pressable, ScrollView, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AddVendorPriceForm } from '@/components/scanner/add-vendor-price-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { useCart } from '@/context/cart-context';
import { useProducts } from '@/context/products-context';
import { Product } from '@/data/mock-products';
import { VendorCategory } from '@/data/mock-vendors';
import { useProductLookup } from '@/hooks/use-product-lookup';

type ProductDetailDialogProps = {
  product: Product | null;
  onClose: () => void;
};

export function ProductDetailDialog({ product, onClose }: ProductDetailDialogProps) {
  const { products, getVendorById, upsertVendorPrice } = useProducts();
  const { addToCart } = useCart();
  const [isAddingPrice, setIsAddingPrice] = useState(false);
  const keyboardOffset = useSharedValue(0);
  const { lookupBarcode } = useProductLookup();
  const [offImageUrl, setOffImageUrl] = useState<string | null>(null);

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
    setIsAddingPrice(false);
    keyboardOffset.value = 0;
  }, [product?.id]);

  useEffect(() => {
    const barcode = product?.barcodes[0];
    setOffImageUrl(null);
    if (!barcode) return;

    let isMounted = true;
    lookupBarcode(barcode).then((offProduct) => {
      if (isMounted) {
        setOffImageUrl(offProduct?.imageUrl ?? null);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [product?.id, product?.barcodes, lookupBarcode]);

  if (!product) return null;

  const liveProduct = products.find((p) => p.id === product.id) ?? product;

  const sortedPrices = [...liveProduct.prices]
    .sort((a, b) => a.price - b.price)
    .map((entry) => ({
      ...entry,
      vendor: getVendorById(entry.vendorId),
    }));

  const lowestEntry = sortedPrices[0];

  const handleSaveVendorPrice = (data: {
    vendorName: string;
    vendorCategory?: VendorCategory;
    vendorLocation?: string;
    price: number;
  }) => {
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
          {isAddingPrice ? (
            <AddVendorPriceForm
              productName={liveProduct.name}
              existingPrices={liveProduct.prices}
              onSave={handleSaveVendorPrice}
              onCancel={() => setIsAddingPrice(false)}
            />
          ) : (
            <>
              <DialogHeader>
                <View className="flex-col items-center gap-3">
                  {offImageUrl && (
                    <View className="h-24 w-24 overflow-hidden rounded-2xl border border-border bg-white p-2">
                      <Image
                        source={{ uri: offImageUrl }}
                        className="h-full w-full"
                        resizeMode="contain"
                        onError={() => setOffImageUrl(null)}
                      />
                    </View>
                  )}

                  <View className="w-full items-center gap-2">
                    <DialogTitle className="text-center leading-snug">
                      {liveProduct.name}
                    </DialogTitle>

                    {lowestEntry && (
                      <View className="flex-row items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-1">
                        <Text className="text-xl font-extrabold text-emerald-500">
                          ₱{lowestEntry.price.toFixed(2)}
                        </Text>
                        <Text className="text-xs text-muted-foreground">
                          at {lowestEntry.vendor?.name ?? 'Unknown Store'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </DialogHeader>

              <ScrollView
                className="my-4 max-h-full flex-shrink"
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

                    {sortedPrices.length === 0 ? (
                      <Text className="py-2 text-xs text-muted-foreground">
                        No store prices recorded yet. Tap "Add Price" to add one.
                      </Text>
                    ) : (
                      <View className="my-2 gap-1">
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
                    )}
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

                  <View className="gap-1.5">
                    <Text className="text-xs font-semibold uppercase text-muted-foreground">
                      Barcodes ({liveProduct.barcodes.length})
                    </Text>
                    <View className="flex-row flex-wrap gap-1.5">
                      {liveProduct.barcodes.map((code) => (
                        <Badge key={code} variant="secondary">
                          <Text className="font-mono text-xs" selectable>
                            {code}
                          </Text>
                        </Badge>
                      ))}
                    </View>
                  </View>
                </View>
              </ScrollView>

              <DialogFooter className="mt-4 flex-row gap-3">
                <Button variant="outline" className="flex-1" onPress={onClose}>
                  <Text>Close</Text>
                </Button>
                <Button
                  className="flex-1 flex-row items-center justify-center gap-2 bg-emerald-500 active:bg-emerald-600"
                  onPress={() => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    addToCart(liveProduct);
                    onClose();
                  }}
                >
                  <ShoppingCart size={16} color="#000" />
                  <Text className="font-bold text-black">Add to Cart</Text>
                </Button>
              </DialogFooter>
            </>
          )}
        </Animated.View>
      </DialogContent>
    </Dialog>
  );
}