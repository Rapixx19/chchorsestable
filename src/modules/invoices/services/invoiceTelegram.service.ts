/**
 * @module invoices/services
 * @description Service for sending invoices via Telegram
 * @safety RED
 */

import { createClient } from '@/infra/supabase/server';
import { generateInvoicePdf } from './invoicePdf.service';
import { sendTelegramDocument } from '@/modules/notifications/services/telegram.service';

export interface SendInvoiceTelegramResult {
  success: boolean;
  messageId?: number;
  error?: string;
  errorCode?: 'NOT_FOUND' | 'NOT_APPROVED' | 'NO_TELEGRAM_CHAT_ID' | 'TELEGRAM_ERROR';
}

interface InvoiceWithClient {
  id: string;
  status: string;
  clients: {
    name: string;
    telegram_chat_id: string | null;
  };
}

export async function sendInvoiceTelegram(invoiceId: string): Promise<SendInvoiceTelegramResult> {
  const supabase = await createClient();

  // 1. Fetch invoice with client telegram_chat_id
  const { data: invoice, error: fetchError } = await supabase
    .from('invoices')
    .select(`
      id,
      status,
      clients!inner(name, telegram_chat_id)
    `)
    .eq('id', invoiceId)
    .single();

  if (fetchError || !invoice) {
    return {
      success: false,
      error: 'Invoice not found',
      errorCode: 'NOT_FOUND',
    };
  }

  const typedInvoice = invoice as unknown as InvoiceWithClient;

  // 2. Validate status === 'approved'
  if (typedInvoice.status !== 'approved') {
    return {
      success: false,
      error: 'Invoice must be approved before sending',
      errorCode: 'NOT_APPROVED',
    };
  }

  // 3. Validate client has telegram_chat_id
  if (!typedInvoice.clients.telegram_chat_id) {
    return {
      success: false,
      error: 'Client does not have a Telegram chat ID configured',
      errorCode: 'NO_TELEGRAM_CHAT_ID',
    };
  }

  // 4. Generate PDF
  const pdfBytes = await generateInvoicePdf(invoiceId);

  // 5. Send via Telegram
  const telegramResult = await sendTelegramDocument({
    chatId: typedInvoice.clients.telegram_chat_id,
    document: pdfBytes,
    filename: `invoice-${invoiceId}.pdf`,
    caption: `Invoice for ${typedInvoice.clients.name}`,
  });

  if (!telegramResult.success) {
    return {
      success: false,
      error: telegramResult.error ?? 'Failed to send via Telegram',
      errorCode: 'TELEGRAM_ERROR',
    };
  }

  // 6. Update invoice status to 'sent'
  const { error: updateError } = await supabase
    .from('invoices')
    .update({ status: 'sent' })
    .eq('id', invoiceId);

  if (updateError) {
    // Telegram succeeded but status update failed - still report success
    // since the invoice was delivered
    return {
      success: true,
      messageId: telegramResult.messageId,
    };
  }

  return {
    success: true,
    messageId: telegramResult.messageId,
  };
}
