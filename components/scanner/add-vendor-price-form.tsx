import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/button';
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { useProducts } from '@/context/products-context';
import { VendorPrice } from '@/data/mock-products';

type AddVendorPriceFormProps = {
  productName: string;
  existingPrices: VendorPrice[];
  onSave: (data: { vendor: string; price: number }) => void;
  onCancel: () => void;
};

export function AddVendorPriceForm({
  productName,
  existingPrices,
  onSave,
  onCancel,
}: AddVendorPriceFormProps) {
  const { vendors } = useProducts();
  const [vendor, setVendor] = useState('');
  const [price, setPrice] = useState('');

  const trimmedVendor = vendor.trim();
  const matchingExisting = existingPrices.find(
    (entry) => entry.vendor.toLowerCase() === trimmedVendor.toLowerCase()
  );

  const handleSelectVendor = (selectedVendor: string) => {
    setVendor(selectedVendor);
    const existing = existingPrices.find(
      (entry) => entry.vendor.toLowerCase() === selectedVendor.toLowerCase()
    );
    if (existing) {
      setPrice(existing.price.toString());
    }
  };

  const parsedPrice = parseFloat(price);
  const isValid = Boolean(trimmedVendor) && !Number.isNaN(parsedPrice) && parsedPrice >= 0;

  const handleSubmit = () => {
    if (!isValid) return;
    onSave({ vendor: trimmedVendor, price: parsedPrice });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{matchingExisting ? 'Update Store Price' : 'Add Store Price'}</DialogTitle>
        <DialogDescription numberOfLines={2}>{productName}</DialogDescription>
      </DialogHeader>

      <ScrollView className="max-h-80" keyboardShouldPersistTaps="handled">
        <View className="gap-3 py-1">
          <View className="gap-1.5">
            <Label nativeID="vendor-name">Shop / Supermarket *</Label>
            <Input
              aria-labelledby="vendor-name"
              placeholder="e.g. SM Supermarket, Iloilo Supermart, Shopee"
              value={vendor}
              onChangeText={setVendor}
            />
            {vendors.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View className="flex-row gap-1.5 pt-1">
                  {vendors.map((existingVendor) => {
                    const isSelected =
                      trimmedVendor.toLowerCase() === existingVendor.toLowerCase();
                    return (
                      <Pressable
                        key={existingVendor}
                        onPress={() => handleSelectVendor(existingVendor)}
                        className={`rounded-full border px-2.5 py-1 ${
                          isSelected
                            ? 'border-primary bg-primary'
                            : 'border-border bg-secondary'
                        }`}
                      >
                        <Text
                          className={`text-xs ${
                            isSelected
                              ? 'font-semibold text-primary-foreground'
                              : 'text-secondary-foreground'
                          }`}
                        >
                          {existingVendor}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            )}
            {matchingExisting && (
              <Text className="text-xs text-amber-500">
                Current price at {matchingExisting.vendor}: ₱{matchingExisting.price.toFixed(2)}{' '}
                (will overwrite)
              </Text>
            )}
          </View>

          <View className="gap-1.5">
            <Label nativeID="vendor-price">Price (₱) *</Label>
            <Input
              aria-labelledby="vendor-price"
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={price}
              onChangeText={setPrice}
            />
          </View>
        </View>
      </ScrollView>

      <DialogFooter className="flex-row gap-3">
        <Button variant="outline" className="flex-1" onPress={onCancel}>
          <Text>Back</Text>
        </Button>
        <Button className="flex-1" disabled={!isValid} onPress={handleSubmit}>
          <Text>{matchingExisting ? 'Update Price' : 'Save Price'}</Text>
        </Button>
      </DialogFooter>
    </>
  );
}