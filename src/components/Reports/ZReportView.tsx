import { useState, useMemo } from 'react';
import {
  FileText,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Archive,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Download,
  Edit2,
  Search,
  Eye,
  X,
} from 'lucide-react';
import { SaleTransaction, ZReport, StoreSettings, CategorySummary } from '../../types/pos';
import { ActiveShift } from '../../utils/storage';
import { posSound } from '../../utils/sound';
import { generateZReportPDF } from '../../utils/pdfExport';

interface ZReportViewProps {
  transactions: SaleTransaction[];
  zReports: ZReport[];
  activeShift: ActiveShift;
  settings: StoreSettings;
  onCloseZReport: (report: ZReport, nextShift: ActiveShift) => void;
  onUpdateActiveShift: (updatedShift: ActiveShift) => void;
}

export function ZReportView({
  transactions,
  zReports,
  activeShift,
  settings,
  onCloseZReport,
  onUpdateActiveShift,
}: ZReportViewProps) {
  const [activeTab, setActiveTab] = useState<'current' | 'archive'>('current');
  const [selectedHistoricalReport, setSelectedHistoricalReport] = useState<ZReport | null>(null);

  // Opening Float Editor
  const [isEditFloatModalOpen, setIsEditFloatModalOpen] = useState(false);
  const [floatInputValue, setFloatInputValue] = useState<string>(activeShift.openingFloat.toString());

  // Archive Search & Filter
  const [archiveSearch, setArchiveSearch] = useState<string>('');

  const filteredHistoricalReports = useMemo(() => {
    if (!archiveSearch.trim()) return zReports;
    const q = archiveSearch.toLowerCase();
    return zReports.filter(
      (r) =>
        r.reportNumber.toLowerCase().includes(q) ||
        r.date.toLowerCase().includes(q) ||
        r.cashier.toLowerCase().includes(q) ||
        r.registerId.toLowerCase().includes(q)
    );
  }, [zReports, archiveSearch]);

  // Cash drawer actual count input by Store Manager
  const [countedCash, setCountedCash] = useState<string>('');
  const [managerNotes, setManagerNotes] = useState<string>('');
  const [isClosureModalOpen, setIsClosureModalOpen] = useState(false);

  // Filter transactions belonging to the current open shift
  const currentShiftTransactions = useMemo(() => {
    const shiftStart = new Date(activeShift.openedAt).getTime();
    return transactions.filter(
      (t) => new Date(t.timestamp).getTime() >= shiftStart && t.status === 'completed'
    );
  }, [transactions, activeShift.openedAt]);

  // Aggregate current shift metrics
  const shiftMetrics = useMemo(() => {
    let gross = 0;
    let disc = 0;
    let tax = 0;
    let net = 0;
    let cash = 0;
    let card = 0;
    let ptsDisc = 0;
    let ptsEarned = 0;
    let ptsUsed = 0;
    const catMap: Record<string, { count: number; revenue: number }> = {};

    currentShiftTransactions.forEach((t) => {
      gross += t.subtotal;
      disc += t.discountTotal;
      tax += t.taxAmount;
      net += t.total;
      cash += t.paymentMethod === 'cash' ? t.total : t.paymentMethod === 'split' ? t.cashTendered - t.changeDue : 0;
      card += t.paymentMethod === 'card' ? t.total : t.paymentMethod === 'split' ? t.cardTendered : 0;
      ptsDisc += t.pointsDiscountValue;
      ptsEarned += t.pointsEarned;
      ptsUsed += t.pointsRedeemed;

      t.items.forEach((item) => {
        const cat = item.product.category || 'General';
        if (!catMap[cat]) catMap[cat] = { count: 0, revenue: 0 };
        catMap[cat].count += item.quantity;
        catMap[cat].revenue += item.lineTotal;
      });
    });

    const categories: CategorySummary[] = Object.entries(catMap).map(([category, d]) => ({
      category,
      itemCount: d.count,
      revenue: Number(d.revenue.toFixed(2)),
    }));

    const expectedCash = Number((activeShift.openingFloat + cash).toFixed(2));
    const countedCashNum = parseFloat(countedCash) || expectedCash;
    const overShort = Number((countedCashNum - expectedCash).toFixed(2));
    const avgBasket = currentShiftTransactions.length > 0 ? net / currentShiftTransactions.length : 0;

    return {
      grossSales: Number(gross.toFixed(2)),
      totalDiscounts: Number(disc.toFixed(2)),
      taxCollected: Number(tax.toFixed(2)),
      netSales: Number(net.toFixed(2)),
      cashSales: Number(cash.toFixed(2)),
      cardSales: Number(card.toFixed(2)),
      pointsDiscounts: Number(ptsDisc.toFixed(2)),
      pointsIssued: ptsEarned,
      pointsRedeemed: ptsUsed,
      expectedCash,
      countedCash: countedCashNum,
      overShort,
      transactionCount: currentShiftTransactions.length,
      averageBasket: Number(avgBasket.toFixed(2)),
      categories,
    };
  }, [currentShiftTransactions, activeShift.openingFloat, countedCash]);

  // Handle Close Shift and generate Z-Report
  const handleFinalizeZReport = () => {
    const reportNum = `Z-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    const nowIso = new Date().toISOString();

    const zReport: ZReport = {
      id: `zrep-${Date.now()}`,
      reportNumber: reportNum,
      date: new Date().toLocaleDateString(),
      openedAt: activeShift.openedAt,
      closedAt: nowIso,
      registerId: activeShift.registerId,
      cashier: activeShift.cashier,
      openingFloat: activeShift.openingFloat,
      grossSales: shiftMetrics.grossSales,
      totalDiscounts: shiftMetrics.totalDiscounts,
      netSales: shiftMetrics.netSales,
      taxCollected: shiftMetrics.taxCollected,
      cashSales: shiftMetrics.cashSales,
      cardSales: shiftMetrics.cardSales,
      pointsDiscounts: shiftMetrics.pointsDiscounts,
      pointsIssued: shiftMetrics.pointsIssued,
      pointsRedeemed: shiftMetrics.pointsRedeemed,
      expectedCashInDrawer: shiftMetrics.expectedCash,
      actualCashCounted: shiftMetrics.countedCash,
      overShort: shiftMetrics.overShort,
      transactionCount: shiftMetrics.transactionCount,
      noSaleCount: activeShift.noSaleCount || 0,
      voidCount: 0,
      voidAmount: 0,
      categories: shiftMetrics.categories,
      notes: managerNotes.trim() || undefined,
    };

    // Prepare next day's opening shift
    const nextShift: ActiveShift = {
      openedAt: nowIso,
      registerId: activeShift.registerId,
      cashier: activeShift.cashier,
      openingFloat: settings.openingFloatDefault,
      isOpen: true,
      noSaleCount: 0,
    };

    // Auto-generate and save PDF format with date and time
    try {
      generateZReportPDF(zReport, settings);
    } catch (e) {
      console.error('Error generating PDF', e);
    }

    posSound.playCashChime();
    onCloseZReport(zReport, nextShift);
    setSelectedHistoricalReport(zReport);
    setIsClosureModalOpen(false);
  };

  const handleDownloadCurrentShiftPDF = () => {
    posSound.playKeyClick();
    const tempReport: ZReport = {
      id: `zrep-live-${Date.now()}`,
      reportNumber: `Z-LIVE-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
      date: new Date().toLocaleDateString(),
      openedAt: activeShift.openedAt,
      closedAt: new Date().toISOString(),
      registerId: activeShift.registerId,
      cashier: activeShift.cashier,
      openingFloat: activeShift.openingFloat,
      grossSales: shiftMetrics.grossSales,
      totalDiscounts: shiftMetrics.totalDiscounts,
      netSales: shiftMetrics.netSales,
      taxCollected: shiftMetrics.taxCollected,
      cashSales: shiftMetrics.cashSales,
      cardSales: shiftMetrics.cardSales,
      pointsDiscounts: shiftMetrics.pointsDiscounts,
      pointsIssued: shiftMetrics.pointsIssued,
      pointsRedeemed: shiftMetrics.pointsRedeemed,
      expectedCashInDrawer: shiftMetrics.expectedCash,
      actualCashCounted: shiftMetrics.countedCash,
      overShort: shiftMetrics.overShort,
      transactionCount: shiftMetrics.transactionCount,
      voidCount: 0,
      voidAmount: 0,
      categories: shiftMetrics.categories,
      notes: managerNotes.trim() || 'Mid-shift interim audit',
    };
    generateZReportPDF(tempReport, settings);
  };

  const handleSaveOpeningFloat = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(floatInputValue);
    if (isNaN(parsed) || parsed < 0) return;
    onUpdateActiveShift({
      ...activeShift,
      openingFloat: Number(parsed.toFixed(2)),
    });
    posSound.playDiscountFanfare();
    setIsEditFloatModalOpen(false);
  };

  const handleBatchDownloadOldReports = () => {
    if (zReports.length === 0) return;
    posSound.playCashChime();
    const filtered = filteredHistoricalReports;
    filtered.forEach((r, idx) => {
      setTimeout(() => {
        generateZReportPDF(r, settings);
      }, idx * 280);
    });
  };

  const handlePrintZReport = () => {
    posSound.playKeyClick();
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col gap-4 p-4 max-w-7xl mx-auto w-full overflow-hidden">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            Store Manager Daily Z-Report & Sales Reconciliation
          </h2>
          <p className="text-xs text-slate-400">
            Shift Opened: {new Date(activeShift.openedAt).toLocaleString()} • Register: {activeShift.registerId} ({activeShift.cashier})
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Switcher */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('current')}
              className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                activeTab === 'current'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Current Active Shift
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('archive')}
              className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer flex items-center gap-1 ${
                activeTab === 'archive'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              Z-Report Archive ({zReports.length})
            </button>
          </div>

          {activeTab === 'current' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadCurrentShiftPDF}
                className="bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-600/40 font-bold px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
                title="Download current shift summary as PDF with timestamp"
              >
                <Download className="w-4 h-4 text-sky-400" />
                Save Shift PDF
              </button>

              <button
                type="button"
                onClick={() => {
                  setCountedCash(shiftMetrics.expectedCash.toFixed(2));
                  setIsClosureModalOpen(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
              >
                <CheckCircle className="w-4 h-4" />
                End Day & Close Z-Report
              </button>
            </div>
          )}
        </div>
      </div>

      {activeTab === 'current' ? (
        <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden">
          {/* Shift KPI Overview Cards */}
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Net Sales</span>
                <div className="font-mono text-2xl font-black text-emerald-400 mt-1">
                  {settings.currencySymbol}{shiftMetrics.netSales.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Gross: {settings.currencySymbol}{shiftMetrics.grossSales.toFixed(2)}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">50% Off & Discounts</span>
                <div className="font-mono text-2xl font-black text-rose-400 mt-1">
                  -{settings.currencySymbol}{shiftMetrics.totalDiscounts.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Savings given to customers
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Tax Collected</span>
                <div className="font-mono text-2xl font-black text-slate-200 mt-1">
                  {settings.currencySymbol}{shiftMetrics.taxCollected.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Sales tax rate: {settings.taxRate}%
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Transactions</span>
                <div className="font-mono text-2xl font-black text-amber-400 mt-1">
                  {shiftMetrics.transactionCount}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Avg: {settings.currencySymbol}{shiftMetrics.averageBasket.toFixed(2)} • No-Sale Opens: <strong className="text-slate-300 font-mono">{activeShift.noSaleCount || 0}</strong>
                </div>
              </div>
            </div>

            {/* Cash Drawer Reconciliation Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
              <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Cash Drawer Balance Reconciliation
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-slate-400 block text-[11px]">Opening Float</span>
                    <button
                      type="button"
                      onClick={() => {
                        posSound.playKeyClick();
                        setFloatInputValue(activeShift.openingFloat.toFixed(2));
                        setIsEditFloatModalOpen(true);
                      }}
                      className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20"
                      title="Edit Shift Opening Float"
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                      Edit Float
                    </button>
                  </div>
                  <span className="font-mono text-base font-bold text-slate-200">
                    {settings.currencySymbol}{activeShift.openingFloat.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">+ Cash Sales Today</span>
                  <span className="font-mono text-base font-bold text-emerald-400">
                    +{settings.currencySymbol}{shiftMetrics.cashSales.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">= Expected Cash in Drawer</span>
                  <span className="font-mono text-base font-extrabold text-amber-400">
                    {settings.currencySymbol}{shiftMetrics.expectedCash.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Card / Contactless Total</span>
                  <span className="font-mono text-sm font-bold text-sky-400">
                    {settings.currencySymbol}{shiftMetrics.cardSales.toFixed(2)}
                  </span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Loyalty Points Redeemed</span>
                  <span className="font-mono text-sm font-bold text-amber-400">
                    {shiftMetrics.pointsRedeemed} pts ({settings.currencySymbol}{shiftMetrics.pointsDiscounts.toFixed(2)})
                  </span>
                </div>
              </div>
            </div>

            {/* Department / Category Breakdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
              <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                Cards & Gifts Department Performance
              </h3>

              {shiftMetrics.categories.length === 0 ? (
                <div className="text-xs text-slate-500 py-4 text-center">
                  No sales recorded in the current shift yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {shiftMetrics.categories.map((cat) => (
                    <div
                      key={cat.category}
                      className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-xs"
                    >
                      <div className="font-semibold text-slate-300 truncate">{cat.category}</div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                        <span>{cat.itemCount} units</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {settings.currencySymbol}{cat.revenue.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Z-Tape Preview */}
          <div className="w-full lg:w-[360px] bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-amber-400" />
                Z-Tape Thermal Preview
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDownloadCurrentShiftPDF}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-sky-300 font-semibold px-2 py-1 rounded border border-slate-700 flex items-center gap-1 cursor-pointer"
                  title="Save as PDF"
                >
                  <Download className="w-3 h-3 text-sky-400" />
                  <span>PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintZReport}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-2 py-1 rounded border border-slate-700 cursor-pointer"
                >
                  Print Tape
                </button>
              </div>
            </div>

            {/* Printable Z-Tape Canvas */}
            <div
              id="printable-receipt-area"
              className="bg-white text-black p-4 rounded-lg font-mono text-[10px] leading-tight overflow-y-auto max-h-[500px] border border-gray-300 shadow-inner"
            >
              <div className="text-center pb-2 border-b border-dashed border-gray-400">
                <div className="font-black text-sm uppercase">*** DAILY Z-REPORT ***</div>
                <div className="font-bold text-xs">{settings.storeName}</div>
                <div className="text-[9px] text-gray-600">{settings.address}</div>
                <div className="mt-1 text-[9px]">
                  Reg: {activeShift.registerId} | Cashier: {activeShift.cashier}
                </div>
                <div className="text-[9px]">
                  Date: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                </div>
              </div>

              <div className="py-2 border-b border-dashed border-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>SHIFT OPENED:</span>
                  <span>{new Date(activeShift.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                  <span>OPENING FLOAT:</span>
                  <span>{settings.currencySymbol}{activeShift.openingFloat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>TRANSACTIONS:</span>
                  <span>{shiftMetrics.transactionCount}</span>
                </div>
              </div>

              <div className="py-2 border-b border-dashed border-gray-400 space-y-1">
                <div className="font-bold text-center">FINANCIAL TOTALS</div>
                <div className="flex justify-between">
                  <span>GROSS SALES:</span>
                  <span>{settings.currencySymbol}{shiftMetrics.grossSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-700">
                  <span>50% DISCOUNTS:</span>
                  <span>-{settings.currencySymbol}{shiftMetrics.totalDiscounts.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>TAX COLLECTED:</span>
                  <span>{settings.currencySymbol}{shiftMetrics.taxCollected.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-gray-300 pt-1 text-xs">
                  <span>NET TOTAL:</span>
                  <span>{settings.currencySymbol}{shiftMetrics.netSales.toFixed(2)}</span>
                </div>
              </div>

              <div className="py-2 border-b border-dashed border-gray-400 space-y-1">
                <div className="font-bold text-center">PAYMENT TENDERS</div>
                <div className="flex justify-between">
                  <span>CASH SALES:</span>
                  <span>{settings.currencySymbol}{shiftMetrics.cashSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>CARD SALES:</span>
                  <span>{settings.currencySymbol}{shiftMetrics.cardSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>LOYALTY DISCOUNT:</span>
                  <span>{settings.currencySymbol}{shiftMetrics.pointsDiscounts.toFixed(2)}</span>
                </div>
              </div>

              <div className="py-2 border-b border-dashed border-gray-400 space-y-1">
                <div className="font-bold text-center">DRAWER RECONCILIATION</div>
                <div className="flex justify-between">
                  <span>EXPECTED CASH:</span>
                  <span>{settings.currencySymbol}{shiftMetrics.expectedCash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>COUNTED CASH:</span>
                  <span>{settings.currencySymbol}{shiftMetrics.countedCash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>OVER / SHORT:</span>
                  <span>{shiftMetrics.overShort >= 0 ? '+' : ''}{settings.currencySymbol}{shiftMetrics.overShort.toFixed(2)}</span>
                </div>
              </div>

              {shiftMetrics.categories.length > 0 && (
                <div className="py-2 border-b border-dashed border-gray-400 space-y-0.5">
                  <div className="font-bold text-center mb-1">DEPT REVENUE</div>
                  {shiftMetrics.categories.map((c) => (
                    <div key={c.category} className="flex justify-between text-[9px]">
                      <span className="truncate pr-1">{c.category} ({c.itemCount}):</span>
                      <span>{settings.currencySymbol}{c.revenue.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 text-center text-[9px] text-gray-600">
                End of Day Z-Tape • Keep for Store Accounting
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ARCHIVE TAB */
        <div className="flex-1 flex flex-col gap-3 overflow-hidden">
          {/* Archive Search & Batch Export Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search old saved Z-reports by report #, date, or cashier..."
                value={archiveSearch}
                onChange={(e) => setArchiveSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={zReports.length === 0}
                onClick={handleBatchDownloadOldReports}
                className="bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
                title="Download all saved Z-reports in PDF format with date & time"
              >
                <Download className="w-4 h-4" />
                <span>Download All Old Z-Reports (PDF)</span>
              </button>
            </div>
          </div>

          {/* Archive Table */}
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <th className="py-3 px-4">Report #</th>
                    <th className="py-3 px-3">Date & Time Closed</th>
                    <th className="py-3 px-3">Register / Cashier</th>
                    <th className="py-3 px-3 text-right">Net Sales</th>
                    <th className="py-3 px-3 text-right">50% Off & Disc.</th>
                    <th className="py-3 px-3 text-right">Tax</th>
                    <th className="py-3 px-3 text-right">Expected Cash</th>
                    <th className="py-3 px-3 text-right">Counted Cash</th>
                    <th className="py-3 px-3 text-right">Over/Short</th>
                    <th className="py-3 px-3 text-center">Tx Count</th>
                    <th className="py-3 px-4 text-right">PDF & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredHistoricalReports.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-500">
                        {zReports.length === 0
                          ? 'No archived Z-reports yet. When you click "End Day & Close Z-Report", closed daily reports will appear here.'
                          : 'No reports matched your search query.'}
                      </td>
                    </tr>
                  ) : (
                    filteredHistoricalReports.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-850/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-amber-400">
                          {r.reportNumber}
                        </td>
                        <td className="py-3 px-3 text-slate-300 font-mono text-[11px]">
                          <div>{new Date(r.closedAt).toLocaleDateString()}</div>
                          <div className="text-[10px] text-slate-500">
                            {new Date(r.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-400">
                          {r.registerId} ({r.cashier})
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                          {settings.currencySymbol}{r.netSales.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-rose-400">
                          -{settings.currencySymbol}{r.totalDiscounts.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-300">
                          {settings.currencySymbol}{r.taxCollected.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-300">
                          {settings.currencySymbol}{r.expectedCashInDrawer.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-200 font-semibold">
                          {settings.currencySymbol}{r.actualCashCounted.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold">
                          <span
                            className={
                              r.overShort === 0
                                ? 'text-slate-400'
                                : r.overShort > 0
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                            }
                          >
                            {r.overShort >= 0 ? '+' : ''}{settings.currencySymbol}{r.overShort.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-300">
                          {r.transactionCount}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Download PDF button */}
                            <button
                              type="button"
                              onClick={() => {
                                posSound.playKeyClick();
                                generateZReportPDF(r, settings);
                              }}
                              className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition shadow cursor-pointer"
                              title="Download old Z-report in PDF format with date & time"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>PDF</span>
                            </button>

                            {/* View Tape modal button */}
                            <button
                              type="button"
                              onClick={() => {
                                posSound.playKeyClick();
                                setSelectedHistoricalReport(r);
                              }}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2 py-1.5 rounded-lg flex items-center gap-1 transition border border-slate-700 cursor-pointer"
                              title="Preview old Z-tape"
                            >
                              <Eye className="w-3.5 h-3.5 text-amber-400" />
                              <span className="hidden sm:inline">Tape</span>
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
        </div>
      )}

      {/* Modal 1: Edit Opening Float Modal */}
      {isEditFloatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                Edit Opening Cash Float
              </h3>
              <button
                type="button"
                onClick={() => setIsEditFloatModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Adjust the starting cash float for register <strong>{activeShift.registerId}</strong>. This immediately updates the expected drawer balance and over/short calculation.
            </p>

            <form onSubmit={handleSaveOpeningFloat} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Starting Cash Float Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-mono text-slate-500 font-bold text-lg">
                    {settings.currencySymbol}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={floatInputValue}
                    onChange={(e) => setFloatInputValue(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-4 py-2 font-mono text-xl font-bold text-slate-100 focus:outline-none focus:border-amber-500"
                    autoFocus
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <span className="text-[10px] text-slate-500 font-semibold uppercase block mb-1.5">
                  Quick Amount Presets
                </span>
                <div className="grid grid-cols-4 gap-1.5 text-xs font-mono">
                  {[50, 100, 150, 200].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setFloatInputValue(amt.toFixed(2))}
                      className="py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded border border-slate-700 cursor-pointer font-bold text-center"
                    >
                      {settings.currencySymbol}{amt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditFloatModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition cursor-pointer shadow-md"
                >
                  Save Float
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Historical Saved Z-Report Full Preview & PDF Modal */}
      {selectedHistoricalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col my-auto max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/70">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-slate-100 text-sm">
                  Historical Z-Report: {selectedHistoricalReport.reportNumber}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHistoricalReport(null)}
                className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-950 overflow-y-auto flex-1">
              {/* Thermal Tape Rendering */}
              <div className="bg-white text-black p-4 rounded-lg font-mono text-[10px] leading-tight border border-gray-300 shadow-inner">
                <div className="text-center pb-2 border-b border-dashed border-gray-400">
                  <div className="font-black text-sm uppercase">*** SAVED Z-REPORT ***</div>
                  <div className="font-bold text-xs">{settings.storeName}</div>
                  <div className="text-[9px] text-gray-600">{settings.address}</div>
                  <div className="mt-1 text-[9px]">
                    Report #: {selectedHistoricalReport.reportNumber}
                  </div>
                  <div className="text-[9px]">
                    Closed: {new Date(selectedHistoricalReport.closedAt).toLocaleString()}
                  </div>
                  <div className="text-[9px]">
                    Register: {selectedHistoricalReport.registerId} | Cashier: {selectedHistoricalReport.cashier}
                  </div>
                </div>

                <div className="py-2 border-b border-dashed border-gray-400 space-y-1">
                  <div className="flex justify-between">
                    <span>OPENING FLOAT:</span>
                    <span>{settings.currencySymbol}{selectedHistoricalReport.openingFloat.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TRANSACTIONS:</span>
                    <span>{selectedHistoricalReport.transactionCount}</span>
                  </div>
                </div>

                <div className="py-2 border-b border-dashed border-gray-400 space-y-1">
                  <div className="font-bold text-center">FINANCIAL TOTALS</div>
                  <div className="flex justify-between">
                    <span>GROSS SALES:</span>
                    <span>{settings.currencySymbol}{selectedHistoricalReport.grossSales.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-red-700">
                    <span>50% DISCOUNTS:</span>
                    <span>-{settings.currencySymbol}{selectedHistoricalReport.totalDiscounts.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TAX COLLECTED:</span>
                    <span>{settings.currencySymbol}{selectedHistoricalReport.taxCollected.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-gray-300 pt-1 text-xs">
                    <span>NET TOTAL:</span>
                    <span>{settings.currencySymbol}{selectedHistoricalReport.netSales.toFixed(2)}</span>
                  </div>
                </div>

                <div className="py-2 border-b border-dashed border-gray-400 space-y-1">
                  <div className="font-bold text-center">PAYMENT TENDERS</div>
                  <div className="flex justify-between">
                    <span>CASH SALES:</span>
                    <span>{settings.currencySymbol}{selectedHistoricalReport.cashSales.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CARD SALES:</span>
                    <span>{settings.currencySymbol}{selectedHistoricalReport.cardSales.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>LOYALTY DISCOUNT:</span>
                    <span>{settings.currencySymbol}{selectedHistoricalReport.pointsDiscounts.toFixed(2)}</span>
                  </div>
                </div>

                <div className="py-2 border-b border-dashed border-gray-400 space-y-1">
                  <div className="font-bold text-center">DRAWER AUDIT</div>
                  <div className="flex justify-between">
                    <span>EXPECTED CASH:</span>
                    <span>{settings.currencySymbol}{selectedHistoricalReport.expectedCashInDrawer.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>COUNTED CASH:</span>
                    <span>{settings.currencySymbol}{selectedHistoricalReport.actualCashCounted.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>OVER / SHORT:</span>
                    <span>{selectedHistoricalReport.overShort >= 0 ? '+' : ''}{settings.currencySymbol}{selectedHistoricalReport.overShort.toFixed(2)}</span>
                  </div>
                </div>

                <div className="pt-2 text-center text-[9px] text-gray-500">
                  Archived Audit Record • Cards & Gifts POS
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedHistoricalReport(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 text-xs hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  posSound.playKeyClick();
                  generateZReportPDF(selectedHistoricalReport, settings);
                }}
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF (Date & Time)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: End Day Closure Reconciliation Modal */}
      {isClosureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                End of Day Shift Close & Z-Report
              </h3>
            </div>

            <p className="text-xs text-slate-400">
              Count the physical cash in your drawer to finalize the day's books. This will close the register shift and print the official Z-Tape.
            </p>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Opening Float:</span>
                <span className="font-mono text-slate-200">
                  {settings.currencySymbol}{activeShift.openingFloat.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Cash Sales Recorded:</span>
                <span className="font-mono text-emerald-400">
                  +{settings.currencySymbol}{shiftMetrics.cashSales.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-slate-200 pt-1 border-t border-slate-800">
                <span>Expected Cash Total:</span>
                <span className="font-mono text-amber-400 text-sm">
                  {settings.currencySymbol}{shiftMetrics.expectedCash.toFixed(2)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Actual Physical Cash Counted in Drawer *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-mono text-slate-500 font-bold">
                  {settings.currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={countedCash}
                  onChange={(e) => setCountedCash(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-4 py-2 font-mono text-lg font-bold text-slate-100 focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-slate-400">Over / Short Variance:</span>
                <span
                  className={`font-mono font-bold ${
                    shiftMetrics.overShort === 0
                      ? 'text-slate-400'
                      : shiftMetrics.overShort > 0
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  {shiftMetrics.overShort >= 0 ? '+' : ''}{settings.currencySymbol}{shiftMetrics.overShort.toFixed(2)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Manager Shift Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Busy holiday weekend cards rush, drawer balanced perfectly."
                value={managerNotes}
                onChange={(e) => setManagerNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsClosureModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFinalizeZReport}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer shadow-md"
              >
                Confirm & Close Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
