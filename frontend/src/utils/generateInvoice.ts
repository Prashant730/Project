import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Colours
const INK   = [35, 36, 31]   as [number,number,number];
const PAPER = [247, 245, 240] as [number,number,number];
const RULE  = [216, 211, 196] as [number,number,number];
const TERRA = [179, 74, 43]   as [number,number,number];
const MUTED = [122, 118, 105] as [number,number,number];

export function generateInvoice(challan: any) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const PAGE_W = 210;
  const PAGE_H = 297;
  const MARGIN = 18;

  // ── Background ──────────────────────────────────────────────────────────
  doc.setFillColor(...PAPER);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

  // ── Header bar ──────────────────────────────────────────────────────────
  doc.setFillColor(...INK);
  doc.rect(0, 0, PAGE_W, 34, 'F');

  // Wordmark
  doc.setFont('courier', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...PAPER);
  doc.text('MINI ERP', MARGIN, 15);

  // "TAX INVOICE" label
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...[200, 195, 185] as [number,number,number]);
  doc.text('TAX INVOICE', MARGIN, 22);

  // Challan number (right-aligned)
  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PAPER);
  doc.text(challan.challanNumber, PAGE_W - MARGIN, 15, { align: 'right' });

  // Date
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...[200, 195, 185] as [number,number,number]);
  doc.text(
    `Date: ${new Date(challan.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
    PAGE_W - MARGIN, 22, { align: 'right' }
  );

  // ── From / To blocks ────────────────────────────────────────────────────
  let y = 46;

  // Label row
  doc.setFont('courier', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...MUTED);
  doc.text('FROM', MARGIN, y);
  doc.text('BILL TO', PAGE_W / 2 + 2, y);

  y += 5;
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, PAGE_W / 2 - 6, y);
  doc.line(PAGE_W / 2 + 2, y, PAGE_W - MARGIN, y);

  y += 5;
  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text('Mini ERP Pvt. Ltd.', MARGIN, y);
  doc.text(challan.customer?.name || '—', PAGE_W / 2 + 2, y);

  y += 5;
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text(['42 Business Park,', 'Mumbai, Maharashtra 400001', 'GSTIN: 27MINIERP000A1Z5'], MARGIN, y, { lineHeightFactor: 1.6 });

  const customerLines = [];
  if (challan.customer?.businessName) customerLines.push(challan.customer.businessName);
  if (challan.customer?.address) customerLines.push(challan.customer.address);
  if (challan.customer?.gstNumber) customerLines.push(`GSTIN: ${challan.customer.gstNumber}`);
  if (challan.customer?.mobile) customerLines.push(`Mob: ${challan.customer.mobile}`);
  if (customerLines.length) doc.text(customerLines, PAGE_W / 2 + 2, y, { lineHeightFactor: 1.6 });

  // ── Line items table ─────────────────────────────────────────────────────
  y = 88;

  const tableBody = (challan.items || []).map((item: any, i: number) => [
    String(i + 1),
    item.productNameSnapshot,
    item.productSkuSnapshot,
    item.quantity,
    `₹${Number(item.unitPriceSnapshot).toFixed(2)}`,
    `₹${Number(item.subtotal).toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [['#', 'Product', 'SKU', 'Qty', 'Unit Price', 'Subtotal']],
    body: tableBody,
    styles: {
      font: 'courier',
      fontSize: 8,
      cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
      textColor: INK,
      fillColor: PAPER,
      lineColor: RULE,
      lineWidth: 0.25,
    },
    headStyles: {
      fillColor: INK,
      textColor: PAPER,
      fontSize: 6.5,
      fontStyle: 'bold',
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 8,  halign: 'center' },
      1: { cellWidth: 60 },
      2: { cellWidth: 32, font: 'courier' },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: { fillColor: [243, 241, 237] as [number,number,number] },
  });

  const afterTable = (doc as any).lastAutoTable.finalY + 8;

  // ── Totals block ─────────────────────────────────────────────────────────
  const grandTotal = (challan.items || []).reduce((s: number, i: any) => s + Number(i.subtotal), 0);
  const totalQty   = (challan.items || []).reduce((s: number, i: any) => s + Number(i.quantity), 0);

  const totX = PAGE_W - MARGIN;
  let totY = afterTable;

  // Subtotal row
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(`Total Qty: ${totalQty} units`, MARGIN, totY);
  doc.text('Subtotal:', totX - 30, totY, { align: 'right' });
  doc.setTextColor(...INK);
  doc.text(`₹${grandTotal.toFixed(2)}`, totX, totY, { align: 'right' });

  totY += 5;
  doc.setTextColor(...MUTED);
  doc.text('Tax (GST):', totX - 30, totY, { align: 'right' });
  doc.text('as applicable', totX, totY, { align: 'right' });

  // Grand Total highlighted bar
  totY += 3;
  doc.setFillColor(...TERRA);
  doc.rect(PAGE_W / 2, totY, PAGE_W / 2 - MARGIN, 9, 'F');

  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...PAPER);
  doc.text('GRAND TOTAL', totX - 30, totY + 6, { align: 'right' });
  doc.text(`₹${grandTotal.toFixed(2)}`, totX, totY + 6, { align: 'right' });

  // ── Footer ────────────────────────────────────────────────────────────────
  const footY = PAGE_H - 18;
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, footY - 4, PAGE_W - MARGIN, footY - 4);

  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text('Thank you for your business.', MARGIN, footY);
  doc.text(
    `Generated: ${new Date().toLocaleString('en-IN')} — Mini ERP`,
    PAGE_W - MARGIN, footY, { align: 'right' }
  );

  // Challan number watermark (light diagonal)
  doc.setFont('courier', 'normal');
  doc.setFontSize(42);
  doc.setTextColor(220, 215, 205);
  doc.text(challan.challanNumber, PAGE_W / 2, PAGE_H / 2 + 20, {
    align: 'center',
    angle: 30,
  });

  doc.save(`invoice-${challan.challanNumber}.pdf`);
}
