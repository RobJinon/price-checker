import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { useProducts } from '@/context/products-context';
import { Product } from '@/data/mock-products';

export type MeasureMode = 'qty' | 'weight';
export type WeightUnit = 'kg' | 'g' | 'L' | 'mL';

export type CartItem = {
  id: string;
  productId: string;
  mode: MeasureMode;
  quantity: number; // Integer count for 'qty', decimal amount (e.g. 1.35) for 'weight'
  unit: WeightUnit;
  overrideUnitPrice?: number; // Used if product has no recorded price for the selected store
};

type CartContextValue = {
  selectedVendorId: string | null;
  setSelectedVendorId: (vendorId: string | null) => void;
  items: CartItem[];
  addToCart: (
    product: Product,
    options?: { mode?: MeasureMode; quantity?: number; unit?: WeightUnit }
  ) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  updateItemMeasure: (itemId: string, mode: MeasureMode, unit?: WeightUnit) => void;
  setOverrideUnitPrice: (itemId: string, price: number | undefined) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  getItemUnitPrice: (item: CartItem) => {
    unitPrice: number;
    isStoreMatch: boolean;
    isOverridden: boolean;
  };
  totalAmount: number;
  totalItemsCount: number;
};

const STORAGE_KEY = '@price_checker_cart_v1';

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { products, vendors } = useProducts();
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load saved cart & active vendor on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.items)) setItems(parsed.items);
          if (typeof parsed.selectedVendorId === 'string') {
            setSelectedVendorId(parsed.selectedVendorId);
          }
        }
      } catch (err) {
        console.warn('Failed to load cart from storage:', err);
      } finally {
        setIsHydrated(true);
      }
    })();
  }, []);

  // Default to first available vendor once vendors load if none is selected
  useEffect(() => {
    if (isHydrated && !selectedVendorId && vendors.length > 0) {
      setSelectedVendorId(vendors[0].id);
    }
  }, [isHydrated, selectedVendorId, vendors]);

  // Persist cart changes
  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ selectedVendorId, items })
    ).catch(() => {});
  }, [items, selectedVendorId, isHydrated]);

  const addToCart = (
    product: Product,
    options?: { mode?: MeasureMode; quantity?: number; unit?: WeightUnit }
  ) => {
    const mode = options?.mode ?? 'qty';
    const unit = options?.unit ?? 'kg';
    const defaultQty = mode === 'qty' ? 1 : 0.5;
    const addQty = options?.quantity ?? defaultQty;

    setItems((prev) => {
      // Merge with existing line item if it's the same product in 'qty' mode
      const existingIndex = prev.findIndex(
        (item) => item.productId === product.id && item.mode === mode
      );

      if (existingIndex >= 0 && mode === 'qty') {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + addQty,
        };
        return updated;
      }

      const newItem: CartItem = {
        id: `cart_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        productId: product.id,
        mode,
        quantity: addQty,
        unit,
      };
      return [newItem, ...prev];
    });
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    const cleanQty = Math.round(quantity * 1000) / 1000;
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, quantity: cleanQty } : item
      )
    );
  };

  const updateItemMeasure = (
    itemId: string,
    mode: MeasureMode,
    unit?: WeightUnit
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const nextUnit = unit ?? item.unit;
        const nextQty =
          item.mode === mode
            ? item.quantity
            : mode === 'qty'
              ? Math.max(1, Math.round(item.quantity))
              : item.quantity >= 1
                ? item.quantity
                : 0.5;

        return {
          ...item,
          mode,
          unit: nextUnit,
          quantity: nextQty,
        };
      })
    );
  };

  const setOverrideUnitPrice = (itemId: string, price: number | undefined) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, overrideUnitPrice: price } : item
      )
    );
  };

  const removeFromCart = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const getItemUnitPrice = (item: CartItem) => {
    if (typeof item.overrideUnitPrice === 'number' && !Number.isNaN(item.overrideUnitPrice)) {
      return {
        unitPrice: item.overrideUnitPrice,
        isStoreMatch: false,
        isOverridden: true,
      };
    }

    const product = products.find((p) => p.id === item.productId);
    if (!product || product.prices.length === 0) {
      return { unitPrice: 0, isStoreMatch: false, isOverridden: false };
    }

    if (selectedVendorId) {
      const storePrice = product.prices.find(
        (p) => p.vendorId === selectedVendorId
      );
      if (storePrice) {
        return {
          unitPrice: storePrice.price,
          isStoreMatch: true,
          isOverridden: false,
        };
      }
    }

    return {
      unitPrice: 0,
      isStoreMatch: false,
      isOverridden: false,
    };
  };

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => {
      const { unitPrice } = getItemUnitPrice(item);
      return sum + unitPrice * item.quantity;
    }, 0);
  }, [items, products, selectedVendorId]);

  const totalItemsCount = useMemo(() => {
    return items.reduce(
      (count, item) => count + (item.mode === 'qty' ? item.quantity : 1),
      0
    );
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        selectedVendorId,
        setSelectedVendorId,
        items,
        addToCart,
        updateItemQuantity,
        updateItemMeasure,
        setOverrideUnitPrice,
        removeFromCart,
        clearCart,
        getItemUnitPrice,
        totalAmount,
        totalItemsCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}