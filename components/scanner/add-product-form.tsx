import { useState, useEffect } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/button';
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { useProducts } from '@/context/products-context';
import { VENDOR_CATEGORIES, VendorCategory } from '@/data/mock-vendors';
import { useProductLookup } from '@/hooks/use-product-lookup';

type AddProductFormProps = {
  barcode: string;
  barcodeType: string;
  onSave: (data: {
    name: string;
    vendorName: string;
    vendorCategory?: VendorCategory;
    vendorLocation?: string;
    price: number;
    details: string;
  }) => void;
  onCancel: () => void;
};

export function AddProductForm({
  barcode,
  barcodeType,
  onSave,
  onCancel,
}: AddProductFormProps) {
  const { vendors } = useProducts();
  const [name, setName] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [vendorCategory, setVendorCategory] = useState<VendorCategory>('supermarket');
  const [vendorLocation, setVendorLocation] = useState('');
  const [price, setPrice] = useState('');
  const [details, setDetails] = useState('');

  const { lookupStatus, lookupBarcode } = useProductLookup();

  const loadingOpacity = useSharedValue(1);

  useEffect(() => {
    if (lookupStatus === 'loading') {
      loadingOpacity.value = withRepeat(withTiming(0.35, { duration: 600 }), -1, true);
    } else {
      loadingOpacity.value = 1;
    }
  }, [lookupStatus, loadingOpacity]);

  const loadingAnimatedStyle = useAnimatedStyle(() => ({
    opacity: loadingOpacity.value,
  }));

  useEffect(() => {
    let isMounted = true;

    lookupBarcode(barcode).then((offProduct) => {
      if (!isMounted || !offProduct) return;

      console.log('[OFF Product Found]:', JSON.stringify(offProduct, null, 2));

      if (offProduct.name) {
        const formattedName = offProduct.name
          .toLowerCase()
          .replace(/(?:^|\s)\S/g, (char) => char.toUpperCase());
        setName((prev) => (prev.trim() ? prev : formattedName));
      }
      if (offProduct.quantity) {
        setDetails((prev) => (prev.trim() ? prev : offProduct.quantity));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [barcode, lookupBarcode]);

  const matchedVendor = vendors.find(
    (v) => v.name.toLowerCase() === vendorName.trim().toLowerCase()
  );
  const isNewVendor = Boolean(vendorName.trim()) && !matchedVendor;

  const parsedPrice = parseFloat(price);
  const isValid =
    Boolean(name.trim()) &&
    Boolean(vendorName.trim()) &&
    !Number.isNaN(parsedPrice) &&
    parsedPrice >= 0;

  const handleSubmit = () => {
    if (!isValid) return;
    onSave({
      name,
      vendorName,
      vendorCategory: isNewVendor ? vendorCategory : undefined,
      vendorLocation: isNewVendor ? vendorLocation : undefined,
      price: parsedPrice,
      details,
    });
  };

  return (
    <>
      <DialogHeader className='gap-0'>
        <DialogTitle>Add New Product</DialogTitle>
        <DialogDescription className='mt-1'>
          Barcode: {barcode} ({barcodeType.toUpperCase()})
        </DialogDescription>
          {lookupStatus === 'loading' && (
            <Animated.View style={loadingAnimatedStyle}>
              <Text className="text-xs text-neutral-400">Looking up product info...</Text>
            </Animated.View>
          )}
          {lookupStatus === 'found' && (
            <Text className="text-xs text-green-400">Pre-filled from Open Food Facts Database</Text>
          )}
          {lookupStatus === 'not-found' && (
            <Text className="text-xs text-amber-400">Not in Open Food Facts</Text>
          )}
          {lookupStatus === 'error' && (
            <Text className="text-xs text-red-400">Lookup unavailable</Text>
          )}
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
            <Label nativeID="product-vendor">Shop / Supermarket *</Label>
            <Input
              aria-labelledby="product-vendor"
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
                        onPress={() => setVendorName(existingVendor.name)}
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
        <Button variant="outline" className="flex-1" onPress={onCancel}>
          <Text>Back</Text>
        </Button>
        <Button className="flex-1" disabled={!isValid} onPress={handleSubmit}>
          <Text>Save Product</Text>
        </Button>
      </DialogFooter>
    </>
  );
}