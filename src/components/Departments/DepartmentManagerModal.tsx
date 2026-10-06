import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  RotateCcw,
  Percent,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Department, INITIAL_DEPARTMENTS } from '../../types/pos';
import { posSound } from '../../utils/sound';

interface DepartmentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  onSaveDepartments: (departments: Department[]) => void;
  currencySymbol: string;
}

const COLOR_OPTIONS = [
  { name: 'amber', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40', badge: 'bg-amber-500' },
  { name: 'sky', bg: 'bg-sky-500/20 text-sky-300 border-sky-500/40', badge: 'bg-sky-500' },
  { name: 'emerald', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', badge: 'bg-emerald-500' },
  { name: 'rose', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40', badge: 'bg-rose-500' },
  { name: 'purple', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40', badge: 'bg-purple-500' },
  { name: 'teal', bg: 'bg-teal-500/20 text-teal-300 border-teal-500/40', badge: 'bg-teal-500' },
  { name: 'indigo', bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40', badge: 'bg-indigo-500' },
  { name: 'orange', bg: 'bg-orange-500/20 text-orange-300 border-orange-500/40', badge: 'bg-orange-500' },
  { name: 'slate', bg: 'bg-slate-700/40 text-slate-300 border-slate-600', badge: 'bg-slate-500' },
];

export function DepartmentManagerModal({
  isOpen,
  onClose,
  departments,
  onSaveDepartments,
  currencySymbol,
}: DepartmentManagerModalProps) {
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);

  // Form fields for adding or editing
  const [deptName, setDeptName] = useState('');
  const [deptPrice, setDeptPrice] = useState('10.00');
  const [deptTaxable, setDeptTaxable] = useState(true);
  const [deptColor, setDeptColor] = useState('amber');
  const [isAddingNew, setIsAddingNew] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setEditingDeptId(null);
    setIsAddingNew(false);
    setDeptName('');
    setDeptPrice('10.00');
    setDeptTaxable(true);
    setDeptColor('amber');
  };

  const handleStartAdd = () => {
    resetForm();
    setIsAddingNew(true);
    setDeptName('');
    setDeptPrice('10.00');
    setDeptTaxable(true);
    setDeptColor('sky');
  };

  const handleStartEdit = (dept: Department) => {
    setIsAddingNew(false);
    setEditingDeptId(dept.id);
    setDeptName(dept.name);
    setDeptPrice(dept.defaultPrice.toFixed(2));
    setDeptTaxable(dept.taxable);
    setDeptColor(dept.color || 'amber');
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = deptName.trim();
    if (!cleanName) return;

    const priceNum = Math.max(0, parseFloat(deptPrice) || 0);

    if (isAddingNew) {
      const newDept: Department = {
        id: `dept-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: cleanName,
        defaultPrice: priceNum,
        taxable: deptTaxable,
        color: deptColor,
      };
      const updated = [...departments, newDept];
      onSaveDepartments(updated);
      posSound.playScanBeep();
    } else if (editingDeptId) {
      const updated = departments.map((d) =>
        d.id === editingDeptId
          ? {
              ...d,
              name: cleanName,
              defaultPrice: priceNum,
              taxable: deptTaxable,
              color: deptColor,
            }
          : d
      );
      onSaveDepartments(updated);
      posSound.playScanBeep();
    }

    resetForm();
  };

  const handleDelete = (id: string, name: string) => {
    if (departments.length <= 1) {
      alert('You must have at least one department in the store.');
      return;
    }
    if (window.confirm(`Delete department "${name}"?`)) {
      posSound.playKeyClick();
      const updated = departments.filter((d) => d.id !== id);
      onSaveDepartments(updated);
      if (editingDeptId === id) {
        resetForm();
      }
    }
  };

  const handleRestoreDefaults = () => {
    if (
      window.confirm(
        'Restore default Cards & Gifts departments ($10 Department Cards, $3 Department Gifts, etc.)?'
      )
    ) {
      posSound.playScanBeep();
      onSaveDepartments([...INITIAL_DEPARTMENTS]);
      resetForm();
    }
  };

  // Quick inline price update
  const handleQuickPriceChange = (id: string, newPriceStr: string) => {
    const val = parseFloat(newPriceStr);
    if (isNaN(val) || val < 0) return;
    const updated = departments.map((d) => (d.id === id ? { ...d, defaultPrice: val } : d));
    onSaveDepartments(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full flex flex-col max-h-[90vh] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                Store Departments & Preset Prices
              </h3>
              <p className="text-xs text-slate-400">
                Make your own departments with preset prices (e.g. $10 in Department Cards, $3 in Department Gifts)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-2 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col gap-4">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-slate-400">
              Active Departments:{' '}
              <span className="font-bold text-slate-200">{departments.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRestoreDefaults}
                className="text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-750 px-2.5 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                title="Restore default department presets"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                Reset Defaults
              </button>
              <button
                type="button"
                onClick={handleStartAdd}
                className="text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                Make New Department
              </button>
            </div>
          </div>

          {/* Add or Edit Department Form */}
          {(isAddingNew || editingDeptId) && (
            <form
              onSubmit={handleSaveItem}
              className="bg-slate-950 border border-amber-500/30 rounded-xl p-4 flex flex-col gap-3 shadow-lg"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  {isAddingNew ? 'Make Your Own Department' : 'Edit Department & Preset Price'}
                </span>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-slate-500 hover:text-slate-300 text-xs flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                    Department Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Department Cards, Department Gifts"
                    value={deptName}
                    onChange={(e) => setDeptName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                    Preset Default Price ({currencySymbol})
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-mono text-slate-500">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="10.00"
                      value={deptPrice}
                      onChange={(e) => setDeptPrice(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    One-click checkout price when clicking this department key
                  </span>
                </div>
              </div>

              {/* Taxable Toggle & Color Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="dept-taxable-checkbox"
                    checked={deptTaxable}
                    onChange={(e) => setDeptTaxable(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-amber-500 cursor-pointer"
                  />
                  <label
                    htmlFor="dept-taxable-checkbox"
                    className="text-xs text-slate-300 cursor-pointer flex items-center gap-1"
                  >
                    <Percent className="w-3.5 h-3.5 text-emerald-400" />
                    Subject to Sales Tax
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                    Color Accent
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setDeptColor(c.name)}
                        className={`w-6 h-6 rounded-full ${c.badge} transition-transform cursor-pointer border ${
                          deptColor === c.name
                            ? 'ring-2 ring-white scale-110 border-white'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 transition cursor-pointer shadow-md"
                >
                  <Check className="w-3.5 h-3.5" />
                  {isAddingNew ? 'Create Department' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* Departments List with Preset Prices */}
          <div className="flex flex-col gap-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 pb-1">
              Store Departments ({departments.length})
            </div>

            <div className="grid grid-cols-1 gap-2">
              {departments.map((dept) => {
                const isSelectedForEdit = editingDeptId === dept.id;
                const colorObj =
                  COLOR_OPTIONS.find((c) => c.name === dept.color) || COLOR_OPTIONS[0];

                return (
                  <div
                    key={dept.id}
                    className={`bg-slate-950 border rounded-xl p-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 transition-all ${
                      isSelectedForEdit
                        ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500/20'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Left details */}
                    <div className="flex items-center gap-3 min-w-[200px] flex-1">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase ${colorObj.bg} border`}
                      >
                        {dept.name.slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-xs text-slate-100">{dept.name}</h4>
                          {dept.taxable ? (
                            <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                              Taxable
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
                              No Tax
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Preset Quick Price:{' '}
                          <span className="font-mono font-bold text-amber-300">
                            {currencySymbol}
                            {dept.defaultPrice.toFixed(2)}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Quick Inline Price Setter & Controls */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
                        <span className="text-xs font-mono text-slate-400">{currencySymbol}</span>
                        <input
                          type="number"
                          step="0.50"
                          min="0"
                          value={dept.defaultPrice}
                          onChange={(e) => handleQuickPriceChange(dept.id, e.target.value)}
                          className="w-16 bg-transparent text-xs font-mono font-bold text-emerald-400 focus:outline-none"
                          title="Quickly change default price"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleStartEdit(dept)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition cursor-pointer"
                        title="Edit department name and settings"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(dept.id, dept.name)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                        title="Delete department"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Changes apply instantly to the POS checkout quick keys and reports.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-100 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
