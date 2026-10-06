import { useEffect } from 'react';
import { DollarSign, CheckCircle2, X } from 'lucide-react';

interface CashDrawerAlertProps {
  isOpen: boolean;
  onClose: () => void;
  cashierName: string;
  registerId: string;
  noSaleCount?: number;
  timestamp?: string;
}

export function CashDrawerAlert({
  isOpen,
  onClose,
  cashierName,
  registerId,
  noSaleCount = 1,
  timestamp,
}: CashDrawerAlertProps) {
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-12 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
      <div className="bg-slate-900 border-2 border-emerald-500 rounded-2xl p-4 shadow-2xl max-w-sm w-full flex items-start gap-3 backdrop-blur-md">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
          <DollarSign className="w-6 h-6 animate-pulse" />
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Cash Drawer Opened
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-0.5 rounded transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h4 className="text-sm font-bold text-slate-100 mt-0.5">
            No Sale / Drawer Kick
          </h4>
          <p className="text-[11px] text-slate-300 mt-1">
            Cash drawer kick pulse sent via receipt printer interface without transaction.
          </p>

          <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between font-mono">
            <span>By: {cashierName} ({registerId})</span>
            <span className="text-amber-400 font-bold">Audit #{noSaleCount}</span>
          </div>
          <div className="text-[9px] text-slate-500 font-mono mt-0.5">
            {timestamp || new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
}
