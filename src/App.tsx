import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { POSView } from './components/POS/POSView';
import { InventoryView } from './components/Inventory/InventoryView';
import { CustomerView } from './components/Customers/CustomerView';
import { ZReportView } from './components/Reports/ZReportView';
import { SettingsView } from './components/Settings/SettingsView';
import { WindowsExportModal } from './components/WindowsExportModal';
import { PinLoginScreen } from './components/PinLoginScreen';
import { WindowsTitleBar } from './components/WindowsTitleBar';
import { WindowsStatusBar } from './components/WindowsStatusBar';
import { CashDrawerAlert } from './components/Hardware/CashDrawerAlert';
import { PrinterDeviceModal } from './components/Hardware/PrinterDeviceModal';
import {
  Product,
  Customer,
  SaleTransaction,
  ZReport,
  StoreSettings,
  Department,
  INITIAL_DEPARTMENTS,
} from './types/pos';
import {
  loadProducts,
  saveProducts,
  loadCustomers,
  saveCustomers,
  loadTransactions,
  saveTransactions,
  loadZReports,
  saveZReports,
  loadSettings,
  saveSettings,
  loadDepartments,
  saveDepartments,
  loadActiveShift,
  saveActiveShift,
  ActiveShift,
} from './utils/storage';
import { posSound } from './utils/sound';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'pos' | 'inventory' | 'customers' | 'reports' | 'settings'>('pos');
  const [products, setProducts] = useState<Product[]>(() => loadProducts());
  const [customers, setCustomers] = useState<Customer[]>(() => loadCustomers());
  const [transactions, setTransactions] = useState<SaleTransaction[]>(() => loadTransactions());
  const [zReports, setZReports] = useState<ZReport[]>(() => loadZReports());
  const [settings, setSettings] = useState<StoreSettings>(() => loadSettings());
  const [departments, setDepartments] = useState<Department[]>(() => loadDepartments());
  const [activeShift, setActiveShift] = useState<ActiveShift>(() => loadActiveShift(settings.openingFloatDefault));

  // PWA install prompt handler
  const [pwaPrompt, setPwaPrompt] = useState<any>(null);
  const [isWindowsModalOpen, setIsWindowsModalOpen] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState<boolean>(false);
  const [isDrawerAlertOpen, setIsDrawerAlertOpen] = useState<boolean>(false);
  const [drawerAlertTime, setDrawerAlertTime] = useState<string>('');

  useEffect(() => {
    posSound.enabled = settings.soundEnabled;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setPwaPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, [settings.soundEnabled]);

  // Persist products
  const handleSaveProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    saveProducts(newProducts);
  };

  // Persist customers
  const handleSaveCustomers = (newCustomers: Customer[]) => {
    setCustomers(newCustomers);
    saveCustomers(newCustomers);
  };

  // Add single customer helper
  const handleAddNewCustomer = (
    data: Omit<Customer, 'id' | 'loyaltyPoints' | 'totalSpent' | 'visitCount' | 'joinedDate'>
  ): Customer => {
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: data.name,
      phone: data.phone,
      email: data.email,
      loyaltyPoints: 0,
      totalSpent: 0,
      visitCount: 0,
      joinedDate: new Date().toISOString(),
    };
    const updated = [...customers, newCust];
    handleSaveCustomers(updated);
    return newCust;
  };

  // Persist settings
  const handleSaveSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    posSound.enabled = newSettings.soundEnabled;
  };

  // Persist departments & preset prices
  const handleSaveDepartments = (newDepartments: Department[]) => {
    setDepartments(newDepartments);
    saveDepartments(newDepartments);
  };

  // Sale completed handler
  const handleSaleCompleted = (
    transaction: SaleTransaction,
    updatedProducts: Product[],
    updatedCustomers: Customer[]
  ) => {
    const newTxs = [transaction, ...transactions];
    setTransactions(newTxs);
    saveTransactions(newTxs);

    handleSaveProducts(updatedProducts);
    handleSaveCustomers(updatedCustomers);
  };

  // Z-Report Close Shift
  const handleCloseZReport = (report: ZReport, nextShift: ActiveShift) => {
    const newReports = [report, ...zReports];
    setZReports(newReports);
    saveZReports(newReports);

    setActiveShift(nextShift);
    saveActiveShift(nextShift);
  };

  // Update active shift (e.g. edit opening float)
  const handleUpdateActiveShift = (updatedShift: ActiveShift) => {
    setActiveShift(updatedShift);
    saveActiveShift(updatedShift);
  };

  // Open Cash Drawer without transaction (No Sale / Audit)
  const handleOpenDrawerNoSale = () => {
    posSound.playDrawerKick();
    const nextNoSale = (activeShift.noSaleCount || 0) + 1;
    const updatedShift: ActiveShift = {
      ...activeShift,
      noSaleCount: nextNoSale,
    };
    setActiveShift(updatedShift);
    saveActiveShift(updatedShift);
    setDrawerAlertTime(new Date().toLocaleTimeString());
    setIsDrawerAlertOpen(true);
  };

  // Export full JSON backup
  const handleExportAllData = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      store: settings.storeName,
      products,
      customers,
      transactions,
      zReports,
      settings,
      departments,
      activeShift,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cards-and-Gifts-POS-Backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import JSON backup
  const handleImportAllData = (rawJson: string) => {
    try {
      const parsed = JSON.parse(rawJson);
      if (parsed.products) handleSaveProducts(parsed.products);
      if (parsed.customers) handleSaveCustomers(parsed.customers);
      if (parsed.transactions) {
        setTransactions(parsed.transactions);
        saveTransactions(parsed.transactions);
      }
      if (parsed.zReports) {
        setZReports(parsed.zReports);
        saveZReports(parsed.zReports);
      }
      if (parsed.settings) handleSaveSettings(parsed.settings);
      if (parsed.departments) handleSaveDepartments(parsed.departments);
      posSound.playDiscountFanfare();
      alert('Backup data successfully restored!');
    } catch (err) {
      alert('Invalid backup JSON file.');
    }
  };

  // Reset database completely (wipes clean, 0 items)
  const handleResetDatabase = () => {
    if (
      window.confirm(
        'WARNING: This will wipe all inventory items, customer records, and transaction logs. Start completely clean? This cannot be undone.'
      )
    ) {
      localStorage.clear();
      setProducts([]);
      setCustomers([]);
      setTransactions([]);
      setZReports([]);
      setDepartments([...INITIAL_DEPARTMENTS]);
      saveDepartments([...INITIAL_DEPARTMENTS]);
      const shift = loadActiveShift(settings.openingFloatDefault);
      setActiveShift(shift);
      posSound.playScanBeep();
      alert('Database cleared! System is completely clean without demo items.');
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* 4-Digit Security PIN Login Screen */}
      {isLocked && (
        <PinLoginScreen
          expectedPin={settings.securityPin || '1234'}
          storeName={settings.storeName}
          tagline={settings.tagline}
          cashierName={settings.defaultCashier}
          registerId={settings.registerId}
          onSuccess={() => setIsLocked(false)}
        />
      )}

      {/* Windows Native Application Titlebar */}
      <WindowsTitleBar
        storeName={settings.storeName}
        registerId={settings.registerId}
        onLock={() => setIsLocked(true)}
        onOpenWindowsModal={() => setIsWindowsModalOpen(true)}
      />

      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        settings={settings}
        onOpenWindowsModal={() => setIsWindowsModalOpen(true)}
        onLockRegister={() => setIsLocked(true)}
        cartItemCount={0}
        onOpenDrawerNoSale={handleOpenDrawerNoSale}
        onOpenPrinterModal={() => setIsPrinterModalOpen(true)}
      />

      {/* Main Tab View */}
      <main className="flex-1 flex overflow-hidden">
        {currentTab === 'pos' && (
          <POSView
            products={products}
            customers={customers}
            settings={settings}
            departments={departments}
            onSaveDepartments={handleSaveDepartments}
            onSaleCompleted={handleSaleCompleted}
            onAddNewCustomer={handleAddNewCustomer}
            onNavigateToInventory={() => setCurrentTab('inventory')}
            onOpenDrawerNoSale={handleOpenDrawerNoSale}
            onOpenPrinterModal={() => setIsPrinterModalOpen(true)}
          />
        )}

        {currentTab === 'inventory' && (
          <InventoryView
            products={products}
            departments={departments}
            onSaveProducts={handleSaveProducts}
            currencySymbol={settings.currencySymbol}
          />
        )}

        {currentTab === 'customers' && (
          <CustomerView
            customers={customers}
            onSaveCustomers={handleSaveCustomers}
            settings={settings}
          />
        )}

        {currentTab === 'reports' && (
          <ZReportView
            transactions={transactions}
            zReports={zReports}
            activeShift={activeShift}
            settings={settings}
            onCloseZReport={handleCloseZReport}
            onUpdateActiveShift={handleUpdateActiveShift}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            settings={settings}
            departments={departments}
            onSaveDepartments={handleSaveDepartments}
            onSaveSettings={handleSaveSettings}
            onOpenDrawerNoSale={handleOpenDrawerNoSale}
            onExportAllData={handleExportAllData}
            onImportAllData={handleImportAllData}
            onResetDatabase={handleResetDatabase}
          />
        )}
      </main>

      {/* Windows Desktop Status Bar */}
      <WindowsStatusBar
        productCount={products.length}
        customerCount={customers.length}
        printerDeviceName={settings.printerDevice?.deviceName || 'Epson TM-T88VI (80mm)'}
        onOpenPrinterModal={() => setIsPrinterModalOpen(true)}
        onOpenDrawerNoSale={handleOpenDrawerNoSale}
      />

      {/* Windows Deployment / Standalone ZIP Modal */}
      <WindowsExportModal
        isOpen={isWindowsModalOpen}
        onClose={() => setIsWindowsModalOpen(false)}
        pwaInstallPrompt={pwaPrompt}
      />

      {/* Hardware: Receipt Printer Device Modal */}
      <PrinterDeviceModal
        isOpen={isPrinterModalOpen}
        onClose={() => setIsPrinterModalOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onOpenDrawerKick={handleOpenDrawerNoSale}
        onNavigateToSettings={() => setCurrentTab('settings')}
      />

      {/* Hardware: Cash Drawer Opened Alert */}
      <CashDrawerAlert
        isOpen={isDrawerAlertOpen}
        onClose={() => setIsDrawerAlertOpen(false)}
        cashierName={settings.defaultCashier}
        registerId={settings.registerId}
        noSaleCount={activeShift.noSaleCount || 1}
        timestamp={drawerAlertTime}
      />
    </div>
  );
}
