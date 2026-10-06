import { Tag, Plus, Sparkles, Layers } from 'lucide-react';
import { Department } from '../../types/pos';
import { posSound } from '../../utils/sound';

interface DepartmentQuickKeysProps {
  departments: Department[];
  currencySymbol: string;
  onSelectDepartment: (dept: Department) => void;
  onOpenDepartmentManager: () => void;
  isStorewideFiftyPercent?: boolean;
}

const COLOR_CLASSES: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  amber: {
    bg: 'bg-amber-950/40 hover:bg-amber-900/60 active:bg-amber-800/80',
    border: 'border-amber-500/40 hover:border-amber-400',
    text: 'text-amber-200',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  sky: {
    bg: 'bg-sky-950/40 hover:bg-sky-900/60 active:bg-sky-800/80',
    border: 'border-sky-500/40 hover:border-sky-400',
    text: 'text-sky-200',
    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  },
  emerald: {
    bg: 'bg-emerald-950/40 hover:bg-emerald-900/60 active:bg-emerald-800/80',
    border: 'border-emerald-500/40 hover:border-emerald-400',
    text: 'text-emerald-200',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  rose: {
    bg: 'bg-rose-950/40 hover:bg-rose-900/60 active:bg-rose-800/80',
    border: 'border-rose-500/40 hover:border-rose-400',
    text: 'text-rose-200',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  },
  purple: {
    bg: 'bg-purple-950/40 hover:bg-purple-900/60 active:bg-purple-800/80',
    border: 'border-purple-500/40 hover:border-purple-400',
    text: 'text-purple-200',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  },
  teal: {
    bg: 'bg-teal-950/40 hover:bg-teal-900/60 active:bg-teal-800/80',
    border: 'border-teal-500/40 hover:border-teal-400',
    text: 'text-teal-200',
    badge: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
  },
  indigo: {
    bg: 'bg-indigo-950/40 hover:bg-indigo-900/60 active:bg-indigo-800/80',
    border: 'border-indigo-500/40 hover:border-indigo-400',
    text: 'text-indigo-200',
    badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
  },
  orange: {
    bg: 'bg-orange-950/40 hover:bg-orange-900/60 active:bg-orange-800/80',
    border: 'border-orange-500/40 hover:border-orange-400',
    text: 'text-orange-200',
    badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  },
  slate: {
    bg: 'bg-slate-900 hover:bg-slate-800 active:bg-slate-750',
    border: 'border-slate-700 hover:border-slate-600',
    text: 'text-slate-200',
    badge: 'bg-slate-800 text-slate-300 border-slate-700',
  },
};

export function DepartmentQuickKeys({
  departments,
  currencySymbol,
  onSelectDepartment,
  onOpenDepartmentManager,
  isStorewideFiftyPercent = false,
}: DepartmentQuickKeysProps) {
  const handleClick = (dept: Department) => {
    posSound.playKeyClick();
    onSelectDepartment(dept);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-2.5 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Department Quick Keys & Preset Prices
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenDepartmentManager}
          className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer"
          title="Create or manage custom departments"
        >
          <Plus className="w-3 h-3" />
          Make / Edit Depts
        </button>
      </div>

      {/* Grid of Department Quick Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {departments.map((dept) => {
          const col = COLOR_CLASSES[dept.color] || COLOR_CLASSES.amber;
          const effectivePrice = isStorewideFiftyPercent
            ? Number((dept.defaultPrice * 0.5).toFixed(2))
            : dept.defaultPrice;

          return (
            <button
              key={dept.id}
              type="button"
              onClick={() => handleClick(dept)}
              className={`${col.bg} ${col.border} border rounded-xl p-2.5 text-left flex flex-col justify-between transition-all duration-150 hover:-translate-y-0.5 active:scale-95 shadow-md cursor-pointer group`}
            >
              <div className="flex items-start justify-between gap-1 w-full">
                <span className={`text-xs font-bold ${col.text} line-clamp-1 leading-tight`}>
                  {dept.name}
                </span>
                <Tag className="w-3 h-3 text-slate-400 group-hover:text-amber-400 shrink-0" />
              </div>

              <div className="mt-2 flex items-baseline justify-between w-full pt-1.5 border-t border-slate-800/60">
                <span className="text-[10px] text-slate-400 font-medium">Preset</span>
                <div className="flex items-baseline gap-1">
                  {isStorewideFiftyPercent && dept.defaultPrice > 0 && (
                    <span className="text-[10px] line-through text-slate-500 font-mono">
                      {currencySymbol}
                      {dept.defaultPrice.toFixed(2)}
                    </span>
                  )}
                  <span className="text-xs font-mono font-black text-emerald-400">
                    {currencySymbol}
                    {effectivePrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
