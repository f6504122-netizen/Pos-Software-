import { useState } from 'react';
import {
  Printer,
  X,
  CheckCircle,
  FileText,
  Sparkles,
  Gift,
  Settings,
  HardDrive,
  Check,
} from 'lucide-react';
import {
  SaleTransaction,
  StoreSettings,
  DEFAULT_RECEIPT_CUSTOMIZATION,
  DEFAULT_PRINTER_DEVICE,
} from '../../types/pos';
import { posSound } from '../../utils/sound';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: SaleTransaction | null;
  settings: StoreSettings;
  customerPointsBalance?: number;
  onOpenPrinterModal?: () => void;
  onNavigateToSettings?: () => void;
}

export function ReceiptModal({
  isOpen,
  onClose,
  transaction,
  settings,
  customerPointsBalance,
  onOpenPrinterModal,
  onNavigateToSettings,
}: ReceiptModalProps) {
  if (!isOpen || !transaction) return null;

  const rc = settings.receiptCustomization || DEFAULT_RECEIPT_CUSTOMIZATION;
  const pd = settings.printerDevice || DEFAULT_PRINTER_DEVICE;
  const is58mm = rc.paperWidth === '58mm';

  const handlePrint = () => {
    posSound.playKeyClick();
    if (rc.openDrawerOnSale) {
      posSound.playDrawerKick();
    }
    window.print();
  };

  const handleDownloadText = () => {
    const textReceipt = `
========================================
       ${(rc.headerTitle || settings.storeName).toUpperCase()}
       ${rc.headerSubtitle || settings.tagline}
========================================
Address: ${settings.address}
Phone:   ${settings.phone}
Tax ID:  ${settings.taxNumber}
${rc.headerMessage ? `Note:    ${rc.headerMessage}\n` : ''}${
  rc.showCashierName
    ? `Register: ${transaction.registerId} | Cashier: ${transaction.cashier}\n`
    : ''
}Receipt: ${transaction.receiptNumber}
Date:    ${new Date(transaction.timestamp).toLocaleString()}
----------------------------------------
ITEMS:
${transaction.items
  .map(
    (item) =>
      `${item.product.name}${rc.showCategoryTag ? ` [${item.product.category}]` : ''}\n  ${item.quantity} x ${
        settings.currencySymbol
      }${item.unitPrice.toFixed(2)}${
        item.isFiftyPercentOff && rc.showPromoSavingsHighlight ? ' (50% OFF PROMO)' : ''
      } = ${settings.currencySymbol}${item.lineTotal.toFixed(2)}`
  )
  .join('\n')}
----------------------------------------
Subtotal:          ${settings.currencySymbol}${transaction.subtotal.toFixed(2)}
${
  transaction.discountTotal > 0 && rc.showPromoSavingsHighlight
    ? `Discounts (50%): -${settings.currencySymbol}${transaction.discountTotal.toFixed(2)}\n`
    : ''
}${
  transaction.pointsDiscountValue > 0
    ? `Loyalty Discount: -${settings.currencySymbol}${transaction.pointsDiscountValue.toFixed(2)}\n`
    : ''
}${
  rc.showTaxBreakdown
    ? `Sales Tax (${transaction.taxRate}%): ${settings.currencySymbol}${transaction.taxAmount.toFixed(2)}\n`
    : ''
}----------------------------------------
TOTAL:             ${settings.currencySymbol}${transaction.total.toFixed(2)}
----------------------------------------
Payment Tender:
  Method: ${transaction.paymentMethod.toUpperCase()}
  Cash:   ${settings.currencySymbol}${transaction.cashTendered.toFixed(2)}
  Card:   ${settings.currencySymbol}${transaction.cardTendered.toFixed(2)}
  Change: ${settings.currencySymbol}${transaction.changeDue.toFixed(2)}
${
  transaction.customerName && rc.showLoyaltySection
    ? `----------------------------------------
LOYALTY REWARDS:
  Member: ${transaction.customerName}
  Points Earned Today: +${transaction.pointsEarned} pts
  Current Balance:     ${customerPointsBalance ?? 0} pts\n`
    : ''
}----------------------------------------
${settings.receiptFooter}
========================================
Printer Device: ${pd.deviceName} (${rc.paperWidth})
`;

    const blob = new Blob([textReceipt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt-${transaction.receiptNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-slate-100 text-sm">Sale Completed</span>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToSettings && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToSettings();
                }}
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 transition cursor-pointer"
                title="Customize receipt appearance"
              >
                <Settings className="w-3 h-3" />
                Customize
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Showing Receipt Printer Device Status Banner */}
        <div className="bg-slate-950 px-4 py-2 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={onOpenPrinterModal}
            className="flex items-center gap-1.5 text-slate-300 hover:text-white transition cursor-pointer group text-left truncate"
            title="Click to view receipt printer device configuration"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] truncate">
              Printer: <strong className="text-slate-200">{pd.deviceName}</strong>
            </span>
          </button>

          <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded shrink-0">
            {rc.paperWidth} READY
          </span>
        </div>

        {/* Receipt Body (Formatted for Thermal Paper 80mm or 58mm) */}
        <div className="p-4 bg-slate-950 overflow-y-auto max-h-[60vh]">
          <div
            id="printable-receipt-area"
            className={`bg-white text-black p-4 rounded-lg shadow-inner font-mono mx-auto leading-relaxed border border-gray-200 transition-all ${
              is58mm ? 'max-w-[240px] text-[10px]' : 'max-w-[340px] text-xs'
            }`}
          >
            {/* Header */}
            <div className="text-center pb-2.5 border-b border-dashed border-gray-400">
              {rc.showLogoIcon && (
                <div className="flex items-center justify-center gap-1 text-amber-700 font-bold mb-1">
                  <Gift className="w-4 h-4" />
                  <span className="text-[10px] uppercase tracking-wider">CARDS & GIFTS</span>
                </div>
              )}
              <h2 className="text-base font-black tracking-tight uppercase leading-tight">
                {rc.headerTitle || settings.storeName}
              </h2>
              <div className="text-[10px] text-gray-700 italic">
                {rc.headerSubtitle || settings.tagline}
              </div>
              <div className="text-[10px] text-gray-600 mt-1">{settings.address}</div>
              <div className="text-[10px] text-gray-600">Tel: {settings.phone}</div>
              <div className="text-[9px] text-gray-500">Tax ID: {settings.taxNumber}</div>

              {rc.headerMessage && (
                <div className="mt-1 text-[10px] text-gray-800 font-sans italic border-t border-dotted border-gray-300 pt-1">
                  "{rc.headerMessage}"
                </div>
              )}
            </div>

            {/* Transaction Meta */}
            <div className="py-2 border-b border-dashed border-gray-400 text-[10px] text-gray-700 flex flex-col gap-0.5">
              <div className="flex justify-between">
                <span>Receipt #:</span>
                <span className="font-bold text-black">{transaction.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{new Date(transaction.timestamp).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Time:</span>
                <span>
                  {new Date(transaction.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              {rc.showCashierName && (
                <div className="flex justify-between">
                  <span>Register / Cashier:</span>
                  <span>
                    {transaction.registerId} / {transaction.cashier}
                  </span>
                </div>
              )}
            </div>

            {/* Line Items */}
            <div className="py-2 border-b border-dashed border-gray-400">
              <div className="flex justify-between font-bold text-[10px] border-b border-gray-300 pb-1 mb-1">
                <span>ITEM</span>
                <span>QTY x PRICE</span>
                <span>TOTAL</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {transaction.items.map((item) => (
                  <div key={item.id} className="flex flex-col">
                    <div className="flex justify-between font-semibold">
                      <span className="truncate pr-1">
                        {item.product.name}
                        {rc.showCategoryTag && (
                          <span className="text-[9px] text-gray-500 block">
                            [{item.product.category}]
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 font-bold">
                        {settings.currencySymbol}
                        {item.lineTotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-600">
                      <span>
                        {item.quantity} @ {settings.currencySymbol}
                        {item.unitPrice.toFixed(2)}
                      </span>
                      {item.isFiftyPercentOff && rc.showPromoSavingsHighlight && (
                        <span className="text-red-700 font-bold text-[9px]">50% OFF PROMO</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="py-2 border-b border-dashed border-gray-400 text-[11px] flex flex-col gap-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>
                  {settings.currencySymbol}
                  {transaction.subtotal.toFixed(2)}
                </span>
              </div>
              {transaction.discountTotal > 0 && rc.showPromoSavingsHighlight && (
                <div className="flex justify-between text-red-700 font-semibold">
                  <span>50% Promo Savings:</span>
                  <span>
                    -{settings.currencySymbol}
                    {transaction.discountTotal.toFixed(2)}
                  </span>
                </div>
              )}
              {transaction.pointsDiscountValue > 0 && (
                <div className="flex justify-between text-amber-700 font-semibold">
                  <span>Loyalty Points Discount:</span>
                  <span>
                    -{settings.currencySymbol}
                    {transaction.pointsDiscountValue.toFixed(2)}
                  </span>
                </div>
              )}
              {rc.showTaxBreakdown && (
                <div className="flex justify-between text-gray-700">
                  <span>Sales Tax ({transaction.taxRate}%):</span>
                  <span>
                    {settings.currencySymbol}
                    {transaction.taxAmount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm pt-1 border-t border-gray-400">
                <span>TOTAL PAID:</span>
                <span>
                  {settings.currencySymbol}
                  {transaction.total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="py-2 border-b border-dashed border-gray-400 text-[10px] text-gray-700 flex flex-col gap-0.5">
              <div className="flex justify-between font-semibold">
                <span>PAYMENT METHOD:</span>
                <span className="uppercase">{transaction.paymentMethod}</span>
              </div>
              {transaction.cashTendered > 0 && (
                <div className="flex justify-between">
                  <span>Cash Tendered:</span>
                  <span>
                    {settings.currencySymbol}
                    {transaction.cashTendered.toFixed(2)}
                  </span>
                </div>
              )}
              {transaction.cardTendered > 0 && (
                <div className="flex justify-between">
                  <span>Card Tendered:</span>
                  <span>
                    {settings.currencySymbol}
                    {transaction.cardTendered.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-bold text-black">
                <span>Change Given:</span>
                <span>
                  {settings.currencySymbol}
                  {transaction.changeDue.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Loyalty Rewards on Receipt */}
            {transaction.customerName && rc.showLoyaltySection && (
              <div className="py-2 border-b border-dashed border-gray-400 text-[10px] text-gray-800 bg-amber-50/70 p-1.5 rounded">
                <div className="font-bold text-center">★ LOYALTY MEMBER REWARDS ★</div>
                <div className="flex justify-between mt-1">
                  <span>Member:</span>
                  <span className="font-semibold">{transaction.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Points Earned Today:</span>
                  <span className="font-bold">+{transaction.pointsEarned} pts</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Point Balance:</span>
                  <span className="font-bold">{customerPointsBalance ?? 0} pts</span>
                </div>
              </div>
            )}

            {/* Footer Message */}
            <div className="pt-2.5 text-center text-[10px] text-gray-600 whitespace-pre-line leading-relaxed">
              {settings.receiptFooter}
            </div>

            {/* Barcode representation */}
            {rc.showBarcode && (
              <div className="pt-2.5 text-center">
                <div className="font-mono text-xs tracking-widest font-bold">
                  * {transaction.receiptNumber} *
                </div>
                <div className="text-[9px] text-gray-400 mt-0.5">
                  Scan barcode for returns/exchanges
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleDownloadText}
            className="p-2.5 rounded-lg border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Download receipt text file"
          >
            <FileText className="w-4 h-4" />
            Save .txt
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-slate-700 shadow-sm"
              title={`Print to ${pd.deviceName}`}
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Print Receipt</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
            >
              Next Customer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
