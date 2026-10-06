import { useState, useEffect } from 'react';
import { Delete, Sparkles, Plus, Tag, ArrowRight, Layers, DollarSign } from 'lucide-react';
import { posSound } from '../utils/sound';
import { Department, INITIAL_DEPARTMENTS } from '../types/pos';

interface InbuiltKeypadProps {
  onAddCustomItem: (item: {
    name: string;
    price: number;
    category: string;
    isFiftyPercentOff: boolean;
  }) => void;
  currencySymbol?: string;
  departments?: Department[];
  onOpenDepartmentManager?: () => void;
}

export function InbuiltKeypad({
  onAddCustomItem,
  currencySymbol = '$',
  departments = INITIAL_DEPARTMENTS,
  onOpenDepartmentManager,
}: InbuiltKeypadProps) {
  // Store cents as an integer to ensure precise $0.00 behavior
  const [cents, setCents] = useState<number>(0);
  const [isHalfOffApplied, setIsHalfOffApplied] = useState<boolean>(false);
  const [selectedDeptId, setSelectedDeptId] = useState<string>(
    departments[0]?.id || 'dept-cards'
  );
  const [customName, setCustomName] = useState<string>('');

  // Keep selected department valid
  useEffect(() => {
    if (departments.length > 0 && !departments.some((d) => d.id === selectedDeptId)) {
      setSelectedDeptId(departments[0].id);
    }
  }, [departments, selectedDeptId]);

  const currentDepartment = departments.find((d) => d.id === selectedDeptId) || departments[0] || {
    id: 'dept-default',
    name: 'General',
    defaultPrice: 10.0,
    taxable: true,
    color: 'amber',
  };

  const currentPrice = cents / 100;
  const effectivePrice = isHalfOffApplied ? Number((currentPrice * 0.5).toFixed(2)) : currentPrice;

  const handleDigit = (digit: string) => {
    posSound.playKeyClick();
    if (digit === '00') {
      if (cents === 0) return;
      if (cents * 100 > 9999999) return;
      setCents((prev) => prev * 100);
      return;
    }
    const num = parseInt(digit, 10);
    if (isNaN(num)) return;
    if (cents * 10 + num > 9999999) return; // Prevent overflow
    setCents((prev) => prev * 10 + num);
  };

  const handleClear = () => {
    posSound.playKeyClick();
    setCents(0);
    setIsHalfOffApplied(false);
  };

  const handleBackspace = () => {
    posSound.playKeyClick();
    setCents((prev) => Math.floor(prev / 10));
  };

  const handleQuickAdd = (dollars: number) => {
    posSound.playKeyClick();
    setCents((prev) => prev + Math.round(dollars * 100));
  };

  const handleSetExactPrice = (dollars: number) => {
    posSound.playKeyClick();
    setCents(Math.round(dollars * 100));
  };

  const toggleFiftyPercentOff = () => {
    if (cents <= 0) {
      posSound.playErrorBeep();
      return;
    }
    posSound.playDiscountFanfare();
    setIsHalfOffApplied((prev) => !prev);
  };

  const handleCommitToCart = () => {
    if (effectivePrice <= 0) {
      posSound.playErrorBeep();
      return;
    }
    posSound.playScanBeep();
    const itemName = customName.trim()
      ? customName.trim()
      : isHalfOffApplied
      ? `${currentDepartment.name} (50% Off)`
      : `${currentDepartment.name}`;

    onAddCustomItem({
      name: itemName,
      price: effectivePrice,
      category: currentDepartment.name,
      isFiftyPercentOff: isHalfOffApplied,
    });

    // Reset keypad to $0.00
    setCents(0);
    setIsHalfOffApplied(false);
    setCustomName('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 shadow-xl select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Rapid Price Keypad
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">Starts at $0.00</span>
      </div>

      {/* Main Digital Display */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-right">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="truncate max-w-[150px] font-medium text-slate-300">
            {customName.trim() || currentDepartment.name}
          </span>
          {isHalfOffApplied && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              <Sparkles className="w-3 h-3" /> 50% OFF PROMO
            </span>
          )}
        </div>

        <div className="flex items-baseline justify-end gap-2">
          {isHalfOffApplied && (
            <span className="text-base text-slate-500 line-through font-mono">
              {currencySymbol}
              {currentPrice.toFixed(2)}
            </span>
          )}
          <span
            className={`font-mono text-3xl font-extrabold tracking-tight ${
              isHalfOffApplied ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {currencySymbol}
            {effectivePrice.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Dynamic Department Selector & Preset Price Chip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <Layers className="w-3 h-3 text-amber-400" />
              Department
            </label>
            {onOpenDepartmentManager && (
              <button
                type="button"
                onClick={onOpenDepartmentManager}
                className="text-[10px] text-amber-400 hover:text-amber-300 transition cursor-pointer"
              >
                + Make Dept
              </button>
            )}
          </div>
          <select
            value={selectedDeptId}
            onChange={(e) => {
              setSelectedDeptId(e.target.value);
              const target = departments.find((d) => d.id === e.target.value);
              if (target && target.defaultPrice > 0) {
                // If keypad is currently zero, automatically load preset price
                if (cents === 0) {
                  setCents(Math.round(target.defaultPrice * 100));
                }
              }
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-md py-1.5 px-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name} ({currencySymbol}{dept.defaultPrice.toFixed(2)})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">
            Custom Note / Item (Opt.)
          </label>
          <input
            type="text"
            placeholder="e.g. Birthday Foil Card"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-md py-1.5 px-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Department Preset Price Shortcut Button */}
      {currentDepartment && currentDepartment.defaultPrice > 0 && (
        <div className="flex items-center justify-between bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs">
          <span className="text-slate-400 text-[11px]">
            {currentDepartment.name} Preset:
          </span>
          <button
            type="button"
            onClick={() => handleSetExactPrice(currentDepartment.defaultPrice)}
            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono font-bold text-xs flex items-center gap-1 transition cursor-pointer"
            title={`Set price to preset ${currencySymbol}${currentDepartment.defaultPrice.toFixed(2)}`}
          >
            <DollarSign className="w-3 h-3 text-amber-400" />
            Load {currencySymbol}{currentDepartment.defaultPrice.toFixed(2)}
          </button>
        </div>
      )}

      {/* Quick Dollar Presets */}
      <div className="grid grid-cols-4 gap-1.5">
        {[1, 5, 10, 20].map((amt) => (
          <button
            key={amt}
            type="button"
            onClick={() => handleQuickAdd(amt)}
            className="bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-semibold py-1.5 rounded border border-slate-700/60 transition-all flex items-center justify-center gap-0.5 cursor-pointer"
          >
            <Plus className="w-3 h-3 text-emerald-400" />
            {currencySymbol}
            {amt}
          </button>
        ))}
      </div>

      {/* Keypad Grid with Dedicated 50% OFF Button */}
      <div className="grid grid-cols-4 gap-1.5 text-sm font-bold font-mono">
        <button
          type="button"
          onClick={() => handleDigit('7')}
          className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 py-3 rounded-lg border border-slate-700/50 transition cursor-pointer"
        >
          7
        </button>
        <button
          type="button"
          onClick={() => handleDigit('8')}
          className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 py-3 rounded-lg border border-slate-700/50 transition cursor-pointer"
        >
          8
        </button>
        <button
          type="button"
          onClick={() => handleDigit('9')}
          className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 py-3 rounded-lg border border-slate-700/50 transition cursor-pointer"
        >
          9
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="bg-slate-800 hover:bg-rose-950/60 text-rose-400 active:scale-95 py-3 rounded-lg border border-slate-700/50 transition cursor-pointer text-xs font-sans font-semibold"
          title="Reset to $0.00"
        >
          CLEAR
        </button>

        <button
          type="button"
          onClick={() => handleDigit('4')}
          className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 py-3 rounded-lg border border-slate-700/50 transition cursor-pointer"
        >
          4
        </button>
        <button
          type="button"
          onClick={() => handleDigit('5')}
          className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 py-3 rounded-lg border border-slate-700/50 transition cursor-pointer"
        >
          5
        </button>
        <button
          type="button"
          onClick={() => handleDigit('6')}
          className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 py-3 rounded-lg border border-slate-700/50 transition cursor-pointer"
        >
          6
        </button>
        <button
          type="button"
          onClick={handleBackspace}
          className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 py-3 rounded-lg border border-slate-700/50 transition flex items-center justify-center cursor-pointer"
          title="Backspace"
        >
          <Delete className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => handleDigit('1')}
          className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 py-3 rounded-lg border border-slate-700/50 transition cursor-pointer"
        >
          1
        </button>
        <button
          type="button"
          onClick={() => handleDigit('2')}
          className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 py-3 rounded-lg border border-slate-700/50 transition cursor-pointer"
        >
          2
        </button>
        <button
          type="button"
          onClick={() => handleDigit('3')}
          className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 py-3 rounded-lg border border-slate-700/50 transition cursor-pointer"
        >
          3
        </button>

        {/* PROMINENT 50% OFF BUTTON */}
        <button
          type="button"
          onClick={toggleFiftyPercentOff}
          className={`row-span-2 rounded-lg font-sans font-bold text-xs p-2 transition-all flex flex-col items-center justify-center gap-1 shadow-md cursor-pointer border ${
            isHalfOffApplied
              ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 ring-2 ring-rose-400/50 animate-pulse'
              : 'bg-rose-950/70 hover:bg-rose-900/90 text-rose-300 border-rose-700/60'
          }`}
          title="Cut current price by 50%"
        >
          <Sparkles className="w-4 h-4 text-rose-300" />
          <span className="text-sm font-black tracking-tight leading-none">50% OFF</span>
          <span className="text-[10px] font-normal opacity-80">
            {isHalfOffApplied ? 'ACTIVE' : 'APPLY'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 py-3 rounded-lg border border-slate-700/50 transition cursor-pointer"
        >
          0
        </button>
        <button
          type="button"
          onClick={() => handleDigit('00')}
          className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 py-3 rounded-lg border border-slate-700/50 transition cursor-pointer"
        >
          00
        </button>
        <button
          type="button"
          onClick={() => handleQuickAdd(5)}
          className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-emerald-400 py-3 rounded-lg border border-slate-700/50 transition text-xs font-sans cursor-pointer"
          title="Add $5.00"
        >
          +$5
        </button>
      </div>

      {/* Add to Cart Action */}
      <button
        type="button"
        disabled={effectivePrice <= 0}
        onClick={handleCommitToCart}
        className={`w-full py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-lg ${
          effectivePrice > 0
            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-[0.98]'
            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
        }`}
      >
        <span>
          Add {currencySymbol}
          {effectivePrice.toFixed(2)} to Cart ({currentDepartment.name})
        </span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
