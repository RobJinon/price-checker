import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { Product } from '@/data/mock-products';
import { Vendor, VendorCategory } from '@/data/mock-vendors';
import { supabase } from '@/utils/supabase';

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
  isLoading: boolean;
  refreshData: () => Promise<void>;
  getVendorById: (vendorId: string) => Vendor | undefined;
  findOrCreateVendor: (input: NewVendorInput) => Promise<Vendor>;
  addVendor: (input: NewVendorInput) => Promise<Vendor>;
  updateVendor: (vendorId: string, input: NewVendorInput) => Promise<void>;
  deleteVendor: (vendorId: string) => Promise<void>;
  findProductByBarcode: (rawBarcode: string) => Product | null;
  addProduct: (input: NewProductInput) => Promise<Product>;
  upsertVendorPrice: (
    productId: string,
    vendorInput: NewVendorInput,
    price: number
  ) => Promise<void>;
};

const ProductsContext = createContext<ProductsContextValue | null>(null);

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [vendorsRes, productsRes, pricesRes] = await Promise.all([
        supabase.from('vendors').select('*').order('name', { ascending: true }),
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('product_prices').select('*'),
      ]);

      if (vendorsRes.error) throw vendorsRes.error;
      if (productsRes.error) throw productsRes.error;
      if (pricesRes.error) throw pricesRes.error;

      const mappedVendors: Vendor[] = (vendorsRes.data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        category: row.category as VendorCategory,
        description: row.description ?? '',
        location: row.location ?? '',
      }));

      const pricesByProduct = new Map<
        string,
        { vendorId: string; price: number; updatedAt: string }[]
      >();

      for (const row of pricesRes.data ?? []) {
        const list = pricesByProduct.get(row.product_id) ?? [];
        list.push({
          vendorId: row.vendor_id,
          price: Number(row.price),
          updatedAt: row.updated_at,
        });
        pricesByProduct.set(row.product_id, list);
      }

      const mappedProducts: Product[] = (productsRes.data ?? []).map((row) => ({
        id: row.id,
        barcodes: Array.isArray(row.barcodes) ? row.barcodes : [],
        name: row.name,
        details: row.details ?? '',
        prices: pricesByProduct.get(row.id) ?? [],
      }));

      setVendors(mappedVendors);
      setProducts(mappedProducts);
    } catch (error) {
      console.error('Failed to load data from Supabase:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const getVendorById = (vendorId: string): Vendor | undefined =>
    vendors.find((v) => v.id === vendorId);

  const findOrCreateVendor = async (input: NewVendorInput): Promise<Vendor> => {
    const cleanName = input.name.trim();
    const existing = vendors.find(
      (v) => v.name.toLowerCase() === cleanName.toLowerCase()
    );
    if (existing) return existing;

    const newVendor: Vendor = {
      id: `ven_${Date.now()}`,
      name: cleanName,
      category: input.category ?? 'general_store',
      description: input.description?.trim() ?? '',
      location: input.location?.trim() ?? '',
    };

    const { data, error } = await supabase
      .from('vendors')
      .insert(newVendor)
      .select()
      .single();

    if (error) {
      // Handle race condition if vendor name already exists in DB (UNIQUE constraint)
      const { data: fallback } = await supabase
        .from('vendors')
        .select('*')
        .ilike('name', cleanName)
        .maybeSingle();

      if (fallback) {
        const mapped: Vendor = {
          id: fallback.id,
          name: fallback.name,
          category: fallback.category as VendorCategory,
          description: fallback.description ?? '',
          location: fallback.location ?? '',
        };
        setVendors((prev) =>
          prev.some((v) => v.id === mapped.id) ? prev : [...prev, mapped]
        );
        return mapped;
      }
      throw error;
    }

    const created: Vendor = {
      id: data.id,
      name: data.name,
      category: data.category as VendorCategory,
      description: data.description ?? '',
      location: data.location ?? '',
    };

    setVendors((prev) => [...prev, created]);
    return created;
  };

  const addVendor = async (input: NewVendorInput): Promise<Vendor> => {
    return findOrCreateVendor(input);
  };

  const updateVendor = async (vendorId: string, input: NewVendorInput) => {
    const existing = getVendorById(vendorId);
    const updates = {
      name: input.name.trim(),
      category: input.category ?? existing?.category ?? 'general_store',
      description: input.description?.trim() ?? '',
      location: input.location?.trim() ?? '',
    };

    const { error } = await supabase
      .from('vendors')
      .update(updates)
      .eq('id', vendorId);

    if (error) throw error;

    setVendors((prev) =>
      prev.map((vendor) =>
        vendor.id === vendorId ? { ...vendor, ...updates } : vendor
      )
    );
  };

  const deleteVendor = async (vendorId: string) => {
    const { error: pricesError } = await supabase
      .from('product_prices')
      .delete()
      .eq('vendor_id', vendorId);
    if (pricesError) throw pricesError;

    const { error: vendorError } = await supabase
      .from('vendors')
      .delete()
      .eq('id', vendorId);
    if (vendorError) throw vendorError;

    setVendors((prev) => prev.filter((vendor) => vendor.id !== vendorId));
    setProducts((prev) =>
      prev.map((product) => ({
        ...product,
        prices: product.prices.filter((entry) => entry.vendorId !== vendorId),
      }))
    );
  };

  const findProductByBarcode = (rawBarcode: string): Product | null => {
    const normalized = rawBarcode.trim().toUpperCase();
    return (
      products.find((product) =>
        product.barcodes.some((code) => code.toUpperCase() === normalized)
      ) ?? null
    );
  };

  const addProduct = async (input: NewProductInput): Promise<Product> => {
    const normalizedBarcode = input.barcode.trim().toUpperCase();
    const today = new Date().toISOString().split('T')[0];
    const vendor = await findOrCreateVendor({
      name: input.vendorName,
      category: input.vendorCategory,
      location: input.vendorLocation,
    });

    const productId = `prod_${Date.now()}`;
    const cleanName = input.name.trim();
    const cleanDetails = input.details.trim() || 'No description provided.';

    const { error: productError } = await supabase.from('products').insert({
      id: productId,
      barcodes: [normalizedBarcode],
      name: cleanName,
      details: cleanDetails,
    });
    if (productError) throw productError;

    const { error: priceError } = await supabase.from('product_prices').insert({
      product_id: productId,
      vendor_id: vendor.id,
      price: input.price,
      updated_at: today,
    });
    if (priceError) throw priceError;

    const newProduct: Product = {
      id: productId,
      barcodes: [normalizedBarcode],
      name: cleanName,
      details: cleanDetails,
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

  const upsertVendorPrice = async (
    productId: string,
    vendorInput: NewVendorInput,
    price: number
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const vendor = await findOrCreateVendor(vendorInput);

    const { data: existingRow, error: lookupError } = await supabase
      .from('product_prices')
      .select('id')
      .eq('product_id', productId)
      .eq('vendor_id', vendor.id)
      .maybeSingle();

    if (lookupError) throw lookupError;

    if (existingRow) {
      const { error } = await supabase
        .from('product_prices')
        .update({ price, updated_at: today })
        .eq('id', existingRow.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('product_prices').insert({
        product_id: productId,
        vendor_id: vendor.id,
        price,
        updated_at: today,
      });
      if (error) throw error;
    }

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
        isLoading,
        refreshData,
        getVendorById,
        findOrCreateVendor,
        addVendor,
        updateVendor,
        deleteVendor,
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