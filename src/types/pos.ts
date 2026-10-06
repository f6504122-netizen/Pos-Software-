export interface Product {
  id: string;
  name: string;
  barcode: string;
  sku: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  taxable: boolean;
  createdAt: string;
}

export interface CartItem {
  id: string; // unique cart line id
  product: Product;
  quantity: number;
  originalUnitPrice: number;
  isFiftyPercentOff: boolean;
  unitPrice: number; // after 50% discount or custom override
  lineTotal: number;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  loyaltyPoints: number;
  totalSpent: number;
  visitCount: number;
  joinedDate: string;
}

export interface SaleTransaction {
  id: string;
  receiptNumber: string;
  timestamp: string;
  items: CartItem[];
  subtotal: number;
  discountTotal: number;
  globalFiftyPercentOff: boolean;
  taxableAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'split' | 'points';
  cashTendered: number;
  changeDue: number;
  cardTendered: number;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  pointsEarned: number;
  pointsRedeemed: number;
  pointsDiscountValue: number;
  cashier: string;
  registerId: string;
  status: 'completed' | 'voided';
}

export interface CategorySummary {
  category: string;
  itemCount: number;
  revenue: number;
}

export interface ZReport {
  id: string;
  reportNumber: string;
  date: string;
  openedAt: string;
  closedAt: string;
  registerId: string;
  cashier: string;
  openingFloat: number;
  grossSales: number;
  totalDiscounts: number;
  netSales: number;
  taxCollected: number;
  cashSales: number;
  cardSales: number;
  pointsDiscounts: number;
  pointsIssued: number;
  pointsRedeemed: number;
  expectedCashInDrawer: number;
  actualCashCounted: number;
  overShort: number;
  transactionCount: number;
  noSaleCount?: number; // Cash drawer opens without sale (No Sale / Audit)
  voidCount: number;
  voidAmount: number;
  categories: CategorySummary[];
  notes?: string;
}

export interface ReceiptCustomization {
  headerTitle: string;
  headerSubtitle: string;
  headerMessage: string;
  showLogoIcon: boolean;
  showBarcode: boolean;
  showCashierName: boolean;
  showLoyaltySection: boolean;
  showCategoryTag: boolean;
  showPromoSavingsHighlight: boolean;
  showTaxBreakdown: boolean;
  paperWidth: '80mm' | '58mm';
  fontSize: 'small' | 'normal' | 'large';
  autoCutPaper: boolean;
  openDrawerOnSale: boolean;
}

export interface PrinterDeviceConfig {
  deviceName: string;
  model: 'epson-tm-t88' | 'epson-tm-t20' | 'star-tsp100' | 'citizen-cts310' | 'generic-esc-pos-80' | 'generic-esc-pos-58' | 'windows-spooler';
  connectionType: 'usb' | 'network' | 'serial' | 'spooler';
  portOrIp: string;
  paperWidth: '80mm' | '58mm';
  status: 'online' | 'ready' | 'offline';
  drawerKickCode: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  address: string;
  phone: string;
  taxNumber: string;
  currencySymbol: string;
  taxRate: number; // percentage e.g. 7.5
  loyaltyPointsPerDollar: number; // e.g. 1
  pointValueDollars: number; // e.g. 0.05 ($5 per 100 points)
  minPointsToRedeem: number; // e.g. 50
  receiptHeader: string;
  receiptFooter: string;
  registerId: string;
  defaultCashier: string;
  openingFloatDefault: number;
  soundEnabled: boolean;
  securityPin: string; // 4-digit PIN for register login
  receiptCustomization?: ReceiptCustomization;
  printerDevice?: PrinterDeviceConfig;
}

export interface Department {
  id: string;
  name: string;
  defaultPrice: number; // e.g. $10 in department card, $3 in department gifts
  taxable: boolean;
  color: string;
}

export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'dept-cards', name: 'Department Cards', defaultPrice: 10.00, taxable: true, color: 'amber' },
  { id: 'dept-gifts', name: 'Department Gifts', defaultPrice: 3.00, taxable: true, color: 'sky' },
  { id: 'dept-bags', name: 'Gift Bags & Wrap', defaultPrice: 5.00, taxable: true, color: 'emerald' },
  { id: 'dept-candles', name: 'Candles & Fragrance', defaultPrice: 18.00, taxable: true, color: 'purple' },
  { id: 'dept-plush', name: 'Plush & Soft Toys', defaultPrice: 15.00, taxable: true, color: 'rose' },
  { id: 'dept-stationery', name: 'Stationery & Mugs', defaultPrice: 6.50, taxable: true, color: 'teal' },
  { id: 'dept-seasonal', name: 'Seasonal Clearance', defaultPrice: 12.00, taxable: true, color: 'indigo' },
  { id: 'dept-custom', name: 'Custom / Open Dept', defaultPrice: 0.00, taxable: true, color: 'slate' },
];

export const DEFAULT_CATEGORIES = [
  'Department Cards',
  'Department Gifts',
  'Gift Bags & Wrap',
  'Candles & Fragrance',
  'Plush & Soft Toys',
  'Stationery & Mugs',
  'Seasonal Clearance',
  'Custom / Open Dept'
] as const;

export const DEFAULT_RECEIPT_CUSTOMIZATION: ReceiptCustomization = {
  headerTitle: 'Cards & Gifts Retail Store',
  headerSubtitle: 'Greeting Cards, Artisan Gifts & Celebrations',
  headerMessage: 'Thank you for celebrating life\'s moments with us! Have a wonderful day!',
  showLogoIcon: true,
  showBarcode: true,
  showCashierName: true,
  showLoyaltySection: true,
  showCategoryTag: true,
  showPromoSavingsHighlight: true,
  showTaxBreakdown: true,
  paperWidth: '80mm',
  fontSize: 'normal',
  autoCutPaper: true,
  openDrawerOnSale: true,
};

export const DEFAULT_PRINTER_DEVICE: PrinterDeviceConfig = {
  deviceName: 'Epson TM-T88VI Thermal Receipt Printer',
  model: 'epson-tm-t88',
  connectionType: 'usb',
  portOrIp: 'USB001 (Thermal ESC/POS Port)',
  paperWidth: '80mm',
  status: 'online',
  drawerKickCode: 'ESC p 0 25 250 (Pin 2 / Standard ESC/POS)',
};

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'Cards & Gifts Retail Store',
  tagline: 'Greeting Cards, Artisan Gifts & Celebrations',
  address: '104 Main Street, Suite A, Downtown',
  phone: '(555) 382-7443',
  taxNumber: 'TAX-88912-CG',
  currencySymbol: '$',
  taxRate: 7.5,
  loyaltyPointsPerDollar: 1,
  pointValueDollars: 0.05,
  minPointsToRedeem: 20,
  receiptHeader: 'Cards & Gifts Retail Store',
  receiptFooter: 'Thank you for celebrating life\'s moments with us!\nExchange within 14 days with original receipt.',
  registerId: 'POS-01',
  defaultCashier: 'Store Manager',
  openingFloatDefault: 150.00,
  soundEnabled: true,
  securityPin: '1234',
  receiptCustomization: DEFAULT_RECEIPT_CUSTOMIZATION,
  printerDevice: DEFAULT_PRINTER_DEVICE,
};
