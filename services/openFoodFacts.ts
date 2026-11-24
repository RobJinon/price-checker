export interface NormalizedOffProduct {
  barcode: string;
  name: string;
  brand: string;
  quantity: string;
}

interface OffV3Response {
  status: 'success' | 'success_with_warnings' | 'failure';
  product?: {
    code?: string;
    product_name?: string;
    product_name_en?: string;
    generic_name?: string;
    brands?: string;
    quantity?: string;
  };
}

const BASE_URL = 'https://world.openfoodfacts.org/api/v3/product';
const USER_AGENT = 'PriceChecker/0.1.1 (robien.jinon@gmail.com)';
const FIELDS = 'code,product_name,product_name_en,generic_name,brands,quantity';

const productCache = new Map<string, NormalizedOffProduct | null>();

export async function fetchOffProductByBarcode(
  rawBarcode: string,
  signal?: AbortSignal
): Promise<NormalizedOffProduct | null> {
  const barcode = rawBarcode.trim();
  if (!barcode) return null;

  if (productCache.has(barcode)) {
    return productCache.get(barcode) ?? null;
  }

  const response = await fetch(
    `${BASE_URL}/${encodeURIComponent(barcode)}?fields=${FIELDS}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
      },
      signal,
    }
  );

  if (response.status === 404) {
    productCache.set(barcode, null);
    return null;
  }

  if (!response.ok) {
    throw new Error(`Open Food Facts lookup failed (${response.status})`);
  }

  const data: OffV3Response = await response.json();

  if (data.status === 'failure' || !data.product) {
    productCache.set(barcode, null);
    return null;
  }

  const p = data.product;
  const rawName =
    p.product_name?.trim() ||
    p.product_name_en?.trim() ||
    p.generic_name?.trim() ||
    '';
  const brand = p.brands?.split(',')[0]?.trim() || '';

  // Avoid duplicating brand if product_name already starts with it
  const fullName =
    brand && rawName && !rawName.toLowerCase().startsWith(brand.toLowerCase())
      ? `${brand} ${rawName}`
      : rawName || brand;

  const normalized: NormalizedOffProduct = {
    barcode: p.code || barcode,
    name:  p.product_name?.trim() || '',
    brand,
    quantity: p.quantity?.trim() || '',
  };

  productCache.set(barcode, normalized);
  return normalized;
}