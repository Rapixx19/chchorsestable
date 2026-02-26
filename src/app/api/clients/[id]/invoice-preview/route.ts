/**
 * @module api/clients/invoice-preview
 * @description API route for generating invoice preview data
 * @safety YELLOW
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateInvoicePreview } from '@/modules/invoices/services/invoicePreview.service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;

    const result = await generateInvoicePreview(clientId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Client not found' ? 404 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      preview: result.preview,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
