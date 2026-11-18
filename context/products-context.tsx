import { createContext, useContext, useState } from 'react';

import { MOCK_PRODUCTS, Product } from '@/data/mock-products';

export type NewProductInput = {
  barcode: string;
  name: string;
  price: number;
  details: string;
};

type ProductsContextValue = {
  products: Product[];
  findProductByBarcode: (rawBarcode: string) => Product | null;
  addProduct: (input: NewProductInput) => Product;
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

  const addProduct = (input: NewProductInput): Product => {
    const normalizedBarcode = input.barcode.trim().toUpperCase();
    const newProduct: Product = {
      id: `prod_${Date.now()}`,
      barcodes: [normalizedBarcode],
      name: input.name.trim(),
      details: input.details.trim() || 'No description provided.',
      price: input.price,
    };

    setProducts((prev) => [newProduct, ...prev]);
    return newProduct;
  };

  return (
    <ProductsContext.Provider value={{ products, findProductByBarcode, addProduct }}>
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