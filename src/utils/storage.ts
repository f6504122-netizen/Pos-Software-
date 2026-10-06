import { Product, Customer, SaleTransaction, ZReport, StoreSettings, Department, DEFAULT_SETTINGS, INITIAL_DEPARTMENTS } from '../types/pos';

const STORAGE_KEYS = {
  PRODUCTS: 'cg_pos_products_v1',
  CUSTOMERS: 'cg_pos_customers_v1',
  TRANSACTIONS: 'cg_pos_transactions_v1',
  Z_REPORTS: 'cg_pos_zreports_v1',
  SETTINGS: 'cg_pos_settings_v1',
  DEPARTMENTS: 'cg_pos_departments_v1',
  ACTIVE_SHIFT: 'cg_pos_active_shift_v1',
};

export interface ActiveShift {
  openedAt: string;
  registerId: string;
  cashier: string;
  openingFloat: number;
  isOpen: boolean;
  noSaleCount?: number;
}

export function loadProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!raw) return []; // Strictly NO DEMO ITEMS as requested!
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load products', e);
    return [];
  }
}

export function saveProducts(products: Product[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  } catch (e) {
    console.error('Failed to save products', e);
  }
}

export function loadCustomers(): Customer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (!raw) return []; // Clean initial state
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load customers', e);
    return [];
  }
}

export function saveCustomers(customers: Customer[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  } catch (e) {
    console.error('Failed to save customers', e);
  }
}

export function loadTransactions(): SaleTransaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load transactions', e);
    return [];
  }
}

export function saveTransactions(txs: SaleTransaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
  } catch (e) {
    console.error('Failed to save transactions', e);
  }
}

export function loadZReports(): ZReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.Z_REPORTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load Z-Reports', e);
    return [];
  }
}

export function saveZReports(reports: ZReport[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.Z_REPORTS, JSON.stringify(reports));
  } catch (e) {
    console.error('Failed to save Z-Reports', e);
  }
}

export function loadSettings(): StoreSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      receiptCustomization: {
        ...DEFAULT_SETTINGS.receiptCustomization,
        ...(parsed.receiptCustomization || {}),
      },
      printerDevice: {
        ...DEFAULT_SETTINGS.printerDevice,
        ...(parsed.printerDevice || {}),
      },
    };
  } catch (e) {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: StoreSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

export function loadDepartments(): Department[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
    if (!raw) return [...INITIAL_DEPARTMENTS];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load departments', e);
    return [...INITIAL_DEPARTMENTS];
  }
}

export function saveDepartments(departments: Department[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(departments));
  } catch (e) {
    console.error('Failed to save departments', e);
  }
}

export function loadActiveShift(defaultFloat: number = 150): ActiveShift {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_SHIFT);
    if (!raw) {
      const initial: ActiveShift = {
        openedAt: new Date().toISOString(),
        registerId: 'REG-01',
        cashier: 'Store Manager',
        openingFloat: defaultFloat,
        isOpen: true,
      };
      saveActiveShift(initial);
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    return {
      openedAt: new Date().toISOString(),
      registerId: 'REG-01',
      cashier: 'Store Manager',
      openingFloat: defaultFloat,
      isOpen: true,
    };
  }
}

export function saveActiveShift(shift: ActiveShift): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SHIFT, JSON.stringify(shift));
  } catch (e) {
    console.error('Failed to save shift', e);
  }
}

// Sample starter products (ONLY populated if store manager clicks "Load Cards & Gifts Starter Catalog" button)
export const SAMPLE_CARDS_AND_GIFTS: Omit<Product, 'id' | 'createdAt'>[] = [
  {
    name: 'Luxury Birthday Foil Greeting Card',
    barcode: '793573100121',
    sku: 'CRD-BDAY-01',
    category: 'Greeting Cards',
    price: 4.95,
    costPrice: 1.20,
    stock: 24,
    minStock: 6,
    taxable: true,
  },
  {
    name: 'Artisan Thank You Botanical Card',
    barcode: '793573100237',
    sku: 'CRD-THK-02',
    category: 'Greeting Cards',
    price: 4.50,
    costPrice: 1.10,
    stock: 18,
    minStock: 5,
    taxable: true,
  },
  {
    name: 'Glitter Gold Kraft Gift Bag (Large)',
    barcode: '793573200311',
    sku: 'BAG-GLD-LG',
    category: 'Gift Bags & Wrap',
    price: 5.50,
    costPrice: 1.50,
    stock: 30,
    minStock: 8,
    taxable: true,
  },
  {
    name: 'Scented Soy Candle - Lavender Vanilla (8oz)',
    barcode: '793573300458',
    sku: 'CND-LVN-08',
    category: 'Candles & Fragrance',
    price: 18.00,
    costPrice: 6.50,
    stock: 12,
    minStock: 3,
    taxable: true,
  },
  {
    name: 'Handcrafted Ceramic Best Mom Mug',
    barcode: '793573400566',
    sku: 'MUG-MOM-01',
    category: 'Mugs & Glassware',
    price: 14.50,
    costPrice: 4.80,
    stock: 10,
    minStock: 2,
    taxable: true,
  },
  {
    name: 'Cute Fluffy Teddy Plush (10 inch)',
    barcode: '793573500672',
    sku: 'PLS-TED-10',
    category: 'Plush & Soft Toys',
    price: 22.00,
    costPrice: 8.00,
    stock: 8,
    minStock: 2,
    taxable: true,
  },
];
