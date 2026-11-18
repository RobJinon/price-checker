export type VendorCategory =
  | 'supermarket'
  | 'grocery'
  | 'wet_market'
  | 'sari_sari_store'
  | 'convenience_store'
  | 'kiosk'
  | 'general_store'
  | 'department_store'
  | 'pharmacy'
  | 'electronics_store'
  | 'hardware_store'
  | 'wholesale_club'
  | 'specialty_store'
  | 'online_marketplace';

export const VENDOR_CATEGORIES: { value: VendorCategory; label: string }[] = [
  { value: 'supermarket', label: 'Supermarket' },
  { value: 'grocery', label: 'Grocery Store' },
  { value: 'wet_market', label: 'Wet Market / Palengke' },
  { value: 'sari_sari_store', label: 'Sari-Sari Store' },
  { value: 'convenience_store', label: 'Convenience Store' },
  { value: 'kiosk', label: 'Kiosk / Stall' },
  { value: 'general_store', label: 'General Store' },
  { value: 'department_store', label: 'Department Store' },
  { value: 'pharmacy', label: 'Pharmacy / Drugstore' },
  { value: 'electronics_store', label: 'Electronics & PC Store' },
  { value: 'hardware_store', label: 'Hardware Store' },
  { value: 'wholesale_club', label: 'Wholesale / Warehouse Club' },
  { value: 'specialty_store', label: 'Specialty Store' },
  { value: 'online_marketplace', label: 'Online Marketplace' },
];

export type Vendor = {
  id: string;
  name: string;
  category: VendorCategory;
  description: string;
  location: string;
};

export const MOCK_VENDORS: Vendor[] = [
  {
    id: 'ven_iloilo_supermart',
    name: 'Iloilo Supermart',
    category: 'supermarket',
    description: 'Local supermarket chain carrying groceries, household goods, and fresh produce.',
    location: 'Iloilo City',
  },
  {
    id: 'ven_sm_supermarket',
    name: 'SM Supermarket',
    category: 'supermarket',
    description: 'Full-service mall supermarket.',
    location: 'SM City Iloilo, Mandurriao',
  },
  {
    id: 'ven_robinsons_supermarket',
    name: 'Robinsons Supermarket',
    category: 'supermarket',
    description: 'Mall supermarket specializing in fresh produce and everyday essentials.',
    location: 'Robinsons Place Iloilo',
  },
  {
    id: 'ven_watsons',
    name: 'Watsons',
    category: 'pharmacy',
    description: 'Health, beauty, personal care, and pharmacy retailer.',
    location: 'Iloilo City',
  },
  {
    id: 'ven_mercury_drug',
    name: 'Mercury Drug',
    category: 'pharmacy',
    description: 'Retail pharmacy with medical supplies and select convenience items.',
    location: 'Iloilo City',
  },
  {
    id: 'ven_shopee',
    name: 'Shopee',
    category: 'online_marketplace',
    description: 'Online e-commerce marketplace.',
    location: 'Online',
  },
  {
    id: 'ven_lazada',
    name: 'Lazada',
    category: 'online_marketplace',
    description: 'Online e-commerce marketplace.',
    location: 'Online',
  },
  {
    id: 'ven_dynaquest',
    name: 'DynaQuest PC',
    category: 'electronics_store',
    description: 'PC hardware components and peripherals retailer.',
    location: 'Online / Manila',
  },
  {
    id: 'ven_datablitz',
    name: 'Datablitz',
    category: 'electronics_store',
    description: 'Gaming, PC components, and tech accessories store.',
    location: 'SM City Iloilo',
  },
  {
    id: 'ven_pc_express',
    name: 'PC Express',
    category: 'electronics_store',
    description: 'Computer hardware, laptops, and IT retailer.',
    location: 'Iloilo City',
  },
  {
    id: 'ven_dell_official',
    name: 'Dell Official Store',
    category: 'electronics_store',
    description: 'Official brand storefront for Dell monitors, laptops, and peripherals.',
    location: 'Online',
  },
  {
    id: 'ven_silicon_valley',
    name: 'Silicon Valley',
    category: 'electronics_store',
    description: 'Consumer electronics and computer store.',
    location: 'SM City Iloilo',
  },
];