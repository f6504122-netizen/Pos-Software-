import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Barcode,
  Camera,
  Search,
  UserCheck,
  UserPlus,
  Trash2,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  PlusCircle,
  Percent,
  Layers,
  DollarSign,
} from 'lucide-react';
import {
  Product,
  CartItem,
  Customer,
  StoreSettings,
  SaleTransaction,
  Department,
  INITIAL_DEPARTMENTS,
} from '../../types/pos';
import { CartItemRow } from './CartItemRow';
import { InbuiltKeypad } from '../InbuiltKeypad';
import { DepartmentQuickKeys } from './DepartmentQuickKeys';
import { DepartmentManagerModal } from '../Departments/DepartmentManagerModal';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';
import { CameraScannerModal } from './CameraScannerModal';
import { CustomerSelectModal } from './CustomerSelectModal';
import { useBarcodeScanner } from '../../utils/useBarcodeScanner';
import { posSound } from '../../utils/sound';

interface POSViewProps {
  products: Product[];
  customers: Customer[];
  settings: StoreSettings;
  departments: Department[];
  onSaveDepartments: (departments: Department[]) => void;
  onSaleCompleted: (transaction: SaleTransaction, updatedProducts: Product[], updatedCustomers: Customer[]) => void;
  onAddNewCustomer: (customer: Omit<Customer, 'id' | 'loyaltyPoints' | 'totalSpent' | 'visitCount' | 'joinedDate'>) => Customer;
  onNavigateToInventory: () => void;
  onOpenDrawerNoSale?: () => void;
  onOpenPrinterModal?: () => void;
}

export function POSView({
  products,
  customers,
  settings,
  departments = INITIAL_DEPARTMENTS,
  onSaveDepartments,
  onSaleCompleted,
  onAddNewCustomer,
  onNavigateToInventory,
  onOpenDrawerNoSale,
  onOpenPrinterModal,
}: POSViewProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>();
  const [isStorewideFiftyPercent, setIsStorewideFiftyPercent] = useState<boolean>(false);
  const searchBarRef = useRef<HTMLInputElement | null>(null);

  // Modals
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isDeptManagerOpen, setIsDeptManagerOpen] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<SaleTransaction | null>(null);

  // Windows POS Keyboard Function Keys Listener
  useEffect(() => {
    const handleWindowsHotkeys = (e: KeyboardEvent) => {
      // F2: Quick Barcode / Search Focus
      if (e.key === 'F2') {
        e.preventDefault();
        posSound.playKeyClick();
        searchBarRef.current?.focus();
        searchBarRef.current?.select();
      }
      // F4: 50% Off Promo Toggle
      else if (e.key === 'F4') {
        e.preventDefault();
        handleToggleStorewide50();
      }
      // F8: Open Cash Drawer (No Sale / Audit)
      else if (e.key === 'F8') {
        e.preventDefault();
        if (onOpenDrawerNoSale) onOpenDrawerNoSale();
      }
      // F9: Tender Payment Modal
      else if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0 && !isPaymentOpen) {
          posSound.playKeyClick();
          setIsPaymentOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleWindowsHotkeys);
    return () => window.removeEventListener('keydown', handleWindowsHotkeys);
  }, [cart, isPaymentOpen]);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) || null,
    [customers, selectedCustomerId]
  );

  // Add product to cart helper
  const addProductToCart = (product: Product, overrideFiftyPercent?: boolean) => {
    posSound.playScanBeep();
    setCart((prev) => {
      const is50 = overrideFiftyPercent ?? isStorewideFiftyPercent;
      const unit = is50 ? Number((product.price * 0.5).toFixed(2)) : product.price;

      // Check if same product with same discount status exists in cart
      const existingIndex = prev.findIndex(
        (i) => i.product.id === product.id && i.isFiftyPercentOff === is50
      );

      if (existingIndex > -1) {
        const next = [...prev];
        const existing = next[existingIndex];
        const newQty = existing.quantity + 1;
        next[existingIndex] = {
          ...existing,
          quantity: newQty,
          lineTotal: Number((unit * newQty).toFixed(2)),
        };
        return next;
      }

      const newItem: CartItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        product,
        quantity: 1,
        originalUnitPrice: product.price,
        isFiftyPercentOff: is50,
        unitPrice: unit,
        lineTotal: unit,
      };
      return [...prev, newItem];
    });
  };

  // Barcode scanned handler (hardware scanner or camera or search bar Enter)
  const handleBarcodeScanned = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;

    const matched = products.find(
      (p) => p.barcode.toLowerCase() === trimmed.toLowerCase() || p.sku.toLowerCase() === trimmed.toLowerCase()
    );

    if (matched) {
      addProductToCart(matched);
      setSearchQuery('');
    } else {
      posSound.playErrorBeep();
      // Prompt quick alert / item not found
      alert(`Barcode "${trimmed}" not found in inventory. You can enter its price on the keypad or add it to inventory.`);
    }
  };

  // Hardware barcode scanner listener
  useBarcodeScanner({
    onScan: handleBarcodeScanned,
    enabled: !isPaymentOpen && !isReceiptOpen && !isCameraOpen,
  });

  // Add custom manual price item from Inbuilt Keypad
  const handleAddCustomPriceItem = (custom: {
    name: string;
    price: number;
    category: string;
    isFiftyPercentOff: boolean;
  }) => {
    const virtualProduct: Product = {
      id: `custom-${Date.now()}`,
      name: custom.name,
      barcode: '',
      sku: 'MANUAL',
      category: custom.category,
      price: custom.isFiftyPercentOff ? custom.price * 2 : custom.price,
      costPrice: 0,
      stock: 999,
      minStock: 0,
      taxable: true,
      createdAt: new Date().toISOString(),
    };

    const newItem: CartItem = {
      id: `cart-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      product: virtualProduct,
      quantity: 1,
      originalUnitPrice: virtualProduct.price,
      isFiftyPercentOff: custom.isFiftyPercentOff,
      unitPrice: custom.price,
      lineTotal: custom.price,
    };

    setCart((prev) => [...prev, newItem]);
  };

  // Quick department key clicked (e.g. $10 in Department Cards, $3 in Department Gifts)
  const handleSelectDepartmentKey = (dept: Department) => {
    if (dept.defaultPrice <= 0) {
      alert(`Department "${dept.name}" does not have a preset price ($0.00). Use the Rapid Price Keypad to type an amount for this department.`);
      return;
    }

    const is50 = isStorewideFiftyPercent;
    const unitPrice = is50 ? Number((dept.defaultPrice * 0.5).toFixed(2)) : dept.defaultPrice;

    posSound.playScanBeep();

    setCart((prev) => {
      // Check if item for this department with same discount exists
      const existingIdx = prev.findIndex(
        (i) => i.product.name === dept.name && i.isFiftyPercentOff === is50 && i.originalUnitPrice === dept.defaultPrice
      );

      if (existingIdx > -1) {
        const next = [...prev];
        const existing = next[existingIdx];
        const newQty = existing.quantity + 1;
        next[existingIdx] = {
          ...existing,
          quantity: newQty,
          lineTotal: Number((unitPrice * newQty).toFixed(2)),
        };
        return next;
      }

      const virtualProduct: Product = {
        id: `dept-item-${dept.id}-${Date.now()}`,
        name: dept.name,
        barcode: '',
        sku: `DEPT-${dept.id.replace('dept-', '').toUpperCase()}`,
        category: dept.name,
        price: dept.defaultPrice,
        costPrice: 0,
        stock: 9999,
        minStock: 0,
        taxable: dept.taxable,
        createdAt: new Date().toISOString(),
      };

      const newItem: CartItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        product: virtualProduct,
        quantity: 1,
        originalUnitPrice: dept.defaultPrice,
        isFiftyPercentOff: is50,
        unitPrice: unitPrice,
        lineTotal: unitPrice,
      };

      return [...prev, newItem];
    });
  };

  // Cart item modifications
  const handleUpdateQuantity = (id: string, delta: number) => {
    posSound.playKeyClick();
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              lineTotal: Number((item.unitPrice * newQty).toFixed(2)),
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleToggleFiftyPercentOffItem = (id: string) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newIs50 = !item.isFiftyPercentOff;
          const unit = newIs50
            ? Number((item.originalUnitPrice * 0.5).toFixed(2))
            : item.originalUnitPrice;
          return {
            ...item,
            isFiftyPercentOff: newIs50,
            unitPrice: unit,
            lineTotal: Number((unit * item.quantity).toFixed(2)),
          };
        }
        return item;
      })
    );
  };

  const handleRemoveCartItem = (id: string) => {
    posSound.playKeyClick();
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Clear all items from the current cart?')) {
      posSound.playKeyClick();
      setCart([]);
      setIsStorewideFiftyPercent(false);
    }
  };

  // Toggle storewide 50% off on all existing and new items
  const handleToggleStorewide50 = () => {
    posSound.playDiscountFanfare();
    const nextVal = !isStorewideFiftyPercent;
    setIsStorewideFiftyPercent(nextVal);
    setCart((prev) =>
      prev.map((item) => {
        const unit = nextVal
          ? Number((item.originalUnitPrice * 0.5).toFixed(2))
          : item.originalUnitPrice;
        return {
          ...item,
          isFiftyPercentOff: nextVal,
          unitPrice: unit,
          lineTotal: Number((unit * item.quantity).toFixed(2)),
        };
      })
    );
  };

  // Calculations
  const { subtotal, discountsTotal, taxableAmount, taxAmount, finalTotal } = useMemo(() => {
    let sub = 0;
    let disc = 0;
    let taxable = 0;

    cart.forEach((item) => {
      const origTotal = item.originalUnitPrice * item.quantity;
      sub += origTotal;
      if (item.isFiftyPercentOff) {
        disc += origTotal - item.lineTotal;
      }
      if (item.product.taxable) {
        taxable += item.lineTotal;
      }
    });

    const tax = Number(((taxable * settings.taxRate) / 100).toFixed(2));
    const total = Number((sub - disc + tax).toFixed(2));

    return {
      subtotal: sub,
      discountsTotal: disc,
      taxableAmount: taxable,
      taxAmount: tax,
      finalTotal: total,
    };
  }, [cart, settings.taxRate]);

  // Complete sale handler
  const handleCompleteSale = (paymentData: {
    paymentMethod: 'cash' | 'card' | 'split' | 'points';
    cashTendered: number;
    cardTendered: number;
    changeDue: number;
    pointsRedeemed: number;
    pointsDiscountValue: number;
  }) => {
    const receiptNum = `R-${Date.now().toString().slice(-6)}`;
    const effectiveTotal = Math.max(0, Number((finalTotal - paymentData.pointsDiscountValue).toFixed(2)));

    // Points calculation: 1 pt per $1 of net sales
    const pointsEarned = Math.floor(effectiveTotal * settings.loyaltyPointsPerDollar);

    const transaction: SaleTransaction = {
      id: `tx-${Date.now()}`,
      receiptNumber: receiptNum,
      timestamp: new Date().toISOString(),
      items: [...cart],
      subtotal,
      discountTotal: discountsTotal,
      globalFiftyPercentOff: isStorewideFiftyPercent,
      taxableAmount,
      taxRate: settings.taxRate,
      taxAmount,
      total: effectiveTotal,
      paymentMethod: paymentData.paymentMethod,
      cashTendered: paymentData.cashTendered,
      cardTendered: paymentData.cardTendered,
      changeDue: paymentData.changeDue,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name,
      customerPhone: selectedCustomer?.phone,
      pointsEarned,
      pointsRedeemed: paymentData.pointsRedeemed,
      pointsDiscountValue: paymentData.pointsDiscountValue,
      cashier: settings.defaultCashier,
      registerId: settings.registerId,
      status: 'completed',
    };

    // Decrement stock for inventory items
    const updatedProducts = products.map((prod) => {
      const soldItem = cart.find((i) => i.product.id === prod.id);
      if (soldItem) {
        return {
          ...prod,
          stock: Math.max(0, prod.stock - soldItem.quantity),
        };
      }
      return prod;
    });

    // Update customer loyalty points and spending
    const updatedCustomers = customers.map((cust) => {
      if (selectedCustomer && cust.id === selectedCustomer.id) {
        return {
          ...cust,
          loyaltyPoints: Math.max(0, cust.loyaltyPoints - paymentData.pointsRedeemed + pointsEarned),
          totalSpent: Number((cust.totalSpent + effectiveTotal).toFixed(2)),
          visitCount: cust.visitCount + 1,
        };
      }
      return cust;
    });

    onSaleCompleted(transaction, updatedProducts, updatedCustomers);
    setLastTransaction(transaction);
    setIsPaymentOpen(false);
    setIsReceiptOpen(true);
    setCart([]);
    setIsStorewideFiftyPercent(false);
    setSelectedCustomerId(undefined);
  };

  // Filter products by category & search
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const matchSearch =
        searchQuery === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.includes(searchQuery) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 max-w-7xl mx-auto w-full overflow-hidden">
      {/* LEFT COLUMN: Product Catalog, Barcode Search & Categories */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        {/* Search & Barcode Top Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap sm:flex-nowrap gap-2 items-center shadow-lg">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              ref={searchBarRef}
              type="text"
              placeholder="Scan barcode or search card / gift name... [F2]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleBarcodeScanned(searchQuery);
                }
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsCameraOpen(true)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Open camera barcode scanner"
          >
            <Camera className="w-4 h-4 text-amber-400" />
            <span>Camera Scan</span>
          </button>

          <button
            type="button"
            onClick={onNavigateToInventory}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Manage or add products"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>Add Product</span>
          </button>
        </div>

        {/* Category Horizontal Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-thin">
          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition cursor-pointer border ${
              selectedCategory === 'All'
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            All Items
          </button>
          {departments.map((dept) => (
            <button
              key={dept.id}
              type="button"
              onClick={() => setSelectedCategory(dept.name)}
              className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition cursor-pointer border ${
                selectedCategory === dept.name
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {dept.name}
            </button>
          ))}
        </div>

        {/* Products Grid or Empty Catalog Notice */}
        <div className="flex-1 overflow-y-auto pr-1 min-h-[220px]">
          {products.length === 0 ? (
            <div className="h-full min-h-[220px] bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mb-3">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-200 text-base mb-1">
                Store Catalog Clean & Ready
              </h3>
              <p className="text-xs text-slate-400 max-w-md mb-4">
                Configured without demo items as requested! You can type prices on the rapid keypad right now, or add your store’s cards, gift bags, and novelties.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={onNavigateToInventory}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add First Product to Inventory
                </button>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-full min-h-[180px] bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs">
              No products match "{searchQuery}" in {selectedCategory}.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.stock <= 0;
                const isLowStock = p.stock > 0 && p.stock <= p.minStock;

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (!isOutOfStock) addProductToCart(p);
                    }}
                    className={`bg-slate-900 border rounded-xl p-3 flex flex-col justify-between transition-all select-none ${
                      isOutOfStock
                        ? 'border-slate-800/40 opacity-50 cursor-not-allowed'
                        : 'border-slate-800 hover:border-amber-500/80 hover:bg-slate-850 hover:-translate-y-0.5 cursor-pointer shadow-md'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 text-[10px] text-slate-500 mb-1">
                        <span className="truncate">{p.category}</span>
                        {isOutOfStock ? (
                          <span className="text-rose-400 font-bold">SOLD OUT</span>
                        ) : isLowStock ? (
                          <span className="text-amber-400 font-bold">LOW ({p.stock})</span>
                        ) : (
                          <span className="text-slate-400 font-mono">{p.stock} in stock</span>
                        )}
                      </div>
                      <h4 className="font-semibold text-xs text-slate-200 line-clamp-2 leading-tight">
                        {p.name}
                      </h4>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/70 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-500 truncate">
                        {p.barcode ? `#${p.barcode.slice(-5)}` : p.sku}
                      </span>
                      <span className="font-mono font-bold text-sm text-emerald-400">
                        {settings.currencySymbol}{p.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MIDDLE/RIGHT COLUMN: Inbuilt Price Keypad & Cart Terminal */}
      <div className="w-full lg:w-[480px] flex flex-col gap-3 shrink-0">
        {/* DEPARTMENT QUICK KEYS WITH PRESET PRICES ($10 Cards, $3 Gifts, etc.) */}
        <DepartmentQuickKeys
          departments={departments}
          currencySymbol={settings.currencySymbol}
          onSelectDepartment={handleSelectDepartmentKey}
          onOpenDepartmentManager={() => setIsDeptManagerOpen(true)}
          isStorewideFiftyPercent={isStorewideFiftyPercent}
        />

        {/* RAPID PRICE KEYPAD (starts at $0.00 with 50% Off Button) */}
        <InbuiltKeypad
          onAddCustomItem={handleAddCustomPriceItem}
          currencySymbol={settings.currencySymbol}
          departments={departments}
          onOpenDepartmentManager={() => setIsDeptManagerOpen(true)}
        />

        {/* ACTIVE CART PANEL */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 shadow-xl">
          {/* Cart Header with Customer Loyalty & Clear buttons */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-sm text-slate-100">
                Cart ({cart.reduce((sum, i) => sum + i.quantity, 0)})
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Customer Loyalty Button */}
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(true)}
                className={`py-1 px-2 rounded-lg text-xs font-semibold flex items-center gap-1 border transition cursor-pointer ${
                  selectedCustomer
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
                title="Attach loyalty customer"
              >
                {selectedCustomer ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span className="truncate max-w-[90px]">{selectedCustomer.name}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5 text-slate-400" />
                    <span>Loyalty</span>
                  </>
                )}
              </button>

              {/* Clear Cart */}
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearCart}
                  className="text-slate-500 hover:text-rose-400 p-1 rounded-md hover:bg-slate-800 transition"
                  title="Clear Cart"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* STOREWIDE 50% OFF PROMO BANNER BUTTON */}
          {cart.length > 0 && (
            <button
              type="button"
              onClick={handleToggleStorewide50}
              className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-between cursor-pointer ${
                isStorewideFiftyPercent
                  ? 'bg-rose-600 text-white border-rose-400 shadow-md ring-1 ring-rose-400/50 animate-pulse'
                  : 'bg-rose-950/40 text-rose-300 border-rose-900/60 hover:bg-rose-950/80 hover:border-rose-700'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-300" />
                <span>STOREWIDE 50% OFF CLEARANCE</span>
              </div>
              <span className="text-[11px] font-mono bg-rose-950/80 px-2 py-0.5 rounded text-rose-200 border border-rose-700/50">
                {isStorewideFiftyPercent ? 'ACTIVE (ALL HALF PRICE)' : 'APPLY TO ALL'}
              </span>
            </button>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto max-h-[220px] flex flex-col gap-2 pr-1">
            {cart.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                Cart is empty. Scan an item or use the keypad to ring up a price.
              </div>
            ) : (
              cart.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  currencySymbol={settings.currencySymbol}
                  onUpdateQuantity={handleUpdateQuantity}
                  onToggleFiftyPercentOff={handleToggleFiftyPercentOffItem}
                  onRemove={handleRemoveCartItem}
                />
              ))
            )}
          </div>

          {/* Cart Totals & Checkout Button */}
          <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
            <div className="space-y-1 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-mono text-slate-200">
                  {settings.currencySymbol}{subtotal.toFixed(2)}
                </span>
              </div>
              {discountsTotal > 0 && (
                <div className="flex justify-between text-rose-400 font-semibold">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    50% Off Promo Savings:
                  </span>
                  <span className="font-mono">
                    -{settings.currencySymbol}{discountsTotal.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Sales Tax ({settings.taxRate}%):</span>
                <span className="font-mono text-slate-200">
                  {settings.currencySymbol}{taxAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-1 border-t border-slate-800 text-base font-bold text-slate-100">
                <span>Total Due:</span>
                <span className="font-mono text-2xl text-emerald-400 font-black">
                  {settings.currencySymbol}{finalTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={() => {
                posSound.playKeyClick();
                setIsPaymentOpen(true);
              }}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition cursor-pointer shadow-xl ${
                cart.length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-[0.98]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>Tender Payment</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* OPEN CASH DRAWER (NO SALE) BUTTON */}
            {onOpenDrawerNoSale && (
              <button
                type="button"
                onClick={onOpenDrawerNoSale}
                className="w-full py-2 px-3 rounded-xl font-semibold text-xs text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shadow-sm"
                title="Open Cash Drawer without transaction (No Sale / Audit) [HotKey: F8]"
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Open Cash Drawer (No Sale)</span>
                <span className="text-[10px] bg-slate-800 px-1 py-0.2 rounded font-mono text-slate-400 border border-slate-700">F8</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        subtotal={subtotal}
        itemDiscountsTotal={discountsTotal}
        taxAmount={taxAmount}
        taxRate={settings.taxRate}
        finalTotal={finalTotal}
        customer={selectedCustomer}
        settings={settings}
        onCompleteSale={handleCompleteSale}
      />

      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        transaction={lastTransaction}
        settings={settings}
        customerPointsBalance={selectedCustomer?.loyaltyPoints}
        onOpenPrinterModal={onOpenPrinterModal}
      />

      <CameraScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onDetected={handleBarcodeScanned}
      />

      <CustomerSelectModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customers={customers}
        selectedCustomerId={selectedCustomerId}
        onSelectCustomer={(c) => setSelectedCustomerId(c?.id)}
        onAddNewCustomer={onAddNewCustomer}
        currencySymbol={settings.currencySymbol}
      />

      <DepartmentManagerModal
        isOpen={isDeptManagerOpen}
        onClose={() => setIsDeptManagerOpen(false)}
        departments={departments}
        onSaveDepartments={onSaveDepartments}
        currencySymbol={settings.currencySymbol}
      />
    </div>
  );
}
