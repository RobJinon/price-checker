import { createContext, useContext, useMemo, useState } from 'react';

import { MOCK_PRODUCTS, Product } from '@/data/mock-products';

export type NewProductInput = {
  barcode: string;
  name: string;
  vendor: string;
  price: number;
  details: string;
};

type ProductsContextValue = {
  products: Product[];
  vendors: string[];
  findProductByBarcode: (rawBarcode: string) => Product | null;
  addProduct: (input: NewProductInput) => Product;
  upsertVendorPrice: (productId: string, vendor: string, price: number) => void;
};

const ProductsContext = createContext<ProductsContextValue | null>(null);

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);

  const findProductByBarcode = (rawBarcode: string): Product | null => {
    const normalized = rawBarcode.trim().toUpperCase();
    return (
      products.find((product) =>
        product.barcodes.some((code) => code.toUpperCase() === normalized)
      ) ?? null
    );
  };

  const vendors = useMemo(() => {
    const unique = new Set<string>();
    products.forEach((p) => p.prices.forEach((entry) => unique.add(entry.vendor)));
    return Array.from(unique).sort();
  }, [products]);

  const addProduct = (input: NewProductInput): Product => {
    const normalizedBarcode = input.barcode.trim().toUpperCase();
    const today = new Date().toISOString().split('T')[0];

    const newProduct: Product = {
      id: `prod_${Date.now()}`,
      barcodes: [normalizedBarcode],
      name: input.name.trim(),
      details: input.details.trim() || 'No description provided.',
      prices: [
        {
          vendor: input.vendor.trim(),
          price: input.price,
          updatedAt: today,
        },
      ],
    };

    setProducts((prev) => [newProduct, ...prev]);
    return newProduct;
  };

  const upsertVendorPrice = (productId: string, rawVendor: string, price: number) => {
    const cleanVendor = rawVendor.trim();
    const today = new Date().toISOString().split('T')[0];

    setProducts((prev) =>
      prev.map((product) => {
        if (product.id !== productId) return product;

        const existingIndex = product.prices.findIndex(
          (entry) => entry.vendor.toLowerCase() === cleanVendor.toLowerCase()
        );

        const updatedPrices = [...product.prices];
        if (existingIndex >= 0) {
          updatedPrices[existingIndex] = {
            vendor: updatedPrices[existingIndex].vendor,
            price,
            updatedAt: today,
          };
        } else {
          updatedPrices.push({ vendor: cleanVendor, price, updatedAt: today });
        }

        return { ...product, prices: updatedPrices };
      })
    );
  };

  return (
    <ProductsContext.Provider
      value={{ products, vendors, findProductByBarcode, addProduct, upsertVendorPrice }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
}