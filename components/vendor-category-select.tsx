import {
  Building2,
  Check,
  ChevronDown,
  Globe,
  Pill,
  ShoppingBag,
  ShoppingCart,
  Store,
  Tag,
} from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { VENDOR_CATEGORIES, VendorCategory } from '@/data/mock-vendors';

type VendorCategorySelectProps = {
  value: VendorCategory;
  onChange: (value: VendorCategory) => void;
  placeholder?: string;
};

function CategoryIcon({
  category,
  color = '#9ca3af',
  size = 15,
}: {
  category: string;
  color?: string;
  size?: number;
}) {
  switch (category) {
    case 'supermarket':
    case 'grocery':
      return <ShoppingCart size={size} color={color} />;
    case 'wet_market':
    case 'public_market':
      return <ShoppingBag size={size} color={color} />;
    case 'sari_sari':
    case 'convenience_store':
      return <Store size={size} color={color} />;
    case 'pharmacy':
    case 'drugstore':
      return <Pill size={size} color={color} />;
    case 'online':
    case 'ecommerce':
      return <Globe size={size} color={color} />;
    case 'department_store':
    case 'mall':
      return <Building2 size={size} color={color} />;
    default:
      return <Tag size={size} color={color} />;
  }
}

export function VendorCategorySelect({
  value,
  onChange,
  placeholder = 'Select category',
}: VendorCategorySelectProps) {
  const [open, setOpen] = useState(false);

  const selectedOption = VENDOR_CATEGORIES.find((c) => c.value === value);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="h-10 flex-row items-center justify-between rounded-md border border-input bg-background px-3"
      >
        {selectedOption ? (
          <View className="flex-1 flex-row items-center gap-2 pr-2">
            <CategoryIcon category={selectedOption.value} />
            <Text numberOfLines={1} className="flex-1 text-sm text-foreground">
              {selectedOption.label}
            </Text>
          </View>
        ) : (
          <Text numberOfLines={1} className="flex-1 pr-2 text-sm text-muted-foreground">
            {placeholder}
          </Text>
        )}
        <ChevronDown size={16} color="#9ca3af" />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/50 p-6"
          onPress={() => setOpen(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="max-h-96 w-full max-w-sm rounded-lg border border-border bg-background p-2 shadow-lg"
          >
            <View className="border-b border-border px-3 py-2.5">
              <Text className="text-sm font-semibold text-foreground">
                Select Store Category
              </Text>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" className="pt-1">
              {VENDOR_CATEGORIES.map((cat) => {
                const isSelected = value === cat.value;
                return (
                  <Pressable
                    key={cat.value}
                    onPress={() => {
                      onChange(cat.value);
                      setOpen(false);
                    }}
                    className={`flex-row items-center justify-between rounded-md px-2.5 py-2.5 ${
                      isSelected ? 'bg-secondary' : 'active:bg-secondary/60'
                    }`}
                  >
                    <View className="flex-row items-center gap-2.5">
                      <View
                        className={`h-7 w-7 items-center justify-center rounded ${
                          isSelected ? 'bg-background' : 'bg-muted/70'
                        }`}
                      >
                        <CategoryIcon
                          category={cat.value}
                          color={isSelected ? '#22c55e' : '#9ca3af'}
                        />
                      </View>
                      <Text
                        className={`text-sm ${
                          isSelected
                            ? 'font-semibold text-foreground'
                            : 'text-foreground'
                        }`}
                      >
                        {cat.label}
                      </Text>
                    </View>
                    {isSelected && <Check size={16} color="#22c55e" />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}