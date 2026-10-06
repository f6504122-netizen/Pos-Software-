import { Barcode, Printer, Database, HardDrive, DollarSign } from 'lucide-react';

interface WindowsStatusBarProps {
  productCount: number;
  customerCount: number;
  printerDeviceName?: string;
  onOpenPrinterModal?: () => void;
  onOpenDrawerNoSale?: () => void;
  onOpenShortcutsModal?: () => void;
}

export function WindowsStatusBar({
  productCount,
  customerCount,
  printerDeviceName = 'Epson TM-T88VI (80mm)',
  onOpenPrinterModal,
  onOpenDrawerNoSale,
  onOpenShortcutsModal,
}: WindowsStatusBarProps) {
  return (
    <footer className="h-6 bg-slate-950 border-t border-slate-800 flex items-center justify-between px-3 text-[10px] text-slate-400 font-mono select-none shrink-0 z-40 overflow-hidden">
      {/* Left: System & Hardware Status */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1 text-slate-300">
          <HardDrive className="w-3 h-3 text-sky-400" />
          <span>Windows POS x64</span>
        </span>

        <span className="hidden sm:inline text-slate-600">|</span>

        <span className="hidden sm:flex items-center gap-1 text-emerald-400">
          <Barcode className="w-3 h-3" />
          <span>Scanner: USB Ready</span>
        </span>

        <span className="hidden md:inline text-slate-600">|</span>

        {/* Showing Receipt Printer Device */}
        <button
          type="button"
          onClick={onOpenPrinterModal}
          className="flex items-center gap-1 text-amber-300 hover:text-amber-200 transition cursor-pointer"
          title="Click to view receipt printer device configuration"
        >
          <Printer className="w-3 h-3 text-amber-400" />
          <span>Printer: {printerDeviceName}</span>
        </button>

        <span className="hidden lg:inline text-slate-600">|</span>

        {/* Cash Drawer Status & Shortcut */}
        <button
          type="button"
          onClick={onOpenDrawerNoSale}
          className="hidden lg:flex items-center gap-1 text-emerald-300 hover:text-emerald-200 transition cursor-pointer"
          title="Click to open cash drawer without sale [F8]"
        >
          <DollarSign className="w-3 h-3 text-emerald-400" />
          <span>Drawer: Ready [F8]</span>
        </button>

        <span className="hidden xl:inline text-slate-600">|</span>

        <span className="hidden xl:flex items-center gap-1 text-slate-300">
          <Database className="w-3 h-3 text-purple-400" />
          <span>Data: ({productCount} Items, {customerCount} Customers)</span>
        </span>
      </div>

      {/* Right: Keyboard Shortcuts Quick Reference */}
      <div className="flex items-center gap-2">
        <span className="hidden xl:inline text-slate-500">
          [F2: Scan | F4: 50% Off | F8: Drawer | F9: Tender]
        </span>

        <span className="text-emerald-400 font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>OFFLINE READY</span>
        </span>
      </div>
    </footer>
  );
}
