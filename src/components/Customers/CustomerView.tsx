import { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Award,
  Phone,
  Mail,
  Edit2,
  Trash2,
  Gift,
  Plus,
  Minus,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { Customer, StoreSettings } from '../../types/pos';
import { posSound } from '../../utils/sound';

interface CustomerViewProps {
  customers: Customer[];
  onSaveCustomers: (customers: Customer[]) => void;
  settings: StoreSettings;
}

export function CustomerView({
  customers,
  onSaveCustomers,
  settings,
}: CustomerViewProps) {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPoints, setFormPoints] = useState('0');

  // Points adjustment modal
  const [adjustTarget, setAdjustTarget] = useState<Customer | null>(null);
  const [adjustPointsDelta, setAdjustPointsDelta] = useState<number>(50);

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormPoints('0');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setFormName(c.name);
    setFormPhone(c.phone);
    setFormEmail(c.email || '');
    setFormPoints(c.loyaltyPoints.toString());
    setIsModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) return;

    const pointsNum = parseInt(formPoints, 10) || 0;

    if (editingCustomer) {
      const updated = customers.map((c) =>
        c.id === editingCustomer.id
          ? {
              ...c,
              name: formName.trim(),
              phone: formPhone.trim(),
              email: formEmail.trim() || undefined,
              loyaltyPoints: pointsNum,
            }
          : c
      );
      onSaveCustomers(updated);
    } else {
      const newCustomer: Customer = {
        id: `cust-${Date.now()}`,
        name: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim() || undefined,
        loyaltyPoints: pointsNum,
        totalSpent: 0,
        visitCount: 0,
        joinedDate: new Date().toISOString(),
      };
      onSaveCustomers([...customers, newCustomer]);
    }

    posSound.playScanBeep();
    setIsModalOpen(false);
  };

  const handleDeleteCustomer = (id: string) => {
    if (window.confirm('Delete this customer record?')) {
      posSound.playKeyClick();
      onSaveCustomers(customers.filter((c) => c.id !== id));
    }
  };

  const handleApplyAdjustment = (delta: number) => {
    if (!adjustTarget) return;
    const updated = customers.map((c) => {
      if (c.id === adjustTarget.id) {
        return {
          ...c,
          loyaltyPoints: Math.max(0, c.loyaltyPoints + delta),
        };
      }
      return c;
    });
    onSaveCustomers(updated);
    posSound.playDiscountFanfare();
    setAdjustTarget(null);
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col gap-4 p-4 max-w-7xl mx-auto w-full overflow-hidden">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            Customer Loyalty & Rewards System
          </h2>
          <p className="text-xs text-slate-400">
            {customers.length} enrolled members • {settings.loyaltyPointsPerDollar} pt per {settings.currencySymbol}1 spent • 100 pts = {settings.currencySymbol}5.00 reward
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
        >
          <UserPlus className="w-4 h-4" />
          Enroll New Customer
        </button>
      </div>

      {/* Search */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by customer name, phone number, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-3">Phone</th>
                <th className="py-3 px-3">Email</th>
                <th className="py-3 px-3 text-right">Points Balance</th>
                <th className="py-3 px-3 text-right">Discount Value</th>
                <th className="py-3 px-3 text-right">Lifetime Spend</th>
                <th className="py-3 px-3 text-center">Visits</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    {customers.length === 0
                      ? 'No loyalty members enrolled yet. Click "Enroll New Customer" to register your store shoppers!'
                      : 'No customer matching your search criteria.'}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-850/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-200">
                      {c.name}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-500" />
                        {c.phone}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {c.email || '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-amber-400">
                      <span className="inline-flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        {c.loyaltyPoints} pts
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-400 font-semibold">
                      {settings.currencySymbol}
                      {(c.loyaltyPoints * settings.pointValueDollars).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-200">
                      {settings.currencySymbol}
                      {c.totalSpent.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-300">
                      {c.visitCount}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setAdjustTarget(c)}
                          className="p-1.5 rounded-lg bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 transition cursor-pointer"
                          title="Award / Adjust Points"
                        >
                          <Gift className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(c)}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-amber-300 transition cursor-pointer"
                          title="Edit Customer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomer(c.id)}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enroll / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <h3 className="font-bold text-slate-100 text-base">
                {editingCustomer ? 'Edit Customer Details' : 'Enroll New Loyalty Customer'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Full Customer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Phone Number (Primary Lookup) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. (555) 349-2811"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="e.g. sarah@example.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Initial Points Balance
                </label>
                <input
                  type="number"
                  min="0"
                  value={formPoints}
                  onChange={(e) => setFormPoints(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md"
                >
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Points Adjust Modal */}
      {adjustTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-sm">
                Award / Adjust Points
              </h3>
              <button
                type="button"
                onClick={() => setAdjustTarget(null)}
                className="text-slate-400 hover:text-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300">
              Customer: <span className="font-semibold text-slate-100">{adjustTarget.name}</span>
              <br />
              Current Balance: <span className="font-mono text-amber-400 font-bold">{adjustTarget.loyaltyPoints} pts</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleApplyAdjustment(25)}
                className="py-2 rounded-lg bg-emerald-950/40 border border-emerald-700/60 text-emerald-300 font-bold text-xs hover:bg-emerald-900/60"
              >
                +25 pts
              </button>
              <button
                type="button"
                onClick={() => handleApplyAdjustment(50)}
                className="py-2 rounded-lg bg-emerald-950/40 border border-emerald-700/60 text-emerald-300 font-bold text-xs hover:bg-emerald-900/60"
              >
                +50 pts
              </button>
              <button
                type="button"
                onClick={() => handleApplyAdjustment(100)}
                className="py-2 rounded-lg bg-emerald-950/40 border border-emerald-700/60 text-emerald-300 font-bold text-xs hover:bg-emerald-900/60"
              >
                +100 pts
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleApplyAdjustment(-50)}
                className="py-2 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 font-semibold text-xs hover:bg-rose-900/60"
              >
                -50 pts (Deduct)
              </button>
              <button
                type="button"
                onClick={() => setAdjustTarget(null)}
                className="py-2 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
