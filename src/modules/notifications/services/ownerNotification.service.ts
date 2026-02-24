/**
 * @module notifications/services
 * @description Service for sending notifications to stable owners
 * @safety RED
 */

import { createClient } from '@/infra/supabase/server';

export interface OwnerNotificationInput {
  type: 'pdf_generated';
  invoiceId: string;
}

export interface OwnerNotificationResult {
  success: boolean;
  skipped?: boolean;
  error?: string;
}

interface StableWithOwnerTelegram {
  owner_telegram_chat_id: string | null;
}

async function sendTelegramMessage(
  chatId: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return { success: false, error: 'TELEGRAM_BOT_TOKEN not set' };
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      return { success: false, error: data.description || 'Telegram API error' };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function sendOwnerNotification(
  input: OwnerNotificationInput
): Promise<OwnerNotificationResult> {
  const supabase = await createClient();

  // Fetch invoice with stable owner telegram info
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select(`
      id,
      stables!inner(
        name,
        owner_telegram_chat_id
      )
    `)
    .eq('id', input.invoiceId)
    .single();

  if (invoiceError || !invoice) {
    return {
      success: false,
      error: 'Invoice not found',
    };
  }

  const stable = (invoice as unknown as { stables: StableWithOwnerTelegram }).stables;

  // Gracefully skip if owner telegram chat ID not configured
  if (!stable.owner_telegram_chat_id) {
    return {
      success: true,
      skipped: true,
    };
  }

  // Build notification message
  let message = '';
  if (input.type === 'pdf_generated') {
    message = `📄 Invoice PDF generated for invoice ${input.invoiceId.slice(0, 8)}...`;
  }

  const result = await sendTelegramMessage(stable.owner_telegram_chat_id, message);

  if (!result.success) {
    return {
      success: false,
      error: result.error,
    };
  }

  return { success: true };
}
