import { createContext, useContext, useState } from 'react';

import { MOCK_PRODUCTS, Product } from '@/data/mock-products';
import { MOCK_VENDORS, Vendor, VendorCategory } from '@/data/mock-vendors';

export type NewVendorInput = {
  name: string;
  category?: VendorCategory;
  description?: string;
  location?: string;
};

export type NewProductInput = {
  barcode: string;
  name: string;
  vendorName: string;
  vendorCategory?: VendorCategory;
  vendorLocation?: string;
  price: number;
  details: string;
};

type ProductsContextValue = {
  products: Product[];
  vendors: Vendor[];
  getVendorById: (vendorId: string) => Vendor | undefined;
  findOrCreateVendor: (input: NewVendorInput) => Vendor;
  findProductByBarcode: (rawBarcode: string) => Product | null;
  addProduct: (input: NewProductInput) => Product;
  upsertVendorPrice: (
    productId: string,
    vendorInput: NewVendorInput,
    price: number
  ) => void;
};

const ProductsContext = createContext<ProductsContextValue | null>(null);

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [vendors, setVendors] = useState<Vendor[]>(MOCK_VENDORS);

  const getVendorById = (vendorId: string): Vendor | undefined =>
    vendors.find((v) => v.id === vendorId);

  const findOrCreateVendor = (input: NewVendorInput): Vendor => {
    const cleanName = input.name.trim();
    const existing = vendors.find(
      (v) => v.name.toLowerCase() === cleanName.toLowerCase()
    );
    if (existing) return existing;

    const created: Vendor = {
      id: `ven_${Date.now()}`,
      name: cleanName,
      category: input.category ?? 'general_store',
      description: input.description?.trim() ?? '',
      location: input.location?.trim() ?? '',
    };

    setVendors((prev) => [...prev, created]);
    return created;
  };

  const findProductByBarcode = (rawBarcode: string): Product | null => {
    const normalized = rawBarcode.trim().toUpperCase();
    return (
      products.find((product) =>
        product.barcodes.some((code) => code.toUpperCase() === normalized)
      ) ?? null
    );
  };

  const addProduct = (input: NewProductInput): Product => {
    const normalizedBarcode = input.barcode.trim().toUpperCase();
    const today = new Date().toISOString().split('T')[0];
    const vendor = findOrCreateVendor({
      name: input.vendorName,
      category: input.vendorCategory,
      location: input.vendorLocation,
    });

    const newProduct: Product = {
      id: `prod_${Date.now()}`,
      barcodes: [normalizedBarcode],
      name: input.name.trim(),
      details: input.details.trim() || 'No description provided.',
      prices: [
        {
          vendorId: vendor.id,
          price: input.price,
          updatedAt: today,
        },
      ],
    };

    setProducts((prev) => [newProduct, ...prev]);
    return newProduct;
  };

  const upsertVendorPrice = (
    productId: string,
    vendorInput: NewVendorInput,
    price: number
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const vendor = findOrCreateVendor(vendorInput);

    setProducts((prev) =>
      prev.map((product) => {
        if (product.id !== productId) return product;

        const existingIndex = product.prices.findIndex(
          (entry) => entry.vendorId === vendor.id
        );

        const updatedPrices = [...product.prices];
        if (existingIndex >= 0) {
          updatedPrices[existingIndex] = {
            vendorId: vendor.id,
            price,
            updatedAt: today,
          };
        } else {
          updatedPrices.push({ vendorId: vendor.id, price, updatedAt: today });
        }

        return { ...product, prices: updatedPrices };
      })
    );
  };

  return (
    <ProductsContext.Provider
      value={{
        products,
        vendors,
        getVendorById,
        findOrCreateVendor,
        findProductByBarcode,
        addProduct,
        upsertVendorPrice,
      }}
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