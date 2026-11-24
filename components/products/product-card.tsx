import * as Haptics from 'expo-haptics';
import { Barcode, Pencil, ShoppingCart, Store, Trash2 } from 'lucide-react-native';
import { useRef } from 'react';
import { Alert, Pressable, View } from 'react-native';
import ReanimatedSwipeable, {
  SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';

import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { useCart } from '@/context/cart-context';
import { useProducts } from '@/context/products-context';
import { Product } from '@/data/mock-products';

type ProductCardProps = {
  product: Product;
  onPress: (product: Product) => void;
  onEdit?: (product: Product) => void;
};

export function ProductCard({ product, onPress, onEdit }: ProductCardProps) {
  const { getVendorById, deleteProduct } = useProducts();
  const { addToCart } = useCart();
  const swipeableRef = useRef<SwipeableMethods>(null);

  const handleAddToCart = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addToCart(product);
  };

  const handleEdit = () => {
    swipeableRef.current?.close();
    onEdit?.(product);
  };

  const handleDelete = () => {
    swipeableRef.current?.close();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Delete Product',
      `Remove "${product.name}" from your saved products?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(product.id);
            } catch (error) {
              console.error('Failed to delete product:', error);
              Alert.alert('Error', 'Could not delete product. Please try again.');
            }
          },
        },
      ]
    );
  };

  const sortedPrices = [...product.prices].sort((a, b) => a.price - b.price);
  const lowestEntry = sortedPrices[0];
  const lowestVendor = lowestEntry ? getVendorById(lowestEntry.vendorId) : undefined;
  const storeCount = sortedPrices.length;

  const renderRightActions = () => (
    <View className="flex-row items-stretch pl-2">
      <Pressable
        onPress={handleEdit}
        accessibilityLabel="Edit product"
        className="w-16 items-center justify-center gap-1 rounded-l-xl bg-secondary active:opacity-80"
      >
        <Pencil size={16} color="#e4e4e7" />
        <Text className="text-[11px] font-semibold text-secondary-foreground">Edit</Text>
      </Pressable>

      <Pressable
        onPress={handleDelete}
        accessibilityLabel="Delete product"
        className="w-16 items-center justify-center gap-1 rounded-r-xl bg-destructive active:opacity-80"
      >
        <Trash2 size={16} color="#ffffff" />
        <Text className="text-[11px] font-semibold text-white">Delete</Text>
      </Pressable>
    </View>
  );

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={renderRightActions}
    >
      <Pressable
        onPress={() => onPress(product)}
        className="gap-2.5 rounded-xl border border-border bg-card p-4 active:opacity-90"
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

        <View className="flex-row items-center justify-between gap-2 border-t border-border pt-2.5">
          <View className="flex-1 flex-col gap-1">
            <View className="flex-row items-center gap-1.5">
              <Store size={13} color="#10b981" />
              <Text className="text-xs font-medium text-muted-foreground">
                {storeCount === 0
                  ? 'No stores listed'
                  : `Compared across ${storeCount} ${storeCount === 1 ? 'store' : 'stores'}`}
              </Text>
            </View>
            {product.barcodes[0] && (
              <View className="flex-row items-center gap-1 self-start rounded-md bg-secondary px-2 py-0.5">
                <Barcode size={12} color="#71717a" />
                <Text className="font-mono text-[11px] text-secondary-foreground">
                  {product.barcodes[0]}
                  {product.barcodes.length > 1 ? ` +${product.barcodes.length - 1}` : ''}
                </Text>
              </View>
            )}
          </View>

          {lowestEntry && (
            <Pressable
              onPress={handleAddToCart}
              className="shrink-0 flex-row items-center gap-1.5 rounded-md bg-emerald-500 px-3 py-2 active:bg-emerald-600"
            >
              <ShoppingCart size={13} color="#ffffff" />
              <Text className="text-xs font-bold text-white" numberOfLines={1}>
                Add to cart
              </Text>
            </Pressable>
          )}
        </View>
      </Pressable>
    </ReanimatedSwipeable>
  );
}