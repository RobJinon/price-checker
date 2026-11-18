import { MoonStar, Package, Plus, Search, Sun, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ManualAddProductDialog } from '@/components/products/manual-add-product-dialog';
import { ProductCard } from '@/components/products/product-card';
import { ProductDetailDialog } from '@/components/products/product-detail-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useProducts } from '@/context/products-context';
import { Product } from '@/data/mock-products';

const THEME_ICONS = {
  light: Sun,
  dark: MoonStar,
};

export default function ProductsScreen() {
  const { products, vendors, getVendorById } = useProducts();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      const matchesVendor =
        selectedVendorId === 'all' ||
        product.prices.some((entry) => entry.vendorId === selectedVendorId);

      if (!matchesVendor) return false;
      if (!query) return true;

      const matchesName = product.name.toLowerCase().includes(query);
      const matchesDetails = product.details.toLowerCase().includes(query);
      const matchesBarcode = product.barcodes.some((code) =>
        code.toLowerCase().includes(query)
      );
      const matchesStore = product.prices.some((entry) => {
        const vendor = getVendorById(entry.vendorId);
        return vendor?.name.toLowerCase().includes(query) ?? false;
      });

      return matchesName || matchesDetails || matchesBarcode || matchesStore;
    });
  }, [products, searchQuery, selectedVendorId, getVendorById]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
        <View>
          <Text className="text-xl font-bold text-foreground">Products</Text>
          <Text className="text-xs text-muted-foreground">
            {products.length} {products.length === 1 ? 'item' : 'items'} tracked
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          <Button size="sm" onPress={() => setIsAddOpen(true)}>
            <Plus size={16}/>
            <Text>Add Product</Text>
          </Button>
        </View>
      </View>

      {/* Search & Store Filters */}
      <View className="gap-2.5 border-b border-border px-4 py-3">
        <View className="relative justify-center">
          <View className="absolute left-3 z-10">
            <Search size={16} color="#71717a" />
          </View>
          <Input
            className="pl-9 pr-9"
            placeholder="Search product, barcode, or store..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery('')}
              className="absolute right-3 z-10 p-1"
            >
              <X size={16} color="#71717a" />
            </Pressable>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-1.5">
            <Pressable
              onPress={() => setSelectedVendorId('all')}
              className={`rounded-full border px-3 py-1 ${
                selectedVendorId === 'all'
                  ? 'border-primary bg-primary'
                  : 'border-border bg-secondary'
              }`}
            >
              <Text
                className={`text-xs ${
                  selectedVendorId === 'all'
                    ? 'font-semibold text-primary-foreground'
                    : 'text-secondary-foreground'
                }`}
              >
                All Stores ({products.length})
              </Text>
            </Pressable>

            {vendors.map((vendor) => {
              const selected = selectedVendorId === vendor.id;
              return (
                <Pressable
                  key={vendor.id}
                  onPress={() => setSelectedVendorId(vendor.id)}
                  className={`rounded-full border px-3 py-1 ${
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
                    {vendor.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-3 p-4 pb-8"
        renderItem={({ item }) => (
          <ProductCard product={item} onPress={setSelectedProduct} />
        )}
        ListEmptyComponent={
          <View className="items-center justify-center gap-2 py-16">
            <Package size={36} color="#71717a" />
            <Text className="text-base font-semibold text-foreground">No products found</Text>
            <Text className="text-center text-xs text-muted-foreground">
              Scan a barcode or tap "Add Product" to track an item.
            </Text>
          </View>
        }
      />

      {/* Product Detail & Store Price Comparison Dialog */}
      <ProductDetailDialog
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Manual Add Product Dialog */}
      <ManualAddProductDialog open={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </SafeAreaView>
  );
}