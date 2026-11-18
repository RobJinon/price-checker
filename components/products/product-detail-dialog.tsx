import { Plus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

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
import { Text } from '@/components/ui/text';
import { useProducts } from '@/context/products-context';
import { Product } from '@/data/mock-products';
import { VendorCategory } from '@/data/mock-vendors';

type ProductDetailDialogProps = {
  product: Product | null;
  onClose: () => void;
};

export function ProductDetailDialog({ product, onClose }: ProductDetailDialogProps) {
  const { products, getVendorById, upsertVendorPrice } = useProducts();
  const [isAddingPrice, setIsAddingPrice] = useState(false);

  useEffect(() => {
    setIsAddingPrice(false);
  }, [product?.id]);

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
      <DialogContent className="max-h-[85vh] w-[92vw] max-w-md">
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
              <DialogTitle className="pr-6 text-lg">{liveProduct.name}</DialogTitle>
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
              className="max-h-80 flex-shrink"
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

                  {sortedPrices.length === 0 ? (
                    <Text className="py-2 text-xs text-muted-foreground">
                      No store prices recorded yet. Tap "Add Price" to add one.
                    </Text>
                  ) : (
                    sortedPrices.map((entry, index) => (
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
                    ))
                  )}
                </View>

                <View className="gap-1 border-b border-border pb-3">
                  <Text className="text-xs font-semibold uppercase text-muted-foreground">
                    Product Details
                  </Text>
                  <Text className="text-sm leading-relaxed text-foreground">
                    {liveProduct.details}
                  </Text>
                </View>

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

            <DialogFooter>
              <Button variant="outline" className="w-full" onPress={onClose}>
                <Text>Close</Text>
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}