import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Colours
const INK   = [35, 36, 31]   as [number,number,number];
const PAPER = [247, 245, 240] as [number,number,number];
const RULE  = [216, 211, 196] as [number,number,number];
const TERRA = [179, 74, 43]   as [number,number,number];
const MUTED = [122, 118, 105] as [number,number,number];
const GREEN = [45, 106, 79]   as [number,number,number];

export function generateInvoice(challan: any, company?: any) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const PAGE_W = 210;
  const PAGE_H = 297;
  const MARGIN = 18;

  // Company defaults fallback
  const companyName    = company?.name    || 'Mini ERP Pvt. Ltd.';
  const companyAddress = company?.address || '42 Business Park, Mumbai, Maharashtra 400001';
  const companyGST     = company?.gstNumber || '';
  const companyPhone   = company?.phone   || '';
  const companyEmail   = company?.email   || '';

  // ── Computed totals ──────────────────────────────────────────────────────
  const subtotal   = (challan.items || []).reduce((s: number, i: any) => s + Number(i.subtotal), 0);
  const taxRate    = Number(challan.taxRate) || 0;
  const discount   = Number(challan.discount) || 0;
  const taxAmount  = subtotal * (taxRate / 100);
  const grandTotal = Math.max(0, subtotal + taxAmount - discount);
  const amountPaid = Number(challan.amountPaid) || 0;
  const balanceDue = Math.max(0, grandTotal - amountPaid);
  const totalQty   = (challan.items || []).reduce((s: number, i: any) => s + Number(i.quantity), 0);

  // ── Background ──────────────────────────────────────────────────────────
  doc.setFillColor(...PAPER);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

  // ── Header bar ──────────────────────────────────────────────────────────
  doc.setFillColor(...INK);
  doc.rect(0, 0, PAGE_W, 34, 'F');

  // Wordmark (company name)
  doc.setFont('courier', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...PAPER);
  doc.text(companyName.toUpperCase(), MARGIN, 14);

  // "TAX INVOICE" label
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...[200, 195, 185] as [number,number,number]);
  doc.text('TAX INVOICE', MARGIN, 21);

  // Phone/Email (left)
  const contactLine = [companyPhone, companyEmail].filter(Boolean).join('  |  ');
  if (contactLine) {
    doc.setFontSize(6);
    doc.text(contactLine, MARGIN, 27);
  }

  // Challan number (right-aligned)
  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PAPER);
  doc.text(challan.challanNumber, PAGE_W - MARGIN, 14, { align: 'right' });

  // Date
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...[200, 195, 185] as [number,number,number]);
  doc.text(
    `Date: ${new Date(challan.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
    PAGE_W - MARGIN, 21, { align: 'right' }
  );

  // ── From / To blocks ────────────────────────────────────────────────────
  let y = 44;

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
  doc.text(companyName, MARGIN, y);
  doc.text(challan.customer?.name || '—', PAGE_W / 2 + 2, y);

  y += 5;
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);

  // FROM address lines
  const fromLines: string[] = [];
  if (companyAddress) {
    // Split address at commas for wrapping
    companyAddress.split(',').forEach((part: string) => { if(part.trim()) fromLines.push(part.trim()); });
  }
  if (companyGST) fromLines.push(`GSTIN: ${companyGST}`);
  if (fromLines.length) doc.text(fromLines, MARGIN, y, { lineHeightFactor: 1.6 });

  // BILL TO lines
  const customerLines: string[] = [];
  if (challan.customer?.businessName) customerLines.push(challan.customer.businessName);
  if (challan.customer?.address) customerLines.push(challan.customer.address);
  if (challan.customer?.gstNumber) customerLines.push(`GSTIN: ${challan.customer.gstNumber}`);
  if (challan.customer?.mobile) customerLines.push(`Mob: ${challan.customer.mobile}`);
  if (customerLines.length) doc.text(customerLines, PAGE_W / 2 + 2, y, { lineHeightFactor: 1.6 });

  // ── Line items table ─────────────────────────────────────────────────────
  y = 90;

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
  const totX = PAGE_W - MARGIN;
  let totY = afterTable;

  const printRow = (label: string, value: string, bold = false, color: [number,number,number] = INK) => {
    doc.setFont('courier', bold ? 'bold' : 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(label, totX - 30, totY, { align: 'right' });
    doc.setTextColor(...color);
    doc.text(value, totX, totY, { align: 'right' });
    totY += 5;
  };

  // Total Qty (left side)
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text(`Total Qty: ${totalQty} units`, MARGIN, totY);

  printRow('Subtotal:', `₹${subtotal.toFixed(2)}`);
  if (taxRate > 0) printRow(`Tax (GST ${taxRate}%):`, `₹${taxAmount.toFixed(2)}`);
  if (discount > 0) printRow('Discount:', `- ₹${discount.toFixed(2)}`, false, TERRA);

  // Divider line before grand total
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.3);
  doc.line(PAGE_W / 2, totY - 2, PAGE_W - MARGIN, totY - 2);

  // Grand Total highlighted bar
  doc.setFillColor(...TERRA);
  doc.rect(PAGE_W / 2, totY, PAGE_W / 2 - MARGIN, 9, 'F');

  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...PAPER);
  doc.text('GRAND TOTAL', totX - 30, totY + 6, { align: 'right' });
  doc.text(`₹${grandTotal.toFixed(2)}`, totX, totY + 6, { align: 'right' });
  totY += 12;

  // Amount Paid / Balance Due
  if (amountPaid > 0 || balanceDue > 0) {
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text('Amount Paid:', totX - 30, totY, { align: 'right' });
    doc.setTextColor(...GREEN);
    doc.text(`₹${amountPaid.toFixed(2)}`, totX, totY, { align: 'right' });
    totY += 5;

    doc.setTextColor(...MUTED);
    doc.text('Balance Due:', totX - 30, totY, { align: 'right' });
    const dueColor = balanceDue > 0 ? TERRA : GREEN;
    doc.setFont('courier', 'bold');
    doc.setTextColor(...dueColor);
    doc.text(`₹${balanceDue.toFixed(2)}`, totX, totY, { align: 'right' });
    totY += 5;
  }

  // ── Payment Status stamp ────────────────────────────────────────────────
  const payStatus = challan.paymentStatus || 'UNPAID';
  if (payStatus === 'PAID') {
    doc.setFont('courier', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(...GREEN);
    doc.text('PAID', MARGIN + 5, totY - 10, { angle: -15 });
  } else if (payStatus === 'PARTIAL') {
    doc.setFont('courier', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(201, 184, 150);
    doc.text('PARTIAL', MARGIN + 5, totY - 10, { angle: -15 });
  }

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
    `Generated: ${new Date().toLocaleString('en-IN')} — ${companyName}`,
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
