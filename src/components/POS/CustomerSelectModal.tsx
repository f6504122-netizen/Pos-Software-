import { useState } from 'react';
import { UserCheck, UserPlus, Search, X, Award, Phone } from 'lucide-react';
import { Customer } from '../../types/pos';
import { posSound } from '../../utils/sound';

interface CustomerSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  selectedCustomerId?: string;
  onSelectCustomer: (customer: Customer | null) => void;
  onAddNewCustomer: (customer: Omit<Customer, 'id' | 'loyaltyPoints' | 'totalSpent' | 'visitCount' | 'joinedDate'>) => Customer;
  currencySymbol: string;
}

export function CustomerSelectModal({
  isOpen,
  onClose,
  customers,
  selectedCustomerId,
  onSelectCustomer,
  onAddNewCustomer,
  currencySymbol,
}: CustomerSelectModalProps) {
  const [search, setSearch] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');

  if (!isOpen) return null;

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    const created = onAddNewCustomer({
      name: newName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim() || undefined,
    });

    posSound.playScanBeep();
    onSelectCustomer(created);
    setIsAddingNew(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-slate-100">Customer Loyalty Rewards</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
          {!isAddingNew ? (
            <>
              {/* Search Bar & Add Button */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by name or phone number..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(true)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  New Customer
                </button>
              </div>

              {/* Customer List */}
              <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                {selectedCustomerId && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectCustomer(null);
                      onClose();
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 py-1 text-left underline"
                  >
                    Detach currently selected customer
                  </button>
                )}

                {filtered.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    {customers.length === 0
                      ? 'No customer records yet. Click "New Customer" to enroll your first customer for loyalty points!'
                      : 'No matching customers found.'}
                  </div>
                ) : (
                  filtered.map((c) => {
                    const isSelected = c.id === selectedCustomerId;
                    return (
                      <div
                        key={c.id}
                        onClick={() => {
                          posSound.playScanBeep();
                          onSelectCustomer(c);
                          onClose();
                        }}
                        className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 text-slate-100'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-sm flex items-center gap-2 text-slate-100">
                            {c.name}
                            {isSelected && (
                              <span className="text-[10px] bg-amber-500 text-slate-950 px-1.5 py-0.2 font-bold rounded">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-500" />
                              {c.phone}
                            </span>
                            <span>•</span>
                            <span>Spent: {currencySymbol}{c.totalSpent.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-mono font-bold text-amber-400 text-sm flex items-center gap-1 justify-end">
                            <Award className="w-4 h-4 text-amber-400" />
                            {c.loyaltyPoints} pts
                          </div>
                          <span className="text-[10px] text-slate-500">
                            ≈ {currencySymbol}{(c.loyaltyPoints * 0.05).toFixed(2)} credit
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            /* Add Customer Form */
            <form onSubmit={handleCreateCustomer} className="flex flex-col gap-3">
              <h4 className="text-sm font-semibold text-slate-200">
                Enroll New Loyalty Member
              </h4>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. (555) 234-5678"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. jane@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="flex-1 py-2 px-3 rounded-lg border border-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition cursor-pointer"
                >
                  Save & Attach Member
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
