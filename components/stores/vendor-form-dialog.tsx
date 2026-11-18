import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

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
import { NewVendorInput, useProducts } from '@/context/products-context';
import { Vendor, VENDOR_CATEGORIES, VendorCategory } from '@/data/mock-vendors';

type VendorFormDialogProps = {
  open: boolean;
  editingVendor: Vendor | null;
  onClose: () => void;
};

export function VendorFormDialog({
  open,
  editingVendor,
  onClose,
}: VendorFormDialogProps) {
  const { vendors, addVendor, updateVendor } = useProducts();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<VendorCategory>('supermarket');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (editingVendor) {
      setName(editingVendor.name);
      setCategory(editingVendor.category);
      setLocation(editingVendor.location);
      setDescription(editingVendor.description);
    } else {
      setName('');
      setCategory('supermarket');
      setLocation('');
      setDescription('');
    }
  }, [editingVendor, open]);

  const trimmedName = name.trim();
  const isDuplicateName = vendors.some(
    (v) =>
      v.name.toLowerCase() === trimmedName.toLowerCase() &&
      v.id !== editingVendor?.id
  );
  const isValid = Boolean(trimmedName) && !isDuplicateName;

  const handleSubmit = () => {
    if (!isValid) return;

    const payload: NewVendorInput = {
      name: trimmedName,
      category,
      location,
      description,
    };

    if (editingVendor) {
      updateVendor(editingVendor.id, payload);
    } else {
      addVendor(payload);
    }

    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="max-h-[85vh] w-[92vw] max-w-md">
        <DialogHeader>
          <DialogTitle>{editingVendor ? 'Edit Store' : 'Add New Store'}</DialogTitle>
          <DialogDescription>
            {editingVendor
              ? 'Update store details, category, or location.'
              : 'Add a supermarket, wet market, sari-sari store, or online shop.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollView
          className="max-h-96 flex-shrink"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
        >
          <View className="gap-3.5 py-1 pr-1" onStartShouldSetResponder={() => true}>
            <View className="gap-1.5">
              <Label nativeID="store-name">Store / Shop Name *</Label>
              <Input
                aria-labelledby="store-name"
                placeholder="e.g. Jaro Public Market, Iloilo Supermart"
                value={name}
                onChangeText={setName}
              />
              {isDuplicateName && (
                <Text className="text-xs text-destructive">
                  A store with this name already exists.
                </Text>
              )}
            </View>

            <View className="gap-1.5">
              <Label nativeID="store-category">Category *</Label>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View className="flex-row gap-1.5 py-0.5">
                  {VENDOR_CATEGORIES.map((cat) => {
                    const selected = category === cat.value;
                    return (
                      <Pressable
                        key={cat.value}
                        onPress={() => setCategory(cat.value)}
                        className={`rounded-full border px-3 py-1.5 ${
                          selected
                            ? 'border-primary bg-primary'
                            : 'border-border bg-secondary'
                        }`}
                      >
                        <Text
                          className={`text-xs ${
                            selected
                              ? 'font-semibold text-primary-foreground'
                              : 'text-secondary-foreground'
                          }`}
                        >
                          {cat.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            <View className="gap-1.5">
              <Label nativeID="store-location">Location / Branch</Label>
              <Input
                aria-labelledby="store-location"
                placeholder="e.g. SM City Iloilo, Mandurriao or Online"
                value={location}
                onChangeText={setLocation}
              />
            </View>

            <View className="gap-1.5">
              <Label nativeID="store-description">Description</Label>
              <Textarea
                aria-labelledby="store-description"
                placeholder="Notes about this store, operating hours, or specialties..."
                value={description}
                onChangeText={setDescription}
              />
            </View>
          </View>
        </ScrollView>

        <DialogFooter className="flex-row gap-3">
          <Button variant="outline" className="flex-1" onPress={onClose}>
            <Text>Cancel</Text>
          </Button>
          <Button className="flex-1" disabled={!isValid} onPress={handleSubmit}>
            <Text>{editingVendor ? 'Save Changes' : 'Add Store'}</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}