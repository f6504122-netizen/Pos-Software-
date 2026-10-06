import { useState } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Volume2,
  VolumeX,
  RotateCcw,
  Download,
  Upload,
  Receipt,
  Percent,
  Award,
  Store,
  Layers,
  Plus,
  Tag,
  Edit2,
  RotateCcw as ResetIcon,
  Printer,
  DollarSign,
  Gift,
  CheckCircle2,
  Sparkles,
  Sliders,
  Eye,
} from 'lucide-react';
import {
  StoreSettings,
  Department,
  INITIAL_DEPARTMENTS,
  ReceiptCustomization,
  PrinterDeviceConfig,
  DEFAULT_RECEIPT_CUSTOMIZATION,
  DEFAULT_PRINTER_DEVICE,
} from '../../types/pos';
import { DepartmentManagerModal } from '../Departments/DepartmentManagerModal';
import { posSound } from '../../utils/sound';

interface SettingsViewProps {
  settings: StoreSettings;
  departments?: Department[];
  onSaveDepartments?: (departments: Department[]) => void;
  onSaveSettings: (settings: StoreSettings) => void;
  onOpenDrawerNoSale?: () => void;
  onExportAllData: () => void;
  onImportAllData: (jsonData: string) => void;
  onResetDatabase: () => void;
}

const COMMON_PRINTER_MODELS = [
  {
    id: 'epson-tm-t88',
    name: 'Epson TM-T88VI Thermal Receipt Printer',
    type: 'usb',
    defaultPort: 'USB001 (Thermal ESC/POS)',
    paper: '80mm',
    kickCode: 'ESC p 0 25 250 (Pin 2 / Standard ESC/POS)',
  },
  {
    id: 'epson-tm-t20',
    name: 'Epson TM-T20III Compact Thermal Printer',
    type: 'usb',
    defaultPort: 'USB002 (ESC/POS)',
    paper: '80mm',
    kickCode: 'ESC p 0 25 250 (Standard ESC/POS)',
  },
  {
    id: 'star-tsp100',
    name: 'Star Micronics TSP100III / TSP143',
    type: 'usb',
    defaultPort: 'USB Star Line Mode',
    paper: '80mm',
    kickCode: 'BEL \x07 (Star Drawer 1 Pulse)',
  },
  {
    id: 'citizen-cts310',
    name: 'Citizen CT-S310II High-Speed Thermal Printer',
    type: 'serial',
    defaultPort: 'COM3 (9600 8-N-1)',
    paper: '80mm',
    kickCode: 'ESC p 0 25 250 (Pin 2)',
  },
  {
    id: 'generic-esc-pos-80',
    name: 'Generic 80mm ESC/POS Thermal Printer',
    type: 'usb',
    defaultPort: 'USB Virtual Printer Port',
    paper: '80mm',
    kickCode: 'ESC p 0 25 250',
  },
  {
    id: 'generic-esc-pos-58',
    name: 'Generic 58mm Mobile / Countertop Thermal Printer',
    type: 'usb',
    defaultPort: 'USB / Bluetooth Serial COM4',
    paper: '58mm',
    kickCode: 'ESC p 0 25 250',
  },
  {
    id: 'windows-spooler',
    name: 'Windows Print Spooler (Default Thermal / PDF)',
    type: 'spooler',
    defaultPort: 'Windows Spooler Subsystem (winspool.drv)',
    paper: '80mm',
    kickCode: 'ESC p 0 25 250 (Driver Pulse Pass-through)',
  },
];

export function SettingsView({
  settings,
  departments = INITIAL_DEPARTMENTS,
  onSaveDepartments,
  onSaveSettings,
  onOpenDrawerNoSale,
  onExportAllData,
  onImportAllData,
  onResetDatabase,
}: SettingsViewProps) {
  const [formData, setFormData] = useState<StoreSettings>({
    ...settings,
    receiptCustomization: {
      ...DEFAULT_RECEIPT_CUSTOMIZATION,
      ...(settings.receiptCustomization || {}),
    },
    printerDevice: {
      ...DEFAULT_PRINTER_DEVICE,
      ...(settings.printerDevice || {}),
    },
  });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [testPrintSuccess, setTestPrintSuccess] = useState(false);
  const [testKickSuccess, setTestKickSuccess] = useState(false);

  const rc = formData.receiptCustomization || DEFAULT_RECEIPT_CUSTOMIZATION;
  const pd = formData.printerDevice || DEFAULT_PRINTER_DEVICE;

  const updateRc = (key: keyof ReceiptCustomization, value: any) => {
    setFormData((prev) => ({
      ...prev,
      receiptCustomization: {
        ...(prev.receiptCustomization || DEFAULT_RECEIPT_CUSTOMIZATION),
        [key]: value,
      },
    }));
  };

  const updatePd = (key: keyof PrinterDeviceConfig, value: any) => {
    setFormData((prev) => ({
      ...prev,
      printerDevice: {
        ...(prev.printerDevice || DEFAULT_PRINTER_DEVICE),
        [key]: value,
      },
    }));
  };

  const handlePrinterModelChange = (modelId: string) => {
    const found = COMMON_PRINTER_MODELS.find((m) => m.id === modelId);
    if (!found) return;

    setFormData((prev) => ({
      ...prev,
      printerDevice: {
        ...(prev.printerDevice || DEFAULT_PRINTER_DEVICE),
        model: modelId as any,
        deviceName: found.name,
        connectionType: found.type as any,
        portOrIp: found.defaultPort,
        paperWidth: found.paper as any,
        drawerKickCode: found.kickCode,
        status: 'online',
      },
      receiptCustomization: {
        ...(prev.receiptCustomization || DEFAULT_RECEIPT_CUSTOMIZATION),
        paperWidth: found.paper as any,
      },
    }));
    posSound.playScanBeep();
  };

  const handleTestPrint = () => {
    posSound.playKeyClick();
    setTestPrintSuccess(true);
    const printWindow = window.open('', '_blank', 'width=350,height=500');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Test Print - ${pd.deviceName}</title>
          <style>
            body { font-family: monospace; font-size: 11px; padding: 10px; width: ${rc.paperWidth === '58mm' ? '200px' : '280px'}; margin: 0 auto; }
            .center { text-align: center; }
            .line { border-bottom: 1px dashed #000; margin: 6px 0; }
          </style>
        </head>
        <body>
          <div class="center">
            <strong>*** TEST RECEIPT ***</strong><br/>
            ${(rc.headerTitle || formData.storeName).toUpperCase()}<br/>
            ${pd.deviceName}<br/>
            <div class="line"></div>
            PRINTER STATUS: ONLINE<br/>
            PORT: ${pd.portOrIp}<br/>
            PAPER WIDTH: ${rc.paperWidth}<br/>
            KICK PULSE: ${pd.drawerKickCode}<br/>
            DATE: ${new Date().toLocaleString()}<br/>
            <div class="line"></div>
            AUTO-CUT: ${rc.autoCutPaper ? 'YES' : 'NO'}<br/>
            OPEN DRAWER ON SALE: ${rc.openDrawerOnSale ? 'YES' : 'NO'}<br/>
            <div class="line"></div>
            <strong>*** HARDWARE READY ***</strong>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 300);
    } else {
      window.print();
    }
    setTimeout(() => setTestPrintSuccess(false), 3000);
  };

  const handleTestKick = () => {
    if (onOpenDrawerNoSale) {
      onOpenDrawerNoSale();
    } else {
      posSound.playDrawerKick();
    }
    setTestKickSuccess(true);
    setTimeout(() => setTestKickSuccess(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    posSound.enabled = formData.soundEnabled;
    posSound.playScanBeep();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportAllData(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 flex flex-col gap-4 p-4 max-w-5xl mx-auto w-full overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-amber-400" />
            Store Configuration & Hardware Settings
          </h2>
          <p className="text-xs text-slate-400">
            Customize store identity, sales taxes, loyalty rewards formula, and receipt formatting
          </p>
        </div>

        {savedSuccess && (
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
            Settings Saved Successfully!
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Section 1: Store Branding & Contact */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4 shadow-lg">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Store className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm text-slate-200">Store Profile & Branding</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Store Name
              </label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Store Tagline
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Store Physical Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Store Phone Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Tax Registration / Business Number
              </label>
              <input
                type="text"
                value={formData.taxNumber}
                onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                value={formData.currencySymbol}
                onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Tax Calculation & Shift Defaults */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4 shadow-lg">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Percent className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-200">Tax Rates & Terminal Defaults</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Sales Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Calculated on taxable items
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Register ID
              </label>
              <input
                type="text"
                value={formData.registerId}
                onChange={(e) => setFormData({ ...formData, registerId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                4-Digit Security PIN
              </label>
              <input
                type="password"
                maxLength={4}
                required
                pattern="[0-9]{4}"
                value={formData.securityPin || '1234'}
                onChange={(e) => setFormData({ ...formData, securityPin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono font-bold text-amber-400 tracking-widest focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Code to unlock register
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Daily Opening Float ({formData.currencySymbol})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.openingFloatDefault}
                onChange={(e) => setFormData({ ...formData, openingFloatDefault: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Section: Store Departments & Preset Prices */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4 shadow-lg">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <div>
                <h3 className="font-bold text-sm text-slate-200">
                  Store Departments & Preset Prices
                </h3>
                <p className="text-[11px] text-slate-400">
                  Configure preset checkout prices for each department (e.g. $10 in Department Cards, $3 in Department Gifts) or create your own custom departments.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsDeptModalOpen(true)}
              className="text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              Make / Edit Departments
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-2 hover:border-slate-700 transition"
              >
                <div>
                  <h4 className="font-semibold text-xs text-slate-200">{dept.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-mono font-bold text-emerald-400">
                      Preset: {formData.currencySymbol}{dept.defaultPrice.toFixed(2)}
                    </span>
                    {dept.taxable && (
                      <span className="text-[9px] text-slate-400 bg-slate-900 px-1 py-0.2 rounded border border-slate-800">
                        Taxable
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(true)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-900 transition cursor-pointer"
                  title="Configure department"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Customer Loyalty Point System */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4 shadow-lg">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Award className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm text-slate-200">Customer Loyalty Rewards Formula</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Points Earned per {formData.currencySymbol}1 Spent
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={formData.loyaltyPointsPerDollar}
                onChange={(e) => setFormData({ ...formData, loyaltyPointsPerDollar: parseInt(e.target.value, 10) || 1 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Cash Value per Point ({formData.currencySymbol})
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.pointValueDollars}
                onChange={(e) => setFormData({ ...formData, pointValueDollars: parseFloat(e.target.value) || 0.05 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                0.05 = $5.00 discount per 100 points
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Min. Points to Redeem
              </label>
              <input
                type="number"
                step="10"
                min="10"
                value={formData.minPointsToRedeem}
                onChange={(e) => setFormData({ ...formData, minPointsToRedeem: parseInt(e.target.value, 10) || 20 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Receipt Printer Hardware & Device Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4 shadow-lg">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="font-bold text-sm text-slate-200">
                  Receipt Printer Device & Hardware Status
                </h3>
                <p className="text-[11px] text-slate-400">
                  Select and test your retail thermal receipt printer, interface port, and cash drawer kick solenoid.
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE / READY
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Receipt Printer Model / Driver
              </label>
              <select
                value={pd.model}
                onChange={(e) => handlePrinterModelChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              >
                {COMMON_PRINTER_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.paper})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Printer Hardware Connection / Spooler Port
              </label>
              <input
                type="text"
                value={pd.portOrIp}
                onChange={(e) => updatePd('portOrIp', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                placeholder="USB001 / COM3 / 192.168.1.100"
              />
            </div>
          </div>

          {/* Hardware Test Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={handleTestPrint}
              className="bg-slate-800 hover:bg-slate-750 text-slate-100 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 border border-slate-700 transition cursor-pointer active:scale-95 shadow-md"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>{testPrintSuccess ? 'Printed Successfully!' : 'Test Print Receipt'}</span>
            </button>

            <button
              type="button"
              onClick={handleTestKick}
              className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 border border-emerald-500/40 transition cursor-pointer active:scale-95 shadow-md"
            >
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>{testKickSuccess ? 'Kick Pulse Sent!' : 'Open Cash Drawer (Kick Test)'}</span>
            </button>

            <div className="text-[11px] text-slate-400 ml-auto flex items-center gap-1 font-mono">
              <span className="text-slate-500">Pulse:</span>
              <span>{pd.drawerKickCode}</span>
            </div>
          </div>
        </div>

        {/* Section 5: Customize Thermal Receipt Layout & Live Interactive Preview */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4 shadow-lg">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-sky-400" />
              <div>
                <h3 className="font-bold text-sm text-slate-200">
                  Customize Receipt & Live Thermal Preview
                </h3>
                <p className="text-[11px] text-slate-400">
                  Personalize the receipt branding, paper width (80mm vs 58mm), custom messages, barcode, and layout toggles.
                </p>
              </div>
            </div>

            <span className="text-xs text-sky-400 font-mono font-bold bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20">
              {rc.paperWidth} Thermal Format
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Form Controls (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Receipt Store Header Title
                  </label>
                  <input
                    type="text"
                    value={rc.headerTitle}
                    onChange={(e) => updateRc('headerTitle', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    placeholder="Cards & Gifts Retail Store"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Receipt Subtitle / Tagline
                  </label>
                  <input
                    type="text"
                    value={rc.headerSubtitle}
                    onChange={(e) => updateRc('headerSubtitle', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    placeholder="Greeting Cards & Gifts"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Custom Welcome / Seasonal Greeting Message
                </label>
                <input
                  type="text"
                  value={rc.headerMessage}
                  onChange={(e) => updateRc('headerMessage', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  placeholder="Thank you for shopping with us! Have a wonderful day!"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Receipt Footer Policy & Exchange Message
                </label>
                <textarea
                  rows={3}
                  value={formData.receiptFooter}
                  onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500 resize-none"
                  placeholder="Thank you for shopping! Exchange within 14 days with receipt."
                />
              </div>

              {/* Thermal Paper Width & Font Size */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950 border border-slate-800 rounded-xl p-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1.5">
                    Thermal Paper Width
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => updateRc('paperWidth', '80mm')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                        rc.paperWidth === '80mm'
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      80mm (Standard)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateRc('paperWidth', '58mm')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                        rc.paperWidth === '58mm'
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      58mm (Compact)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1.5">
                    Thermal Font Size
                  </label>
                  <select
                    value={rc.fontSize}
                    onChange={(e) => updateRc('fontSize', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-medium"
                  >
                    <option value="small">Small (Condensed - More Lines)</option>
                    <option value="normal">Normal (Standard POS)</option>
                    <option value="large">Large (High Legibility)</option>
                  </select>
                </div>
              </div>

              {/* Toggles Checklist */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col gap-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Visible Elements on Receipt
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={rc.showLogoIcon}
                      onChange={(e) => updateRc('showLogoIcon', e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-amber-500"
                    />
                    <span>Show Festive Store Icon</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={rc.showBarcode}
                      onChange={(e) => updateRc('showBarcode', e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-amber-500"
                    />
                    <span>Show Receipt Barcode</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={rc.showCashierName}
                      onChange={(e) => updateRc('showCashierName', e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-amber-500"
                    />
                    <span>Show Cashier & Register</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={rc.showLoyaltySection}
                      onChange={(e) => updateRc('showLoyaltySection', e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-amber-500"
                    />
                    <span>Show Loyalty Rewards</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={rc.showCategoryTag}
                      onChange={(e) => updateRc('showCategoryTag', e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-amber-500"
                    />
                    <span>Show Department Names</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={rc.showPromoSavingsHighlight}
                      onChange={(e) => updateRc('showPromoSavingsHighlight', e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-amber-500"
                    />
                    <span>Highlight 50% Off Savings</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={rc.showTaxBreakdown}
                      onChange={(e) => updateRc('showTaxBreakdown', e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-amber-500"
                    />
                    <span>Show Sales Tax Breakdown</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={rc.openDrawerOnSale}
                      onChange={(e) => updateRc('openDrawerOnSale', e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-amber-500"
                    />
                    <span>Auto-Kick Drawer on Sale</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column: Live Interactive Thermal Receipt Preview (5 cols) */}
            <div className="lg:col-span-5 bg-slate-950/90 border border-slate-800 rounded-2xl p-4 flex flex-col items-center gap-3">
              <div className="flex items-center justify-between w-full pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-amber-400" />
                  Live Thermal Preview
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {rc.paperWidth} Format
                </span>
              </div>

              {/* Simulated Paper Receipt */}
              <div
                className={`bg-white text-black p-4 rounded-lg shadow-2xl font-mono leading-relaxed border border-gray-300 w-full transition-all ${
                  rc.paperWidth === '58mm'
                    ? 'max-w-[240px] text-[10px]'
                    : 'max-w-[320px] text-xs'
                }`}
              >
                {/* Header */}
                <div className="text-center pb-2 border-b border-dashed border-gray-400">
                  {rc.showLogoIcon && (
                    <div className="flex items-center justify-center gap-1 text-amber-700 font-bold mb-0.5">
                      <Gift className="w-4 h-4" />
                      <span className="text-[9px] uppercase tracking-wider">CARDS & GIFTS</span>
                    </div>
                  )}
                  <h4 className="font-black text-sm uppercase leading-tight">
                    {rc.headerTitle || formData.storeName}
                  </h4>
                  <div className="text-[10px] text-gray-700 italic">
                    {rc.headerSubtitle || formData.tagline}
                  </div>
                  <div className="text-[9px] text-gray-600 mt-0.5">{formData.address}</div>
                  <div className="text-[9px] text-gray-600">Tel: {formData.phone}</div>
                  <div className="text-[9px] text-gray-500">Tax ID: {formData.taxNumber}</div>
                  {rc.headerMessage && (
                    <div className="mt-1 text-[9px] text-gray-800 font-sans italic border-t border-dotted border-gray-300 pt-0.5">
                      "{rc.headerMessage}"
                    </div>
                  )}
                </div>

                {/* Meta */}
                <div className="py-1.5 border-b border-dashed border-gray-400 text-[9px] text-gray-700 flex flex-col gap-0.5">
                  <div className="flex justify-between">
                    <span>Receipt #:</span>
                    <span className="font-bold">R-882104</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                  {rc.showCashierName && (
                    <div className="flex justify-between">
                      <span>Cashier:</span>
                      <span>{formData.registerId} / {formData.defaultCashier}</span>
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="py-1.5 border-b border-dashed border-gray-400 text-[10px]">
                  <div className="flex justify-between font-bold border-b border-gray-300 pb-0.5 mb-1 text-[9px]">
                    <span>ITEM</span>
                    <span>TOTAL</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div>
                      <div className="flex justify-between font-semibold">
                        <span className="truncate pr-1">
                          Luxury Foil Card
                          {rc.showCategoryTag && (
                            <span className="text-[8px] text-gray-500 block">[Cards]</span>
                          )}
                        </span>
                        <span>{formData.currencySymbol}5.00</span>
                      </div>
                      <div className="flex justify-between text-[9px] text-gray-600">
                        <span>1 @ {formData.currencySymbol}10.00</span>
                        {rc.showPromoSavingsHighlight && (
                          <span className="text-red-700 font-bold">50% OFF</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold">
                        <span className="truncate pr-1">
                          Artisan Scented Candle
                          {rc.showCategoryTag && (
                            <span className="text-[8px] text-gray-500 block">[Gifts]</span>
                          )}
                        </span>
                        <span>{formData.currencySymbol}18.00</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Totals */}
                <div className="py-1.5 border-b border-dashed border-gray-400 text-[10px] flex flex-col gap-0.5">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formData.currencySymbol}28.00</span>
                  </div>
                  {rc.showPromoSavingsHighlight && (
                    <div className="flex justify-between text-red-700 font-semibold">
                      <span>50% Promo Savings:</span>
                      <span>-{formData.currencySymbol}5.00</span>
                    </div>
                  )}
                  {rc.showTaxBreakdown && (
                    <div className="flex justify-between text-gray-700">
                      <span>Sales Tax ({formData.taxRate}%):</span>
                      <span>{formData.currencySymbol}1.73</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-xs pt-1 border-t border-gray-400">
                    <span>TOTAL:</span>
                    <span>{formData.currencySymbol}24.73</span>
                  </div>
                </div>

                {/* Loyalty */}
                {rc.showLoyaltySection && (
                  <div className="py-1 border-b border-dashed border-gray-400 text-[9px] bg-amber-50/70 p-1 rounded mt-1">
                    <div className="font-bold text-center">★ LOYALTY REWARDS ★</div>
                    <div className="flex justify-between">
                      <span>Member:</span>
                      <span>Valued Customer</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Points Balance:</span>
                      <span className="font-bold">150 pts</span>
                    </div>
                  </div>
                )}

                {/* Footer Policy */}
                <div className="pt-2 text-center text-[9px] text-gray-600 whitespace-pre-line leading-relaxed">
                  {formData.receiptFooter}
                </div>

                {/* Barcode */}
                {rc.showBarcode && (
                  <div className="pt-2 text-center">
                    <div className="font-mono text-[10px] tracking-widest font-bold">
                      * R-882104 *
                    </div>
                    <div className="text-[8px] text-gray-400">
                      Scan barcode for returns/exchanges
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sound Toggle */}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
            <input
              type="checkbox"
              id="sound-check"
              checked={formData.soundEnabled}
              onChange={(e) => setFormData({ ...formData, soundEnabled: e.target.checked })}
              className="rounded border-slate-700 bg-slate-950 text-amber-500 cursor-pointer"
            />
            <label htmlFor="sound-check" className="text-xs text-slate-200 flex items-center gap-2 cursor-pointer">
              {formData.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
              Enable Retail POS audio sounds (barcode scan beeps, cash drawer solenoid kick, keypad clicks)
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3 rounded-xl text-sm flex items-center gap-2 transition cursor-pointer shadow-lg active:scale-95"
          >
            <Save className="w-4 h-4" />
            Save Store Settings
          </button>
        </div>
      </form>

      {/* Database Backup & Reset Operations */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 mt-4 flex flex-col gap-3">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
          Database Backup & Maintenance
        </h3>
        <p className="text-xs text-slate-500">
          Export your entire clean database (inventory, customers, sales history) as a JSON file or restore from a previous backup.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onExportAllData}
            className="bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-2 border border-slate-700 cursor-pointer"
          >
            <Download className="w-4 h-4 text-sky-400" />
            Export Full Backup (JSON)
          </button>

          <label className="bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-2 border border-slate-700 cursor-pointer">
            <Upload className="w-4 h-4 text-amber-400" />
            Import Backup File
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            type="button"
            onClick={onResetDatabase}
            className="bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-2 border border-rose-800/60 cursor-pointer ml-auto"
          >
            <RotateCcw className="w-4 h-4 text-rose-400" />
            Clear / Wipe All Data
          </button>
        </div>
      </div>

      <DepartmentManagerModal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        departments={departments}
        onSaveDepartments={(newDepts) => {
          if (onSaveDepartments) onSaveDepartments(newDepts);
        }}
        currencySymbol={formData.currencySymbol}
      />
    </div>
  );
}
