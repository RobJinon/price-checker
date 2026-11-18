import { useState } from 'react';
import { ScrollView, View } from 'react-native';

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
import { Textarea } from '@/components/ui/textarea';

type AddProductFormProps = {
  barcode: string;
  barcodeType: string;
  onSave: (data: { name: string; price: number; details: string }) => void;
  onCancel: () => void;
};

export function AddProductForm({
  barcode,
  barcodeType,
  onSave,
  onCancel,
}: AddProductFormProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [details, setDetails] = useState('');

  const parsedPrice = parseFloat(price);
  const isValid = Boolean(name.trim()) && !Number.isNaN(parsedPrice) && parsedPrice >= 0;

  const handleSubmit = () => {
    if (!isValid) return;
    onSave({ name, price: parsedPrice, details });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add New Product</DialogTitle>
        <DialogDescription>
          Barcode: {barcode} ({barcodeType.toUpperCase()})
        </DialogDescription>
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