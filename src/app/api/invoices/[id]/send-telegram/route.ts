/**
 * @module api/invoices/send-telegram
 * @description API route for sending invoices via Telegram
 * @safety RED
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendInvoiceTelegram } from '@/modules/invoices/services';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await sendInvoiceTelegram(id);

    if (!result.success) {
      const statusMap: Record<string, number> = {
        NOT_FOUND: 404,
        NOT_APPROVED: 400,
        NO_TELEGRAM_CHAT_ID: 400,
        TELEGRAM_ERROR: 502,
      };

      const status = result.errorCode ? statusMap[result.errorCode] ?? 500 : 500;

      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
