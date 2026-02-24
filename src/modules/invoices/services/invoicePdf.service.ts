/**
 * @module invoices/services
 * @description PDF generation service for invoices
 * @safety RED
 */

import { PDFDocument, StandardFonts, rgb, PDFImage, PDFFont } from 'pdf-lib';
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
  stables: {
    name: string;
    logo_url?: string;
    bank_name?: string;
    account_number?: string;
    iban?: string;
    invoice_default_terms?: string;
  };
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

function truncateText(text: string, font: PDFFont, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) {
    return text;
  }

  let truncated = text;
  while (truncated.length > 0 && font.widthOfTextAtSize(truncated + '...', size) > maxWidth) {
    truncated = truncated.slice(0, -1);
  }

  return truncated.length > 0 ? truncated + '...' : text.slice(0, 3) + '...';
}

export async function generateInvoicePdf(invoiceId: string): Promise<Uint8Array> {
  const supabase = await createClient();

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select(`
      *,
      clients!inner(name),
      stables!inner(name, logo_url, bank_name, account_number, iban, invoice_default_terms)
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

  const typedLines = (lines ?? []) as unknown as InvoiceLine[];

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { height } = page.getSize();
  const margin = 50;
  const pageWidth = 545;
  let y = height - margin;

  // Load logo if available
  let logoImage: PDFImage | null = null;
  if (typedInvoice.stables.logo_url) {
    try {
      const response = await fetch(typedInvoice.stables.logo_url);
      if (response.ok) {
        const imageBuffer = await response.arrayBuffer();
        if (typedInvoice.stables.logo_url.toLowerCase().endsWith('.png')) {
          logoImage = await pdfDoc.embedPng(imageBuffer);
        } else {
          logoImage = await pdfDoc.embedJpg(imageBuffer);
        }
      }
    } catch (err) {
      console.warn('Failed to load logo, continuing without it:', err);
    }
  }

  // Header: Logo (left) + Stable name & bank details (right)
  const logoSize = 60;
  if (logoImage) {
    const logoDims = logoImage.scale(logoSize / Math.max(logoImage.width, logoImage.height));
    page.drawImage(logoImage, {
      x: margin,
      y: y - logoDims.height,
      width: logoDims.width,
      height: logoDims.height,
    });
  }

  // Stable name (right-aligned, with truncation for long names)
  const maxHeaderWidth = pageWidth - margin - logoSize - 20; // Leave buffer between logo and text
  const stableName = truncateText(typedInvoice.stables.name, fontBold, 16, maxHeaderWidth);
  const stableNameWidth = fontBold.widthOfTextAtSize(stableName, 16);
  page.drawText(stableName, {
    x: pageWidth - stableNameWidth,
    y,
    size: 16,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // Bank details (right-aligned, below stable name, with truncation)
  let bankY = y - 16;
  const bankColor = rgb(0.4, 0.4, 0.4);
  const bankSize = 10;

  if (typedInvoice.stables.bank_name) {
    const bankText = truncateText(`Bank: ${typedInvoice.stables.bank_name}`, font, bankSize, maxHeaderWidth);
    const bankTextWidth = font.widthOfTextAtSize(bankText, bankSize);
    page.drawText(bankText, {
      x: pageWidth - bankTextWidth,
      y: bankY,
      size: bankSize,
      font,
      color: bankColor,
    });
    bankY -= 12;
  }

  if (typedInvoice.stables.account_number) {
    const accountText = truncateText(`Account: ${typedInvoice.stables.account_number}`, font, bankSize, maxHeaderWidth);
    const accountTextWidth = font.widthOfTextAtSize(accountText, bankSize);
    page.drawText(accountText, {
      x: pageWidth - accountTextWidth,
      y: bankY,
      size: bankSize,
      font,
      color: bankColor,
    });
    bankY -= 12;
  }

  if (typedInvoice.stables.iban) {
    const ibanText = truncateText(`IBAN: ${typedInvoice.stables.iban}`, font, bankSize, maxHeaderWidth);
    const ibanTextWidth = font.widthOfTextAtSize(ibanText, bankSize);
    page.drawText(ibanText, {
      x: pageWidth - ibanTextWidth,
      y: bankY,
      size: bankSize,
      font,
      color: bankColor,
    });
  }

  // Gold divider line below header
  y -= logoSize + 10;
  page.drawLine({
    start: { x: margin, y },
    end: { x: pageWidth, y },
    thickness: 2,
    color: rgb(0.831, 0.686, 0.216), // #D4AF37 gold
  });
  y -= 25;

  // Invoice label
  page.drawText('Invoice', {
    x: margin,
    y,
    size: 16,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 30;

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

  // Footer: Terms & Conditions
  if (typedInvoice.stables.invoice_default_terms) {
    const termsY = 80;
    const termsColor = rgb(0.5, 0.5, 0.5);
    const termsSize = 9;
    const maxLineWidth = pageWidth - margin;

    page.drawText('Terms & Conditions', {
      x: margin,
      y: termsY,
      size: termsSize,
      font: fontBold,
      color: termsColor,
    });

    // Word-wrap terms text
    const terms = typedInvoice.stables.invoice_default_terms;
    const words = terms.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, termsSize);
      if (testWidth <= maxLineWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);

    let termsTextY = termsY - 12;
    for (const line of lines.slice(0, 3)) { // Limit to 3 lines
      page.drawText(line, {
        x: margin,
        y: termsTextY,
        size: termsSize,
        font,
        color: termsColor,
      });
      termsTextY -= 11;
    }
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
