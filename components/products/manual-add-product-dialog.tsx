import { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, Pressable, ScrollView, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

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
import { UnitSelect } from '@/components/unit-select';
import { VendorInput } from '@/components/vendor-input';
import { useProducts } from '@/context/products-context';
import { Product } from '@/data/mock-products';
import { VendorCategory } from '@/data/mock-vendors';

type ManualAddProductDialogProps = {
  open: boolean;
  onClose: () => void;
  product?: Product | null;
};

export function ManualAddProductDialog({
  open,
  onClose,
  product,
}: ManualAddProductDialogProps) {
  const { vendors, addProduct, updateProduct } = useProducts();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = Boolean(product);
  const scrollViewRef = useRef<ScrollView>(null);
  const keyboardOffset = useSharedValue(0);

  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [vendorCategory, setVendorCategory] = useState<VendorCategory>('supermarket');
  const [vendorLocation, setVendorLocation] = useState('');
  const [price, setPrice] = useState('');
  const [details, setDetails] = useState('');

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
    if (!open) return;

    if (product) {
      const existingBarcode = product.barcodes[0] ?? '';
      const firstPrice = product.prices[0];
      const existingVendor = firstPrice
        ? vendors.find((v) => v.id === firstPrice.vendorId)
        : undefined;

      setName(product.name);
      setBarcode(existingBarcode.startsWith('MANUAL-') ? '' : existingBarcode);
      setQuantity(product.quantity !== null && product.quantity !== undefined ? String(product.quantity) : '');
      setUnit(product.unit ?? '');
      setVendorName(existingVendor?.name ?? '');
      setVendorCategory(existingVendor?.category ?? 'supermarket');
      setVendorLocation(existingVendor?.location ?? '');
      setPrice(firstPrice ? String(firstPrice.price) : '');
      setDetails(product.details === 'No description provided.' ? '' : product.details);
    } else {
      setBarcode('');
      setName('');
      setQuantity('');
      setUnit('');
      setVendorName('');
      setVendorCategory('supermarket');
      setVendorLocation('');
      setPrice('');
      setDetails('');
    }
  }, [open, product, vendors]);

  const matchedVendor = vendors.find(
    (v) => v.name.toLowerCase() === vendorName.trim().toLowerCase()
  );
  const isNewVendor = Boolean(vendorName.trim()) && !matchedVendor;

  const parsedPrice = parseFloat(price);
  const parsedQuantity = parseFloat(quantity);
  const normalizedQuantity = !Number.isNaN(parsedQuantity) ? parsedQuantity : null;
  const normalizedUnit = unit || null;

  const hasPriceInput = Boolean(vendorName.trim()) || Boolean(price.trim());
  const isPriceValid =
    Boolean(vendorName.trim()) && !Number.isNaN(parsedPrice) && parsedPrice >= 0;

  const isValid =
    Boolean(name.trim()) && (isEditing ? !hasPriceInput || isPriceValid : isPriceValid);

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (isEditing && product) {
        await updateProduct(product.id, {
          name,
          barcode,
          quantity: normalizedQuantity,
          unit: normalizedUnit,
          details,
          vendorName: vendorName.trim() || undefined,
          vendorCategory: isNewVendor ? vendorCategory : undefined,
          vendorLocation: isNewVendor ? vendorLocation : undefined,
          price: !Number.isNaN(parsedPrice) ? parsedPrice : undefined,
        });
      } else {
        await addProduct({
          barcode: barcode.trim() || `MANUAL-${Date.now()}`,
          name,
          quantity: normalizedQuantity,
          unit: normalizedUnit,
          vendorName,
          vendorCategory: isNewVendor ? vendorCategory : undefined,
          vendorLocation: isNewVendor ? vendorLocation : undefined,
          price: parsedPrice,
          details,
        });
      }

      onClose();
    } catch (error) {
      console.error('Failed to save product:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="max-h-full w-[92vw] max-w-md border-0 bg-transparent p-0 shadow-none">
        <Animated.View
          style={animatedDialogStyle}
          className="gap-4 rounded-lg border border-border bg-background p-6 shadow-lg"
        >
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update product details or store pricing.'
                : 'Enter product details and its initial store price.'}
            </DialogDescription>
          </DialogHeader>

          <ScrollView
            ref={scrollViewRef}
            className="max-h-96 flex-shrink"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
          >
          <View className="gap-3.5 py-1 pr-1" onStartShouldSetResponder={() => true}>
            <View className="gap-1.5">
              <Label nativeID="manual-product-name">Product Name *</Label>
              <Input
                aria-labelledby="manual-product-name"
                placeholder="e.g. Kopiko Blanca Twin Pack"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View className="flex-row gap-2">
              <View className="flex-1 gap-1.5">
                <Label nativeID="manual-product-quantity">Quantity</Label>
                <Input
                  aria-labelledby="manual-product-quantity"
                  placeholder="e.g. 155"
                  keyboardType="decimal-pad"
                  value={quantity}
                  onChangeText={setQuantity}
                />
              </View>
              <View className="flex-1 gap-1.5">
                <Label nativeID="manual-product-unit">Unit</Label>
                <UnitSelect value={unit} onChange={setUnit} />
              </View>
            </View>

            <View className="gap-1.5">
              <Label nativeID="manual-product-barcode">Barcode (Optional)</Label>
              <Input
                aria-labelledby="manual-product-barcode"
                placeholder="Leave blank if item has no barcode"
                value={barcode}
                onChangeText={setBarcode}
              />
            </View>

            <View className="gap-1.5">
              <Label nativeID="manual-product-vendor">Shop / Supermarket *</Label>
              <VendorInput
                labelId="manual-product-vendor"
                vendors={vendors}
                vendorName={vendorName}
                onChangeVendorName={setVendorName}
                vendorCategory={vendorCategory}
                onChangeVendorCategory={setVendorCategory}
                vendorLocation={vendorLocation}
                onChangeVendorLocation={setVendorLocation}
              />
            </View>

            <View className="gap-1.5">
              <Label nativeID="manual-product-price">Price (₱) *</Label>
              <Input
                aria-labelledby="manual-product-price"
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={price}
                onChangeText={setPrice}
              />
            </View>

            <View className="gap-1.5">
              <Label nativeID="manual-product-details">Details</Label>
              <Textarea
                aria-labelledby="manual-product-details"
                placeholder="Size, variant, or short description..."
                value={details}
                onChangeText={setDetails}
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 150);
                }}
              />
            </View>
          </View>
        </ScrollView>

        <DialogFooter className="flex-row gap-3">
          <Button variant="outline" className="flex-1" onPress={onClose}>
            <Text>Cancel</Text>
          </Button>
          <Button className="flex-1" disabled={!isValid || isSubmitting} onPress={handleSubmit}>
            <Text>
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Save Product'}
            </Text>
          </Button>
        </DialogFooter>
        </Animated.View>
      </DialogContent>
    </Dialog>
  );
}