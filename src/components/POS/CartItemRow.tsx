import { Plus, Minus, Trash2, Sparkles } from 'lucide-react';
import { CartItem } from '../../types/pos';
import { posSound } from '../../utils/sound';

interface CartItemRowProps {
  item: CartItem;
  currencySymbol: string;
  onUpdateQuantity: (id: string, delta: number) => void;
  onToggleFiftyPercentOff: (id: string) => void;
  onRemove: (id: string) => void;
}

export function CartItemRow({
  item,
  currencySymbol,
  onUpdateQuantity,
  onToggleFiftyPercentOff,
  onRemove,
}: CartItemRowProps) {
  const handleToggle50 = () => {
    posSound.playDiscountFanfare();
    onToggleFiftyPercentOff(item.id);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col gap-2 hover:border-slate-700 transition">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-slate-100 truncate">
              {item.product.name}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
            <span className="text-slate-500">{item.product.category}</span>
            {item.product.barcode && (
              <span className="font-mono text-[10px] text-slate-600">
                #{item.product.barcode}
              </span>
            )}
          </div>
        </div>

        {/* Remove button */}
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="text-slate-500 hover:text-rose-400 p-1 rounded-md hover:bg-slate-800 transition"
          title="Remove item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 mt-1">
        {/* Quantity Controls */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.id, -1)}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-8 text-center font-mono font-bold text-xs text-slate-200">
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.id, 1)}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 50% OFF One-Touch Button on Line Item */}
        <button
          type="button"
          onClick={handleToggle50}
          className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
            item.isFiftyPercentOff
              ? 'bg-rose-600 text-white border-rose-400 shadow-md ring-1 ring-rose-400/50'
              : 'bg-slate-950 text-rose-400/90 border-slate-800 hover:border-rose-700/60 hover:bg-rose-950/30'
          }`}
          title="Toggle 50% Off Half-Price Discount for this item"
        >
          <Sparkles className="w-3 h-3 text-rose-300" />
          <span>50% OFF</span>
        </button>

        {/* Pricing & Line Total */}
        <div className="text-right">
          {item.isFiftyPercentOff ? (
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-500 line-through font-mono">
                {currencySymbol}
                {(item.originalUnitPrice * item.quantity).toFixed(2)}
              </span>
              <span className="font-mono font-bold text-sm text-rose-400">
                {currencySymbol}
                {item.lineTotal.toFixed(2)}
              </span>
            </div>
          ) : (
            <span className="font-mono font-bold text-sm text-slate-200">
              {currencySymbol}
              {item.lineTotal.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
