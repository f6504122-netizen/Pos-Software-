import { jsPDF } from 'jspdf';
import { ZReport, StoreSettings } from '../types/pos';

export function generateZReportPDF(report: ZReport, settings: StoreSettings): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 16;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(245, 158, 11); // amber-500
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(settings.storeName.toUpperCase(), margin, 12);

  doc.setTextColor(203, 213, 225); // slate-300
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(settings.tagline, margin, 18);
  doc.text(`${settings.address}  |  Tel: ${settings.phone}  |  Tax ID: ${settings.taxNumber}`, margin, 23);

  // Document Title & Timestamp
  y = 36;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('OFFICIAL DAILY Z-REPORT (END OF DAY SHIFT CLOSEOUT)', margin, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const generatedTimeStr = new Date().toLocaleString();
  doc.text(`Generated on: ${generatedTimeStr}  |  Report #: ${report.reportNumber}`, margin, y);

  // Meta Box
  y += 5;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 20, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  const col1 = margin + 4;
  const col2 = margin + 55;
  const col3 = margin + 115;

  doc.text(`Register ID: ${report.registerId}`, col1, y + 6);
  doc.text(`Cashier / Manager: ${report.cashier}`, col1, y + 13);

  doc.text(`Shift Opened: ${new Date(report.openedAt).toLocaleString()}`, col2, y + 6);
  doc.text(`Shift Closed: ${new Date(report.closedAt).toLocaleString()}`, col2, y + 13);

  doc.text(`Total Transactions: ${report.transactionCount}`, col3, y + 6);
  doc.text(`Report Date: ${report.date}`, col3, y + 13);

  y += 26;

  // Helper function to draw section title
  const drawSectionHeader = (title: string, currentY: number) => {
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, currentY, pageWidth - margin * 2, 6.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(title, margin + 3, currentY + 4.5);
    return currentY + 10;
  };

  // Helper function for row
  const drawRow = (label: string, value: string, currentY: number, isBold: boolean = false, textColor: [number, number, number] = [30, 41, 59]) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(label, margin + 4, currentY);

    doc.setTextColor(...textColor);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.text(value, pageWidth - margin - 4, currentY, { align: 'right' });
    doc.setDrawColor(241, 245, 249);
    doc.line(margin + 4, currentY + 1.5, pageWidth - margin - 4, currentY + 1.5);
    return currentY + 5.5;
  };

  // 1. FINANCIAL TOTALS
  y = drawSectionHeader('1. FINANCIAL SALES TOTALS', y);
  y = drawRow('Gross Sales (Before Discounts):', `${settings.currencySymbol}${report.grossSales.toFixed(2)}`, y);
  y = drawRow('Discounts & 50% Off Promo Applied:', `-${settings.currencySymbol}${report.totalDiscounts.toFixed(2)}`, y, false, [225, 29, 72]);
  y = drawRow('Tax Collected (Sales Tax):', `${settings.currencySymbol}${report.taxCollected.toFixed(2)}`, y);
  y = drawRow('NET TOTAL SALES:', `${settings.currencySymbol}${report.netSales.toFixed(2)}`, y, true, [16, 149, 106]);

  y += 3;

  // 2. PAYMENT TENDER BREAKDOWN
  y = drawSectionHeader('2. PAYMENT TENDER BREAKDOWN', y);
  y = drawRow('Cash Sales:', `${settings.currencySymbol}${report.cashSales.toFixed(2)}`, y);
  y = drawRow('Credit / Debit Card Sales:', `${settings.currencySymbol}${report.cardSales.toFixed(2)}`, y);
  y = drawRow('Customer Loyalty Points Redemptions:', `${settings.currencySymbol}${report.pointsDiscounts.toFixed(2)}`, y);

  y += 3;

  // 3. CASH DRAWER AUDIT & RECONCILIATION
  y = drawSectionHeader('3. CASH DRAWER AUDIT & RECONCILIATION', y);
  y = drawRow('Opening Cash Float:', `${settings.currencySymbol}${report.openingFloat.toFixed(2)}`, y);
  y = drawRow('+ Cash Sales Today:', `+${settings.currencySymbol}${report.cashSales.toFixed(2)}`, y);
  y = drawRow('EXPECTED CASH IN DRAWER:', `${settings.currencySymbol}${report.expectedCashInDrawer.toFixed(2)}`, y, true);
  y = drawRow('ACTUAL COUNTED CASH:', `${settings.currencySymbol}${report.actualCashCounted.toFixed(2)}`, y, true);

  const isExact = report.overShort === 0;
  const isOver = report.overShort > 0;
  const overShortColor: [number, number, number] = isExact ? [71, 85, 105] : isOver ? [16, 149, 106] : [225, 29, 72];
  const overShortText = isExact
    ? `${settings.currencySymbol}0.00 (Balanced)`
    : `${isOver ? '+' : ''}${settings.currencySymbol}${report.overShort.toFixed(2)} (${isOver ? 'OVER' : 'SHORT'})`;

  y = drawRow('DRAWER VARIANCE (OVER / SHORT):', overShortText, y, true, overShortColor);

  y += 3;

  // 4. DEPARTMENT BREAKDOWN
  if (report.categories && report.categories.length > 0) {
    y = drawSectionHeader('4. DEPARTMENT & CATEGORY SALES BREAKDOWN', y);
    report.categories.forEach((cat) => {
      y = drawRow(`${cat.category} (${cat.itemCount} items sold):`, `${settings.currencySymbol}${cat.revenue.toFixed(2)}`, y);
    });
    y += 3;
  }

  // 5. LOYALTY REWARDS AUDIT
  y = drawSectionHeader('5. CUSTOMER LOYALTY PROGRAM METRICS', y);
  y = drawRow('Loyalty Points Issued to Shoppers Today:', `+${report.pointsIssued} points`, y);
  y = drawRow('Loyalty Points Redeemed Today:', `-${report.pointsRedeemed} points`, y);

  // Notes if any
  if (report.notes) {
    y += 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text('Manager Shift Notes:', margin, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(report.notes, margin, y, { maxWidth: pageWidth - margin * 2 });
    y += 8;
  }

  // Signatures Area
  y = Math.max(y + 8, 250);
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, margin + 70, y);
  doc.line(pageWidth - margin - 70, y, pageWidth - margin, y);

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Store Manager Signature', margin, y + 4);
  doc.text('Audited Date & Time Stamp', pageWidth - margin - 70, y + 4);

  // Generate clean timestamp for filename: YYYY-MM-DD_HH-mm-ss
  const now = new Date(report.closedAt || Date.now());
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-');
  const filename = `Z-Report_${report.reportNumber}_${dateStr}_${timeStr}.pdf`;

  // Save the PDF
  doc.save(filename);
}
