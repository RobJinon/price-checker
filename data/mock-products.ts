export type VendorPrice = {
  vendorId: string;
  price: number;
  updatedAt: string;
};

export type Product = {
  id: string;
  barcodes: string[];
  name: string;
  quantity?: number | null;
  unit?: string | null;
  details: string;
  prices: VendorPrice[];
};

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod_kz_edx_pro',
    barcodes: ['6970493061762'],
    name: 'KZ EDX PRO In-ear monitors',
    quantity: 1,
    unit: 'pair',
    details:
      '10mm dual-magnetic circuit dynamic driver IEM with detachable 0.75mm 2-pin OFC flat cable and noise-isolating ergonomic resin shell.',
    prices: [
      { vendorId: 'ven_shopee', price: 349.0, updatedAt: '2026-11-10' },
      { vendorId: 'ven_lazada', price: 375.0, updatedAt: '2026-11-08' },
    ],
  },
  {
    id: 'prod_defensil_70_60ml',
    barcodes: ['4806520413889'],
    name: 'Defensil Isopropyl Alcohol 70% 60ml',
    quantity: 60,
    unit: 'mL',
    details:
      '70% solution antiseptic and disinfectant in a 60ml flip-top pocket bottle with moisturizer to help prevent skin dryness.',
    prices: [
      { vendorId: 'ven_iloilo_supermart', price: 38.5, updatedAt: '2026-11-12' },
      { vendorId: 'ven_watsons', price: 42.0, updatedAt: '2026-11-05' },
      { vendorId: 'ven_mercury_drug', price: 41.25, updatedAt: '2026-11-01' },
    ],
  },
  {
    id: 'prod_equal_gold_150g',
    barcodes: ['9321778671997'],
    name: 'Equal Gold Sucralose 150g',
    quantity: 150,
    unit: 'g',
    details:
      'Zero-calorie crunchy granular sugar substitute made with sucralose in a 150g resealable pouch, measures spoon-for-spoon like sugar.',
    prices: [
      { vendorId: 'ven_sm_supermarket', price: 165.0, updatedAt: '2026-11-14' },
      { vendorId: 'ven_robinsons_supermarket', price: 172.5, updatedAt: '2026-11-09' },
    ],
  },
  {
    id: 'prod_sama_g750',
    barcodes: ['X004OY67U1', '850070935036', 'XMGB07525092300468'],
    name: 'Sama G750 PSU',
    quantity: 1,
    unit: 'pc',
    details:
      '750W 80 Plus Gold certified fully modular ATX 3.0 / PCIe 5.0 power supply with 120mm fluid dynamic bearing fan and flat black modular cables.',
    prices: [
      { vendorId: 'ven_shopee', price: 4295.0, updatedAt: '2026-11-15' },
      { vendorId: 'ven_dynaquest', price: 4450.0, updatedAt: '2026-11-11' },
    ],
  },
  {
    id: 'prod_msi_a750gl',
    barcodes: ['3067ZP8B12CE010523001777', '4711377084284', '824909310080'],
    name: 'MSI MAG A750GL PCIE5 PSU',
    quantity: 1,
    unit: 'pc',
    details:
      '750W 80 Plus Gold fully modular ATX 3.0 power supply with native 16-pin (12VHPWR) PCIe 5.0 connector, compact 140mm chassis, and DC-to-DC circuit design.',
    prices: [
      { vendorId: 'ven_datablitz', price: 5450.0, updatedAt: '2026-11-16' },
      { vendorId: 'ven_pc_express', price: 5690.0, updatedAt: '2026-11-10' },
    ],
  },
  {
    id: 'prod_vention_dp_1_5m',
    barcodes: ['42268339958_301507338775'],
    name: 'Vention DisplayPort Cable 1.5m',
    quantity: 1,
    unit: 'pc',
    details:
      '1.5m DisplayPort 1.4 braided cable supporting 8K@60Hz and 4K@144Hz high refresh rates, 32.4Gbps bandwidth, and gold-plated locking connectors.',
    prices: [{ vendorId: 'ven_shopee', price: 395.0, updatedAt: '2026-11-12' }],
  },
  {
    id: 'prod_dell_wh3024',
    barcodes: ['884116451761', '5397184791554', 'WH3024DWW'],
    name: 'Dell WH3024 Headset',
    quantity: 1,
    unit: 'pc',
    details:
      'Dell Pro Wired ANC Headset with Active Noise Cancellation, AI-based noise-canceling boom microphone, memory foam leatherette ear cushions, and USB-C/USB-A inline call controls.',
    prices: [
      { vendorId: 'ven_dell_official', price: 3850.0, updatedAt: '2026-11-04' },
      { vendorId: 'ven_silicon_valley', price: 4190.0, updatedAt: '2026-11-02' },
    ],
  },
];

// Mirrors Firestore: query(collection(db, 'products'), where('barcodes', 'array-contains', code))
export function findProductByBarcode(rawBarcode: string): Product | null {
  const normalized = rawBarcode.trim().toUpperCase();
  return (
    MOCK_PRODUCTS.find((product) =>
      product.barcodes.some((code) => code.toUpperCase() === normalized)
    ) ?? null
  );
}