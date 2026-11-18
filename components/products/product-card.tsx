import { Barcode, Store } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { useProducts } from '@/context/products-context';
import { Product } from '@/data/mock-products';

type ProductCardProps = {
  product: Product;
  onPress: (product: Product) => void;
};

export function ProductCard({ product, onPress }: ProductCardProps) {
  const { getVendorById } = useProducts();

  const sortedPrices = [...product.prices].sort((a, b) => a.price - b.price);
  const lowestEntry = sortedPrices[0];
  const lowestVendor = lowestEntry ? getVendorById(lowestEntry.vendorId) : undefined;
  const storeCount = sortedPrices.length;

  return (
    <Pressable
      onPress={() => onPress(product)}
      className="gap-2.5 rounded-xl border border-border bg-card p-4 active:opacity-80"
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-base font-bold text-card-foreground" numberOfLines={2}>
            {product.name}
          </Text>
          {Boolean(product.details) && (
            <Text className="text-xs leading-relaxed text-muted-foreground" numberOfLines={2}>
              {product.details}
            </Text>
          )}
        </View>

        {lowestEntry ? (
          <View className="items-end">
            <Text className="text-lg font-extrabold text-emerald-500">
              ₱{lowestEntry.price.toFixed(2)}
            </Text>
            <Text className="text-[11px] text-muted-foreground" numberOfLines={1}>
              {lowestVendor?.name ?? 'Unknown Store'}
            </Text>
          </View>
        ) : (
          <Badge variant="outline">
            <Text>No prices</Text>
          </Badge>
        )}
      </View>

      <View className="flex-row flex-wrap items-center justify-between gap-2 border-t border-border pt-2.5">
        <View className="flex-row items-center gap-1.5">
          <Store size={13} color="#10b981" />
          <Text className="text-xs font-medium text-muted-foreground">
            {storeCount === 0
              ? 'No stores listed'
              : `Compared across ${storeCount} ${storeCount === 1 ? 'store' : 'stores'}`}
          </Text>
        </View>

        {product.barcodes[0] && (
          <View className="flex-row items-center gap-1 rounded-md bg-secondary px-2 py-0.5">
            <Barcode size={12} color="#71717a" />
            <Text className="font-mono text-[11px] text-secondary-foreground">
              {product.barcodes[0]}
              {product.barcodes.length > 1 ? ` +${product.barcodes.length - 1}` : ''}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}