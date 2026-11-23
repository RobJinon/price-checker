import { Plus, Search, Store, X } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { VendorCard } from '@/components/stores/vendor-card';
import { VendorFormDialog } from '@/components/stores/vendor-form-dialog';
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
import { Text } from '@/components/ui/text';
import { useProducts } from '@/context/products-context';
import { Vendor, VENDOR_CATEGORIES, VendorCategory } from '@/data/mock-vendors';

export default function StoresScreen() {
  const { vendors, products, deleteVendor } = useProducts();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<VendorCategory | 'all'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // If useProducts() exposes an async reload method, await it here (e.g., await refreshProducts())
      await new Promise((resolve) => setTimeout(resolve, 400));
    } finally {
      setIsRefreshing(false);
    }
  }, []);
  
  const productCountByVendor = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((product) => {
      product.prices.forEach((entry) => {
        counts[entry.vendorId] = (counts[entry.vendorId] ?? 0) + 1;
      });
    });
    return counts;
  }, [products]);

  const filteredVendors = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return vendors
      .filter((vendor) => {
        const matchesCategory =
          selectedCategory === 'all' || vendor.category === selectedCategory;
        if (!matchesCategory) return false;
        if (!query) return true;

        return (
          vendor.name.toLowerCase().includes(query) ||
          vendor.location.toLowerCase().includes(query) ||
          vendor.description.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [vendors, searchQuery, selectedCategory]);

  const handleOpenAdd = () => {
    setEditingVendor(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setIsFormOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!vendorToDelete) return;
    deleteVendor(vendorToDelete.id);
    setVendorToDelete(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
        <View>
          <Text className="text-xl font-bold text-foreground">Stores & Vendors</Text>
          <Text className="text-xs text-muted-foreground">
            {vendors.length} {vendors.length === 1 ? 'store' : 'stores'} tracked
          </Text>
        </View>
        <Button size="sm" onPress={handleOpenAdd}>
          <Plus size={16} />
          <Text>Add Store</Text>
        </Button>
      </View>

      {/* Search & Category Filters */}
      <View className="gap-2.5 border-b border-border px-4 py-3">
        <View className="relative justify-center">
          <View className="absolute left-3 z-10">
            <Search size={16} color="#71717a" />
          </View>
          <Input
            className="pl-9 pr-9"
            placeholder="Search store name, location, or description..."
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
              onPress={() => setSelectedCategory('all')}
              className={`rounded-full border px-3 py-1 ${
                selectedCategory === 'all'
                  ? 'border-primary bg-primary'
                  : 'border-border bg-secondary'
              }`}
            >
              <Text
                className={`text-xs ${
                  selectedCategory === 'all'
                    ? 'font-semibold text-primary-foreground'
                    : 'text-secondary-foreground'
                }`}
              >
                All ({vendors.length})
              </Text>
            </Pressable>

            {VENDOR_CATEGORIES.map((cat) => {
              const selected = selectedCategory === cat.value;
              return (
                <Pressable
                  key={cat.value}
                  onPress={() => setSelectedCategory(cat.value)}
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
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Stores List */}
      <FlatList
        data={filteredVendors}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-3 p-4 pb-8"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        renderItem={({ item }) => (
          <VendorCard
            vendor={item}
            productCount={productCountByVendor[item.id] ?? 0}
            onEdit={handleOpenEdit}
            onDelete={setVendorToDelete}
          />
        )}
        ListEmptyComponent={
          <View className="items-center justify-center gap-2 py-16">
            <Store size={36} color="#71717a" />
            <Text className="text-base font-semibold text-foreground">No stores found</Text>
            <Text className="text-center text-xs text-muted-foreground">
              Try clearing your search filter or add a new store.
            </Text>
          </View>
        }
      />

      {/* Add / Edit Store Dialog */}
      <VendorFormDialog
        open={isFormOpen}
        editingVendor={editingVendor}
        onClose={() => setIsFormOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      {vendorToDelete && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setVendorToDelete(null);
          }}
        >
          <DialogContent className="w-[90vw] max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-destructive">Delete Store</DialogTitle>
              <DialogDescription>
                Remove "{vendorToDelete.name}"? Any product prices recorded under this store
                ({productCountByVendor[vendorToDelete.id] ?? 0}{' '}
                {(productCountByVendor[vendorToDelete.id] ?? 0) === 1 ? 'item' : 'items'}) will
                also be removed.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onPress={() => setVendorToDelete(null)}
              >
                <Text>Cancel</Text>
              </Button>
              <Button variant="destructive" className="flex-1" onPress={handleConfirmDelete}>
                <Text>Delete</Text>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </SafeAreaView>
  );
}