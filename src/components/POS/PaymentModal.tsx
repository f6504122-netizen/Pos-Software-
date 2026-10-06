import { useState, useId } from 'react';
import { CreditCard, Banknote, Award, CheckCircle2, X } from 'lucide-react';
import { Customer, StoreSettings } from '../../types/pos';
import { posSound } from '../../utils/sound';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotal: number;
  itemDiscountsTotal: number;
  taxAmount: number;
  taxRate: number;
  finalTotal: number;
  customer: Customer | null;
  settings: StoreSettings;
  onCompleteSale: (paymentData: {
    paymentMethod: 'cash' | 'card' | 'split' | 'points';
    cashTendered: number;
    cardTendered: number;
    changeDue: number;
    pointsRedeemed: number;
    pointsDiscountValue: number;
  }) => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  subtotal,
  itemDiscountsTotal,
  taxAmount,
  taxRate,
  finalTotal,
  customer,
  settings,
  onCompleteSale,
}: PaymentModalProps) {
  const tenderInputId = useId();
  const [method, setMethod] = useState<'cash' | 'card' | 'split'>('cash');
  const [cashTendered, setCashTendered] = useState<string>(finalTotal.toFixed(2));
  const [cardAmount, setCardAmount] = useState<string>('0.00');
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);

  if (!isOpen) return null;

  const pointsDiscountValue = Number(
    (pointsToRedeem * settings.pointValueDollars).toFixed(2)
  );

  const payableTotal = Math.max(0, Number((finalTotal - pointsDiscountValue).toFixed(2)));
  const cashNum = parseFloat(cashTendered) || 0;
  const cardNum = parseFloat(cardAmount) || 0;

  const totalPaid = method === 'cash' ? cashNum : method === 'card' ? payableTotal : cashNum + cardNum;
  const changeDue = Math.max(0, Number((totalPaid - payableTotal).toFixed(2)));
  const canComplete = totalPaid >= payableTotal;

  // Preset cash tender options
  const exact = payableTotal;
  const next5 = Math.ceil(payableTotal / 5) * 5;
  const next10 = Math.ceil(payableTotal / 10) * 10;
  const next20 = Math.ceil(payableTotal / 20) * 20;
  const next50 = Math.ceil(payableTotal / 50) * 50;
  const cashPresets = Array.from(new Set([exact, next5, next10, next20, next50].filter((v) => v >= payableTotal)));

  const handleSelectCashPreset = (amount: number) => {
    posSound.playKeyClick();
    setCashTendered(amount.toFixed(2));
  };

  const handleToggleRedeemAllPoints = () => {
    if (!customer) return;
    if (pointsToRedeem > 0) {
      setPointsToRedeem(0);
    } else {
      // Calculate max redeemable points so discount doesn't exceed final total
      const maxPointsForTotal = Math.floor(finalTotal / settings.pointValueDollars);
      const points = Math.min(customer.loyaltyPoints, maxPointsForTotal);
      if (points >= settings.minPointsToRedeem) {
        setPointsToRedeem(points);
        posSound.playDiscountFanfare();
      } else {
        posSound.playErrorBeep();
      }
    }
  };

  const handleSubmit = () => {
    if (!canComplete) {
      posSound.playErrorBeep();
      return;
    }

    posSound.playCashChime();
    onCompleteSale({
      paymentMethod: method === 'card' ? 'card' : method === 'split' ? 'split' : 'cash',
      cashTendered: method === 'card' ? 0 : cashNum,
      cardTendered: method === 'card' ? payableTotal : method === 'split' ? cardNum : 0,
      changeDue: method === 'card' ? 0 : changeDue,
      pointsRedeemed: pointsToRedeem,
      pointsDiscountValue: pointsDiscountValue,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-slate-100 text-lg">Checkout & Payment Tender</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount Summary */}
        <div className="p-6 flex flex-col gap-5">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Amount Due
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-mono font-extrabold text-emerald-400">
                  {settings.currencySymbol}{payableTotal.toFixed(2)}
                </span>
                {pointsDiscountValue > 0 && (
                  <span className="text-xs text-amber-400 font-medium">
                    (-{settings.currencySymbol}{pointsDiscountValue.toFixed(2)} loyalty discount)
                  </span>
                )}
              </div>
            </div>

            <div className="text-right text-xs text-slate-400 space-y-0.5">
              <div>Subtotal: {settings.currencySymbol}{subtotal.toFixed(2)}</div>
              {itemDiscountsTotal > 0 && (
                <div className="text-rose-400">
                  50% Off Promo: -{settings.currencySymbol}{itemDiscountsTotal.toFixed(2)}
                </div>
              )}
              <div>Tax ({taxRate}%): {settings.currencySymbol}{taxAmount.toFixed(2)}</div>
            </div>
          </div>

          {/* Loyalty Points Redemption (if customer attached) */}
          {customer && (
            <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200">
                    {customer.name} ({customer.loyaltyPoints} points available)
                  </div>
                  <div className="text-[11px] text-amber-400/90">
                    Min {settings.minPointsToRedeem} pts required to redeem. 100 pts = {settings.currencySymbol}5.00
                  </div>
                </div>
              </div>

              {customer.loyaltyPoints >= settings.minPointsToRedeem && (
                <button
                  type="button"
                  onClick={handleToggleRedeemAllPoints}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                    pointsToRedeem > 0
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-900 text-amber-300 border-amber-700/60 hover:bg-slate-800'
                  }`}
                >
                  {pointsToRedeem > 0 ? `Redeemed (${pointsToRedeem} pts)` : 'Redeem Points'}
                </button>
              )}
            </div>
          )}

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs uppercase font-semibold text-slate-400 mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMethod('cash');
                  setCashTendered(payableTotal.toFixed(2));
                }}
                className={`py-3 px-3 rounded-xl border flex flex-col items-center gap-1.5 font-semibold text-xs transition cursor-pointer ${
                  method === 'cash'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Banknote className="w-5 h-5" />
                Cash
              </button>

              <button
                type="button"
                onClick={() => {
                  setMethod('card');
                  setCashTendered('0.00');
                }}
                className={`py-3 px-3 rounded-xl border flex flex-col items-center gap-1.5 font-semibold text-xs transition cursor-pointer ${
                  method === 'card'
                    ? 'bg-sky-600/20 border-sky-500 text-sky-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                Credit / Debit Card
              </button>

              <button
                type="button"
                onClick={() => setMethod('split')}
                className={`py-3 px-3 rounded-xl border flex flex-col items-center gap-1.5 font-semibold text-xs transition cursor-pointer ${
                  method === 'split'
                    ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span className="font-mono text-sm">½ + ½</span>
                Split Cash / Card
              </button>
            </div>
          </div>

          {/* Cash Tender Details */}
          {(method === 'cash' || method === 'split') && (
            <div className="space-y-3 bg-slate-950/80 border border-slate-800/80 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <label htmlFor={tenderInputId} className="text-xs uppercase font-semibold text-slate-400">
                  {method === 'split' ? 'Cash Portion Tendered' : 'Cash Tendered'}
                </label>
                <span className="text-xs text-slate-500 font-mono">
                  Due: {settings.currencySymbol}{payableTotal.toFixed(2)}
                </span>
              </div>

              {/* Quick Cash Buttons */}
              {method === 'cash' && (
                <div className="flex flex-wrap gap-2">
                  {cashPresets.slice(0, 5).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleSelectCashPreset(preset)}
                      className={`py-1.5 px-3 rounded-lg text-xs font-mono font-bold border transition cursor-pointer ${
                        parseFloat(cashTendered) === preset
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {preset === payableTotal ? 'Exact ' : ''}{settings.currencySymbol}{preset.toFixed(2)}
                    </button>
                  ))}
                </div>
              )}

              {/* Cash Input */}
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-mono text-slate-400 font-bold text-lg">
                  {settings.currencySymbol}
                </span>
                <input
                  id={tenderInputId}
                  type="number"
                  step="0.01"
                  min="0"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-4 py-2 font-mono text-xl font-bold text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Split Mode Card input */}
              {method === 'split' && (
                <div>
                  <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">
                    Card Portion Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 font-mono text-slate-400 font-bold">
                      {settings.currencySymbol}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={cardAmount}
                      onChange={(e) => setCardAmount(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-4 py-1.5 font-mono text-base font-bold text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              )}

              {/* Change Due Display */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-sm font-semibold text-slate-300">Change Due to Customer:</span>
                <span
                  className={`font-mono text-2xl font-black ${
                    changeDue > 0 ? 'text-amber-400' : 'text-slate-400'
                  }`}
                >
                  {settings.currencySymbol}{changeDue.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {method === 'card' && (
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 text-center">
              <CreditCard className="w-10 h-10 text-sky-400 mx-auto mb-2" />
              <div className="font-semibold text-slate-200 text-sm">Ready for Card Terminal</div>
              <div className="text-xs text-slate-400 mt-1">
                Insert, swipe, or tap card on terminal for {settings.currencySymbol}{payableTotal.toFixed(2)}
              </div>
            </div>
          )}

          {/* Complete Button */}
          <button
            type="button"
            disabled={!canComplete}
            onClick={handleSubmit}
            className={`w-full py-4 px-6 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition cursor-pointer shadow-xl ${
              canComplete
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-[0.99]'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Complete Sale & Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
}
