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
import { Vendor, VENDOR_CATEGORIES, VendorCategory } from '@/data/mock-vendors';

type AddVendorPriceFormProps = {
  productName: string;
  existingPrices: VendorPrice[];
  onSave: (data: {
    vendorName: string;
    vendorCategory?: VendorCategory;
    vendorLocation?: string;
    price: number;
  }) => void;
  onCancel: () => void;
};

export function AddVendorPriceForm({
  productName,
  existingPrices,
  onSave,
  onCancel,
}: AddVendorPriceFormProps) {
  const { vendors } = useProducts();
  const [vendorName, setVendorName] = useState('');
  const [vendorCategory, setVendorCategory] = useState<VendorCategory>('supermarket');
  const [vendorLocation, setVendorLocation] = useState('');
  const [price, setPrice] = useState('');

  const trimmedVendor = vendorName.trim();
  const matchedVendor = vendors.find(
    (v) => v.name.toLowerCase() === trimmedVendor.toLowerCase()
  );
  const isNewVendor = Boolean(trimmedVendor) && !matchedVendor;
  const matchingExisting = matchedVendor
    ? existingPrices.find((entry) => entry.vendorId === matchedVendor.id)
    : undefined;

  const handleSelectVendor = (selected: Vendor) => {
    setVendorName(selected.name);
    const existing = existingPrices.find((entry) => entry.vendorId === selected.id);
    if (existing) {
      setPrice(existing.price.toString());
    }
  };

  const parsedPrice = parseFloat(price);
  const isValid = Boolean(trimmedVendor) && !Number.isNaN(parsedPrice) && parsedPrice >= 0;

  const handleSubmit = () => {
    if (!isValid) return;
    onSave({
      vendorName: trimmedVendor,
      vendorCategory: isNewVendor ? vendorCategory : undefined,
      vendorLocation: isNewVendor ? vendorLocation : undefined,
      price: parsedPrice,
    });
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
              value={vendorName}
              onChangeText={setVendorName}
            />
            {vendors.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View className="flex-row gap-1.5 pt-1">
                  {vendors.map((existingVendor) => {
                    const isSelected = matchedVendor?.id === existingVendor.id;
                    return (
                      <Pressable
                        key={existingVendor.id}
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
                          {existingVendor.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            )}
            {matchingExisting && matchedVendor && (
              <Text className="text-xs text-amber-500">
                Current price at {matchedVendor.name}: ₱{matchingExisting.price.toFixed(2)}{' '}
                (will overwrite)
              </Text>
            )}
          </View>

          {isNewVendor && (
            <View className="gap-2 rounded-lg border border-border bg-secondary/40 p-2.5">
              <Text className="text-xs font-semibold text-muted-foreground">
                New Shop Details (Optional)
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View className="flex-row gap-1.5">
                  {VENDOR_CATEGORIES.map((cat) => {
                    const selected = vendorCategory === cat.value;
                    return (
                      <Pressable
                        key={cat.value}
                        onPress={() => setVendorCategory(cat.value)}
                        className={`rounded-full border px-2.5 py-1 ${
                          selected
                            ? 'border-primary bg-primary'
                            : 'border-border bg-background'
                        }`}
                      >
                        <Text
                          className={`text-xs ${
                            selected ? 'font-semibold text-primary-foreground' : 'text-foreground'
                          }`}
                        >
                          {cat.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
              <Input
                placeholder="Location (e.g. Jaro Public Market, Iloilo City)"
                value={vendorLocation}
                onChangeText={setVendorLocation}
              />
            </View>
          )}

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