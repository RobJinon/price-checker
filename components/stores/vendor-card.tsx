import { MapPin, Package, Pencil, Trash2 } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { Vendor, VENDOR_CATEGORIES } from '@/data/mock-vendors';

type VendorCardProps = {
  vendor: Vendor;
  productCount: number;
  onEdit: (vendor: Vendor) => void;
  onDelete: (vendor: Vendor) => void;
};

export function VendorCard({
  vendor,
  productCount,
  onEdit,
  onDelete,
}: VendorCardProps) {
  const categoryLabel =
    VENDOR_CATEGORIES.find((c) => c.value === vendor.category)?.label ?? vendor.category;

  return (
    <View className="gap-2.5 rounded-xl border border-border bg-card p-4">
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1 gap-1.5">
          <Text className="text-base font-bold text-card-foreground">{vendor.name}</Text>
          <View className="flex-row flex-wrap items-center gap-2">
            <Badge variant="secondary">
              <Text>{categoryLabel}</Text>
            </Badge>
            <View className="flex-row items-center gap-1">
              <Package size={12} color="#71717a" />
              <Text className="text-xs text-muted-foreground">
                {productCount} {productCount === 1 ? 'item' : 'items'}
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row items-center gap-1.5">
          <Pressable
            onPress={() => onEdit(vendor)}
            className="h-9 w-9 items-center justify-center rounded-lg bg-secondary active:opacity-75"
          >
            <Pencil size={15} color="#a1a1aa" />
          </Pressable>
          <Pressable
            onPress={() => onDelete(vendor)}
            className="h-9 w-9 items-center justify-center rounded-lg bg-destructive/15 active:opacity-75"
          >
            <Trash2 size={15} color="#ef4444" />
          </Pressable>
        </View>
      </View>

      {Boolean(vendor.location) && (
        <View className="flex-row items-center gap-1.5">
          <MapPin size={13} color="#10b981" />
          <Text className="flex-1 text-xs font-medium text-muted-foreground">
            {vendor.location}
          </Text>
        </View>
      )}

      {Boolean(vendor.description) && (
        <Text className="text-xs leading-relaxed text-muted-foreground">
          {vendor.description}
        </Text>
      )}
    </View>
  );
}