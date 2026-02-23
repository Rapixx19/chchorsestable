/**
 * @module invoices/services
 * @description PDF generation service for invoices
 * @safety RED
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { createClient } from '@/infra/supabase/server';

interface InvoiceWithJoins {
  id: string;
  client_id: string;
  stable_id: string;
  billing_period_id: string;
  subtotal_cents: number;
  total_cents: number;
  status: string;
  created_at: string;
  clients: { name: string };
  stables: { name: string };
}

interface InvoiceLine {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export async function generateInvoicePdf(invoiceId: string): Promise<Uint8Array> {
  const supabase = await createClient();

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select(`
      *,
      clients!inner(name),
      stables!inner(name)
    `)
    .eq('id', invoiceId)
    .single();

  if (invoiceError || !invoice) {
    throw new Error(invoiceError?.message ?? 'Invoice not found');
  }

  const typedInvoice = invoice as unknown as InvoiceWithJoins;

  const { data: lines, error: linesError } = await supabase
    .from('invoice_lines')
    .select('*')
    .eq('invoice_id', invoiceId);

  if (linesError) {
    throw new Error(linesError.message);
  }

  const typedLines = (lines ?? []) as InvoiceLine[];

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { height } = page.getSize();
  const margin = 50;
  let y = height - margin;

  // Header: Stable name
  page.drawText(typedInvoice.stables.name, {
    x: margin,
    y,
    size: 20,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  y -= 25;

  page.drawText('Invoice', {
    x: margin,
    y,
    size: 16,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 40;

  // Client info
  page.drawText(`Client: ${typedInvoice.clients.name}`, {
    x: margin,
    y,
    size: 12,
    font,
    color: rgb(0, 0, 0),
  });
  y -= 18;

  page.drawText(`Period: ${typedInvoice.billing_period_id.slice(0, 8)}...`, {
    x: margin,
    y,
    size: 12,
    font,
    color: rgb(0, 0, 0),
  });
  y -= 18;

  const createdDate = new Date(typedInvoice.created_at).toLocaleDateString();
  page.drawText(`Date: ${createdDate}`, {
    x: margin,
    y,
    size: 12,
    font,
    color: rgb(0, 0, 0),
  });
  y -= 40;

  // Table header
  const colX = {
    description: margin,
    qty: 300,
    unitPrice: 380,
    total: 480,
  };

  page.drawText('Description', { x: colX.description, y, size: 11, font: fontBold });
  page.drawText('Qty', { x: colX.qty, y, size: 11, font: fontBold });
  page.drawText('Unit Price', { x: colX.unitPrice, y, size: 11, font: fontBold });
  page.drawText('Total', { x: colX.total, y, size: 11, font: fontBold });
  y -= 5;

  // Divider line
  page.drawLine({
    start: { x: margin, y },
    end: { x: 545, y },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  y -= 18;

  // Table rows
  for (const line of typedLines) {
    const description =
      line.description.length > 35
        ? line.description.slice(0, 35) + '...'
        : line.description;

    page.drawText(description, { x: colX.description, y, size: 10, font });
    page.drawText(String(line.quantity), { x: colX.qty, y, size: 10, font });
    page.drawText(formatCents(line.unit_price_cents), { x: colX.unitPrice, y, size: 10, font });
    page.drawText(formatCents(line.line_total_cents), { x: colX.total, y, size: 10, font });
    y -= 18;

    if (y < 100) {
      break; // Prevent overflow, could add pagination in future
    }
  }

  // Footer divider
  y -= 10;
  page.drawLine({
    start: { x: margin, y },
    end: { x: 545, y },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  y -= 20;

  // Subtotal
  page.drawText('Subtotal:', { x: colX.unitPrice, y, size: 11, font });
  page.drawText(formatCents(typedInvoice.subtotal_cents), { x: colX.total, y, size: 11, font });
  y -= 18;

  // Total
  page.drawText('Total:', { x: colX.unitPrice, y, size: 12, font: fontBold });
  page.drawText(formatCents(typedInvoice.total_cents), { x: colX.total, y, size: 12, font: fontBold });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
