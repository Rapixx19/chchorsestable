/**
 * @module api/invoices/approve
 * @description API route for approving invoices
 * @safety RED
 */

import { NextRequest, NextResponse } from 'next/server';
import { approveInvoice } from '@/modules/invoices/services';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await approveInvoice(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'Invoice not found') {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    if (message === 'Invoice can only be approved from draft status') {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
