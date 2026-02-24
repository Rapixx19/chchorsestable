/**
 * @module telegram-bot/menus
 * @description Root menu with main navigation options
 * @safety YELLOW
 */

import { Menu } from '@grammyjs/menu';
import type { BotContext } from '../domain/bot.types';
import { getServiceClient } from '../middleware/stable-context';
import { clientsMenu } from './clients.menu';

export const mainMenu = new Menu<BotContext>('root')
  .submenu('👥 Manage Clients', 'clients')
  .row()
  .text('📊 Monthly Summary', async (ctx) => {
    await showMonthlySummary(ctx);
  })
  .row();

// Register child menu
mainMenu.register(clientsMenu);

async function showMonthlySummary(ctx: BotContext): Promise<void> {
  const stableId = ctx.session.stable_id;

  if (!stableId) {
    await ctx.answerCallbackQuery('❌ Not linked to a stable');
    return;
  }

  const supabase = getServiceClient();

  // Get all active assignments with service details
  const { data } = await supabase
    .from('service_assignments')
    .select(`
      quantity,
      clients(name),
      services(name, price_cents, billing_unit)
    `)
    .eq('stable_id', stableId)
    .eq('active', true);

  interface SummaryRow {
    quantity: number;
    clients: { name: string } | null;
    services: { name: string; price_cents: number; billing_unit: string } | null;
  }
  const assignments = data as SummaryRow[] | null;

  if (!assignments || assignments.length === 0) {
    await ctx.answerCallbackQuery('No active services');
    await ctx.reply('📊 *Monthly Summary*\n\nNo active services.', {
      parse_mode: 'Markdown',
    });
    return;
  }

  // Calculate totals
  let totalCents = 0;
  let monthlyRecurring = 0;
  const clientTotals = new Map<string, number>();

  for (const assignment of assignments) {
    const services = assignment.services;
    const clients = assignment.clients;

    if (services && clients) {
      const amount = services.price_cents * assignment.quantity;

      if (services.billing_unit === 'monthly') {
        monthlyRecurring += amount;
      }
      totalCents += amount;

      const current = clientTotals.get(clients.name) || 0;
      clientTotals.set(clients.name, current + amount);
    }
  }

  // Build summary message
  const lines: string[] = [];

  const sortedClients = Array.from(clientTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  for (const [name, cents] of sortedClients) {
    lines.push(`• ${name}: €${(cents / 100).toFixed(2)}`);
  }

  const totalStr = (totalCents / 100).toFixed(2);
  const recurringStr = (monthlyRecurring / 100).toFixed(2);

  await ctx.answerCallbackQuery('📊 Summary loaded');
  await ctx.reply(
    `📊 *Monthly Summary*\n\n` +
    `*Active Services:* ${assignments.length}\n` +
    `*Monthly Recurring:* €${recurringStr}\n` +
    `*Total Value:* €${totalStr}\n\n` +
    `*Top Clients:*\n${lines.join('\n')}`,
    { parse_mode: 'Markdown' }
  );
}
