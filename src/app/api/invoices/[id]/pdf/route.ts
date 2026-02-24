/**
 * @module api/invoices/pdf
 * @description API route for generating and downloading invoice PDFs
 * @safety RED
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateInvoicePdf } from '@/modules/invoices/services';
import { sendOwnerNotification } from '@/modules/notifications/services';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const pdfBytes = await generateInvoicePdf(id);

    // Notify stable owner (fire-and-forget, don't block response)
    sendOwnerNotification({
      type: 'pdf_generated',
      invoiceId: id,
    }).catch((err) => console.warn('Owner notification failed:', err));

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${id}.pdf"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'Invoice not found') {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
