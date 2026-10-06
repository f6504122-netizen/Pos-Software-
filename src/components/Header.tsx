import { useState, useEffect } from 'react';
import {
  Store,
  ShoppingCart,
  Package,
  Award,
  FileText,
  Settings,
  Download,
  Volume2,
  VolumeX,
  Clock,
  Sparkles,
  Printer,
  DollarSign,
} from 'lucide-react';
import { StoreSettings, DEFAULT_PRINTER_DEVICE } from '../types/pos';
import { posSound } from '../utils/sound';

interface HeaderProps {
  currentTab: 'pos' | 'inventory' | 'customers' | 'reports' | 'settings';
  onSelectTab: (tab: 'pos' | 'inventory' | 'customers' | 'reports' | 'settings') => void;
  settings: StoreSettings;
  onOpenWindowsModal: () => void;
  onLockRegister: () => void;
  cartItemCount: number;
  onOpenDrawerNoSale?: () => void;
  onOpenPrinterModal?: () => void;
}

export function Header({
  currentTab,
  onSelectTab,
  settings,
  onOpenWindowsModal,
  onLockRegister,
  cartItemCount,
  onOpenDrawerNoSale,
  onOpenPrinterModal,
}: HeaderProps) {
  const [time, setTime] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(posSound.enabled);
  const pd = settings.printerDevice || DEFAULT_PRINTER_DEVICE;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    posSound.enabled = next;
    setSoundEnabled(next);
    if (next) posSound.playScanBeep();
  };

  return (
    <header className="bg-slate-950 border-b border-slate-800 text-slate-100 px-4 py-2.5 flex items-center justify-between gap-4 select-none shrink-0">
      {/* Store Branding */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-md">
          <Store className="w-5 h-5 font-bold" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold text-sm tracking-tight text-slate-100 flex items-center gap-1.5">
              <span>{settings.storeName}</span>
              <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded">
                CARDS & GIFTS
              </span>
            </h1>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span>Reg: <strong className="text-slate-300 font-mono">{settings.registerId}</strong></span>
            <span>•</span>
            <span className="text-slate-400 font-mono">{settings.defaultCashier}</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <nav className="flex items-center gap-1 bg-slate-900 border border-slate-800/80 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => {
            posSound.playKeyClick();
            onSelectTab('pos');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer relative ${
            currentTab === 'pos'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Checkout</span>
          {cartItemCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-rose-600 text-white font-mono text-[9px] font-bold flex items-center justify-center -ml-0.5">
              {cartItemCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            posSound.playKeyClick();
            onSelectTab('inventory');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            currentTab === 'inventory'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Inventory</span>
        </button>

        <button
          type="button"
          onClick={() => {
            posSound.playKeyClick();
            onSelectTab('customers');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            currentTab === 'customers'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Loyalty</span>
        </button>

        <button
          type="button"
          onClick={() => {
            posSound.playKeyClick();
            onSelectTab('reports');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            currentTab === 'reports'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Z-Report</span>
        </button>

        <button
          type="button"
          onClick={() => {
            posSound.playKeyClick();
            onSelectTab('settings');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            currentTab === 'settings'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Settings</span>
        </button>
      </nav>

      {/* Right Controls: Cash Drawer, Printer Device, Windows App Download, Sound & Real-Time Clock */}
      <div className="flex items-center gap-2">
        {/* OPEN CASH DRAWER (NO SALE / AUDIT) BUTTON */}
        {onOpenDrawerNoSale && (
          <button
            type="button"
            onClick={onOpenDrawerNoSale}
            className="bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-600/50 hover:border-emerald-400 text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-sm"
            title="Open Cash Drawer without transaction (No Sale / Audit) [HotKey: F8]"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Open Drawer</span>
            <span className="hidden xl:inline text-[9px] bg-emerald-900 px-1 rounded text-emerald-200">F8</span>
          </button>
        )}

        {/* RECEIPT PRINTER DEVICE CHIP */}
        {onOpenPrinterModal && (
          <button
            type="button"
            onClick={onOpenPrinterModal}
            className="hidden md:flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 text-xs px-2.5 py-1.5 rounded-lg transition cursor-pointer max-w-[170px] truncate"
            title={`Receipt Printer: ${pd.deviceName} (${pd.paperWidth}) - Click to configure / test`}
          >
            <Printer className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate text-[11px] font-medium">{pd.deviceName.split(' ')[0]} {pd.paperWidth}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          </button>
        )}

        {/* Windows .exe / Standalone ZIP launcher button */}
        <button
          type="button"
          onClick={onOpenWindowsModal}
          className="bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-sm"
          title="Download Windows executable package (.zip / .bat / app)"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Windows App (.zip)</span>
        </button>

        {/* Audio Mute/Unmute */}
        <button
          type="button"
          onClick={toggleSound}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg transition cursor-pointer"
          title={soundEnabled ? 'Mute audio' : 'Unmute audio'}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <VolumeX className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {/* Lock Terminal / Switch Cashier */}
        <button
          type="button"
          onClick={() => {
            posSound.playKeyClick();
            onLockRegister();
          }}
          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-900 rounded-lg transition cursor-pointer"
          title="Lock Terminal (Requires 4-Digit PIN)"
        >
          <span className="text-xs font-semibold flex items-center gap-1">
            🔒
            <span className="hidden lg:inline text-[11px] text-slate-400">Lock</span>
          </span>
        </button>

        {/* Real-time Clock */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>{time}</span>
        </div>
      </div>
    </header>
  );
}
