import * as Haptics from 'expo-haptics';
import {
  Minus,
  Plus,
  Scale,
  ShoppingBag,
  ShoppingCart,
  Store,
  Trash2,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { CartItem, useCart, WeightUnit } from '@/context/cart-context';
import { useProducts } from '@/context/products-context';

const WEIGHT_UNITS: WeightUnit[] = ['kg', 'g', 'L', 'mL'];

export default function CartScreen() {
  const { products, vendors, getVendorById } = useProducts();
  const {
    selectedVendorId,
    setSelectedVendorId,
    items,
    updateItemQuantity,
    updateItemMeasure,
    setOverrideUnitPrice,
    removeFromCart,
    clearCart,
    getItemUnitPrice,
    totalAmount,
    totalItemsCount,
  } = useCart();

  const [storePickerOpen, setStorePickerOpen] = useState(false);
  const [editingPriceItem, setEditingPriceItem] = useState<CartItem | null>(null);
  const [priceDraft, setPriceDraft] = useState('');

  const activeVendor = selectedVendorId
    ? getVendorById(selectedVendorId)
    : undefined;

  const handleConfirmClear = () => {
    Alert.alert(
      'Clear Cart',
      'Remove all items from your shopping cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            clearCart();
          },
        },
      ]
    );
  };

  const openPriceOverride = (item: CartItem) => {
    const { unitPrice } = getItemUnitPrice(item);
    setEditingPriceItem(item);
    setPriceDraft(unitPrice > 0 ? String(unitPrice) : '');
  };

  const savePriceOverride = () => {
    if (!editingPriceItem) return;
    const parsed = parseFloat(priceDraft);
    if (priceDraft.trim() === '' || Number.isNaN(parsed)) {
      setOverrideUnitPrice(editingPriceItem.id, undefined);
    } else if (parsed >= 0) {
      setOverrideUnitPrice(editingPriceItem.id, parsed);
    }
    setEditingPriceItem(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
        <View>
          <Text className="text-xl font-bold text-foreground">Shopping Cart</Text>
          <Text className="text-xs text-muted-foreground">
            {items.length} {items.length === 1 ? 'item' : 'items'} • Active trip
          </Text>
        </View>

        {items.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onPress={handleConfirmClear}
            className="flex-row items-center gap-1.5 rounded-full px-3"
          >
            <Trash2 size={14} color="#ef4444" />
            <Text className="text-xs font-medium text-destructive">Clear</Text>
          </Button>
        )}
      </View>

      {/* Active Store / Vendor Selector Banner */}
      <View className="border-b border-border bg-secondary/30 px-4 py-3">
        <Text className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Shopping At
        </Text>
        <Pressable
          onPress={() => setStorePickerOpen(true)}
          className="flex-row items-center justify-between rounded-xl border border-border bg-background px-3.5 py-2.5 active:opacity-80"
        >
          <View className="flex-1 flex-row items-center gap-2.5 pr-2">
            <View className="h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15">
              <Store size={16} color="#10b981" />
            </View>
            <View className="flex-1">
              <Text
                numberOfLines={1}
                className="text-sm font-semibold text-foreground"
              >
                {activeVendor ? activeVendor.name : 'Select a store / vendor'}
              </Text>
              <Text
                numberOfLines={1}
                className="text-xs text-muted-foreground"
              >
                {activeVendor?.location
                  ? activeVendor.location
                  : 'Prices update automatically based on selected store'}
              </Text>
            </View>
          </View>

          <Badge variant="secondary" className="rounded-full px-2.5 py-1">
            <Text className="text-xs font-medium text-foreground">Change</Text>
          </Badge>
        </Pressable>
      </View>

      {/* Cart Items List */}
      {items.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <ShoppingCart size={26} color="#71717a" />
          </View>
          <Text className="text-center text-base font-semibold text-foreground">
            Your cart is empty
          </Text>
          <Text className="text-center text-xs leading-5 text-muted-foreground">
            Scan a product barcode on the Scanner tab and tap Add to Cart to start
            tallying your groceries.
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-3 p-4 pb-6"
          showsVerticalScrollIndicator={false}
        >
          {items.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            const { unitPrice, isStoreMatch, isOverridden } =
              getItemUnitPrice(item);
            const subtotal = unitPrice * item.quantity;
            const step = item.mode === 'qty' ? 1 : item.unit === 'g' || item.unit === 'mL' ? 100 : 0.25;

            return (
              <View
                key={item.id}
                className="gap-3 rounded-2xl border border-border bg-card p-3.5"
              >
                {/* Top Row: Product Name + Remove */}
                <View className="flex-row items-start justify-between gap-2">
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">
                      {product?.name ?? 'Unknown Product'}
                    </Text>

                    <Pressable
                      onPress={() => openPriceOverride(item)}
                      className="mt-1 flex-row flex-wrap items-center gap-1.5"
                    >
                      {!isStoreMatch && !isOverridden && activeVendor ? (
                        <>
                          <Text className="text-xs font-medium text-amber-500">
                            No price at this store
                          </Text>
                          <Badge variant="secondary" className="px-1.5 py-0">
                            <Text className="text-[10px] text-muted-foreground">
                              Tap to set
                            </Text>
                          </Badge>
                        </>
                      ) : (
                        <>
                          <Text className="text-xs font-medium text-emerald-500">
                            ₱{unitPrice.toFixed(2)}
                            {item.mode === 'weight' ? ` / ${item.unit}` : ' each'}
                          </Text>

                          {isOverridden && (
                            <Badge variant="outline" className="px-1.5 py-0">
                              <Text className="text-[10px] text-amber-400">
                                Custom price
                              </Text>
                            </Badge>
                          )}
                        </>
                      )}
                    </Pressable>
                  </View>

                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={() => removeFromCart(item.id)}
                    className="h-8 w-8 rounded-full p-0"
                  >
                    <Trash2 size={15} color="#71717a" />
                  </Button>
                </View>

                {/* Mode Switcher: Quantity (pcs) vs Weight / Volume (meat, etc.) */}
                <View className="flex-row items-center justify-between gap-2">
                  <View className="flex-row rounded-lg bg-secondary p-0.5">
                    <Pressable
                      onPress={() => updateItemMeasure(item.id, 'qty')}
                      className={`flex-row items-center gap-1 rounded-md px-2.5 py-1 ${
                        item.mode === 'qty' ? 'bg-background shadow-xs' : ''
                      }`}
                    >
                      <ShoppingBag
                        size={12}
                        color={item.mode === 'qty' ? '#10b981' : '#71717a'}
                      />
                      <Text
                        className={`text-xs font-medium ${
                          item.mode === 'qty'
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        }`}
                      >
                        Qty
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => updateItemMeasure(item.id, 'weight')}
                      className={`flex-row items-center gap-1 rounded-md px-2.5 py-1 ${
                        item.mode === 'weight' ? 'bg-background shadow-xs' : ''
                      }`}
                    >
                      <Scale
                        size={12}
                        color={item.mode === 'weight' ? '#10b981' : '#71717a'}
                      />
                      <Text
                        className={`text-xs font-medium ${
                          item.mode === 'weight'
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        }`}
                      >
                        Weight / Vol
                      </Text>
                    </Pressable>
                  </View>

                  {/* Unit Selector when Weight / Volume is active */}
                  {item.mode === 'weight' && (
                    <View className="flex-row items-center gap-1">
                      {WEIGHT_UNITS.map((unitOption) => (
                        <Pressable
                          key={unitOption}
                          onPress={() =>
                            updateItemMeasure(item.id, 'weight', unitOption)
                          }
                          className={`rounded-md border px-2 py-0.5 ${
                            item.unit === unitOption
                              ? 'border-emerald-500 bg-emerald-500/15'
                              : 'border-border bg-background'
                          }`}
                        >
                          <Text
                            className={`text-xs font-semibold ${
                              item.unit === unitOption
                                ? 'text-emerald-400'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {unitOption}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                {/* Bottom Row: Stepper + Direct Numeric Input + Line Subtotal */}
                <View className="flex-row items-center justify-between border-t border-border/60 pt-2.5">
                  <View className="flex-row items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onPress={() => {
                        Haptics.selectionAsync();
                        updateItemQuantity(item.id, item.quantity - step);
                      }}
                      className="h-8 w-8 rounded-full p-0"
                    >
                      <Minus size={14} color="#a1a1aa" />
                    </Button>

                    <View className="flex-row items-center gap-1">
                      <Input
                        keyboardType="decimal-pad"
                        value={String(item.quantity)}
                        onChangeText={(text) => {
                          const cleaned = text.replace(/[^0-9.]/g, '');
                          if (cleaned === '') return;
                          const val = parseFloat(cleaned);
                          if (!Number.isNaN(val)) {
                            updateItemQuantity(item.id, val);
                          }
                        }}
                        className="h-8 w-16 px-2 text-center font-mono text-xs font-bold"
                      />
                      <Text className="text-xs font-medium text-muted-foreground">
                        {item.mode === 'qty' ? 'pcs' : item.unit}
                      </Text>
                    </View>

                    <Button
                      size="sm"
                      variant="outline"
                      onPress={() => {
                        Haptics.selectionAsync();
                        updateItemQuantity(item.id, item.quantity + step);
                      }}
                      className="h-8 w-8 rounded-full p-0"
                    >
                      <Plus size={14} color="#a1a1aa" />
                    </Button>
                  </View>

                  <View className="items-end">
                    <Text className="text-[10px] text-muted-foreground">
                      Subtotal
                    </Text>
                    <Text className="font-mono text-base font-bold text-foreground">
                      ₱{subtotal.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Sticky Total Footer */}
      {items.length > 0 && (
        <View className="border-t border-border bg-card px-4 py-3.5">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs text-muted-foreground">
                Estimated Total ({totalItemsCount}{' '}
                {totalItemsCount === 1 ? 'unit' : 'units'})
              </Text>
              <Text className="font-mono text-2xl font-bold text-emerald-500">
                ₱{totalAmount.toFixed(2)}
              </Text>
            </View>

            <Badge variant="secondary" className="rounded-full px-3 py-1.5">
              <Text className="text-xs font-semibold text-foreground">
                {activeVendor ? activeVendor.name : 'No Store Selected'}
              </Text>
            </Badge>
          </View>
        </View>
      )}

      {/* Store / Vendor Selection Modal */}
      <Modal
        visible={storePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setStorePickerOpen(false)}
      >
        <Pressable
          onPress={() => setStorePickerOpen(false)}
          className="flex-1 justify-end bg-black/60"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="max-h-[70%] rounded-t-3xl border-t border-border bg-background p-5"
          >
            <Text className="text-lg font-bold text-foreground">
              Select Store / Vendor
            </Text>
            <Text className="mb-3 text-xs text-muted-foreground">
              Cart prices will match the store you are currently shopping at.
            </Text>

            <ScrollView className="gap-2">
              {vendors.map((vendor) => {
                const isSelected = vendor.id === selectedVendorId;
                return (
                  <Pressable
                    key={vendor.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedVendorId(vendor.id);
                      setStorePickerOpen(false);
                    }}
                    className={`mb-2 flex-row items-center justify-between rounded-xl border px-4 py-3 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-border bg-card'
                    }`}
                  >
                    <View className="flex-1 pr-2">
                      <Text className="text-sm font-semibold text-foreground">
                        {vendor.name}
                      </Text>
                      {Boolean(vendor.location) && (
                        <Text className="text-xs text-muted-foreground">
                          {vendor.location}
                        </Text>
                      )}
                    </View>
                    {isSelected && (
                      <Badge className="bg-emerald-500">
                        <Text className="text-xs font-bold text-black">
                          Active
                        </Text>
                      </Badge>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Custom Unit Price Override Modal */}
      <Modal
        visible={Boolean(editingPriceItem)}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingPriceItem(null)}
      >
        <Pressable
          onPress={() => setEditingPriceItem(null)}
          className="flex-1 items-center justify-center bg-black/60 px-6"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="w-full gap-3 rounded-2xl border border-border bg-background p-5"
          >
            <Text className="text-base font-bold text-foreground">
              Set Unit Price
            </Text>
            <Text className="text-xs text-muted-foreground">
              Enter the shelf price (per piece or per{' '}
              {editingPriceItem?.unit ?? 'kg'}). Leave blank to reset.
            </Text>
            <Input
              keyboardType="decimal-pad"
              placeholder="0.00"
              value={priceDraft}
              onChangeText={setPriceDraft}
              autoFocus
            />
            <View className="flex-row justify-end gap-2 pt-1">
              <Button
                size="sm"
                variant="ghost"
                onPress={() => setEditingPriceItem(null)}
              >
                <Text>Cancel</Text>
              </Button>
              <Button size="sm" onPress={savePriceOverride}>
                <Text>Save Price</Text>
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}