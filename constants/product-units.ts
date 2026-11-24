export type ProductUnitCategory = 'Weight' | 'Volume' | 'Count & Packaging';

export type ProductUnitOption = {
  value: string;
  label: string;
  category: ProductUnitCategory;
};

export const PRODUCT_UNIT_CATEGORIES: ProductUnitCategory[] = [
  'Weight',
  'Volume',
  'Count & Packaging',
];

export const PRODUCT_UNITS: ProductUnitOption[] = [
  // Weight
  { value: 'g', label: 'grams', category: 'Weight' },
  { value: 'kg', label: 'kilograms', category: 'Weight' },
  { value: 'mg', label: 'milligrams', category: 'Weight' },
  { value: 'oz', label: 'ounces', category: 'Weight' },
  { value: 'lb', label: 'pounds', category: 'Weight' },

  // Volume
  { value: 'mL', label: 'milliliters', category: 'Volume' },
  { value: 'L', label: 'liters', category: 'Volume' },
  { value: 'fl oz', label: 'fluid ounces', category: 'Volume' },

  // Count & Packaging
  { value: 'pc', label: 'piece', category: 'Count & Packaging' },
  { value: 'pcs', label: 'pieces', category: 'Count & Packaging' },
  { value: 'pack', label: 'pack', category: 'Count & Packaging' },
  { value: 'sachet', label: 'sachet', category: 'Count & Packaging' },
  { value: 'can', label: 'can', category: 'Count & Packaging' },
  { value: 'bottle', label: 'bottle', category: 'Count & Packaging' },
  { value: 'box', label: 'box', category: 'Count & Packaging' },
  { value: 'bag', label: 'bag', category: 'Count & Packaging' },
  { value: 'pouch', label: 'pouch', category: 'Count & Packaging' },
  { value: 'jar', label: 'jar', category: 'Count & Packaging' },
  { value: 'roll', label: 'roll', category: 'Count & Packaging' },
  { value: 'tray', label: 'tray', category: 'Count & Packaging' },
  { value: 'dozen', label: 'dozen', category: 'Count & Packaging' },
  { value: 'pair', label: 'pair', category: 'Count & Packaging' },
];

export const PRODUCT_UNIT_SECTIONS = PRODUCT_UNIT_CATEGORIES.map((category) => ({
  title: category,
  data: PRODUCT_UNITS.filter((unit) => unit.category === category),
}));

const UNIT_ALIASES: Record<string, string> = {
  g: 'g',
  gr: 'g',
  gram: 'g',
  grams: 'g',
  kg: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  mg: 'mg',
  oz: 'oz',
  lb: 'lb',
  lbs: 'lb',
  ml: 'mL',
  milliliter: 'mL',
  milliliters: 'mL',
  l: 'L',
  lt: 'L',
  liter: 'L',
  liters: 'L',
  'fl oz': 'fl oz',
  pc: 'pc',
  pcs: 'pcs',
  piece: 'pc',
  pieces: 'pcs',
  pack: 'pack',
  packs: 'pack',
  sachet: 'sachet',
  sachets: 'sachet',
  can: 'can',
  cans: 'can',
  bottle: 'bottle',
  bottles: 'bottle',
  box: 'box',
  boxes: 'box',
  bag: 'bag',
  bags: 'bag',
  pouch: 'pouch',
  jar: 'jar',
  roll: 'roll',
  tray: 'tray',
  dozen: 'dozen',
  pair: 'pair',
};

export function parseOpenFoodFactsQuantity(raw?: string | null): {
  quantity: string;
  unit: string;
} {
  if (!raw) return { quantity: '', unit: '' };

  const cleaned = raw.trim();
  // Matches patterns like "155g", "1.5 L", or "6 x 330 ml" (captures last number + unit)
  const match = cleaned.match(/(\d+(?:[.,]\d+)?)\s*(fl\s*oz|[a-zA-Z]+)\b/i);
  if (!match) return { quantity: '', unit: '' };

  const numericPart = match[1].replace(',', '.');
  const rawUnit = match[2].toLowerCase().replace(/\s+/g, ' ');
  const normalizedUnit = UNIT_ALIASES[rawUnit] ?? '';

  return {
    quantity: numericPart,
    unit: normalizedUnit,
  };
}