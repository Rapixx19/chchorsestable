/**
 * @module telegram-bot/handlers
 * @description Invoice list handler for stable owners
 * @safety RED
 */

import type { BotContext } from '../domain/bot.types';
import { getServiceClient } from '../middleware/stable-context';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://chc.app';

const STATUS_EMOJI: Record<string, string> = {
  draft: '📝',
  approved: '✅',
  sent: '📤',
  paid: '💰',
  overdue: '⚠️',
  cancelled: '❌',
};

export async function showInvoices(ctx: BotContext): Promise<void> {
  const stableId = ctx.session.stable_id;

  if (!stableId) {
    await ctx.answerCallbackQuery('❌ Not linked to a stable');
    return;
  }

  const supabase = getServiceClient();

  // Get last 5 invoices with client names
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select(`
      id,
      invoice_number,
      status,
      total_cents,
      due_date,
      created_at,
      clients(name)
    `)
    .eq('stable_id', stableId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    await ctx.answerCallbackQuery('❌ Failed to load invoices');
    return;
  }

  if (!invoices || invoices.length === 0) {
    await ctx.answerCallbackQuery('📋 No invoices');
    await ctx.reply(
      '📋 *Invoices*\n\n' +
      'No invoices found.\n\n' +
      `[Open Dashboard](${APP_URL}/invoices)`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  interface InvoiceRow {
    id: string;
    invoice_number: string;
    status: string;
    total_cents: number;
    due_date: string;
    created_at: string;
    clients: { name: string } | null;
  }

  const lines = (invoices as InvoiceRow[]).map((inv) => {
    const emoji = STATUS_EMOJI[inv.status] || '📄';
    const amount = (inv.total_cents / 100).toFixed(2);
    const clientName = inv.clients?.name || 'Unknown';
    const dueDate = new Date(inv.due_date).toLocaleDateString('de-DE');

    return (
      `${emoji} *${inv.invoice_number}*\n` +
      `   ${clientName} • €${amount}\n` +
      `   Due: ${dueDate} • [PDF](${APP_URL}/api/invoices/${inv.id}/pdf)`
    );
  });

  await ctx.answerCallbackQuery('📋 Invoices loaded');
  await ctx.reply(
    `📋 *Recent Invoices*\n\n` +
    lines.join('\n\n') +
    `\n\n[View All Invoices](${APP_URL}/invoices)`,
    { parse_mode: 'Markdown', link_preview_options: { is_disabled: true } }
  );
}
