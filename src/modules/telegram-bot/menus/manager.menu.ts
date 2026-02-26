/**
 * @module telegram-bot/menus
 * @description Manager menu for stable owners
 * @safety YELLOW
 */

import { Menu } from '@grammyjs/menu';
import type { BotContext } from '../domain/bot.types';
import { showProfile } from '../handlers/profile';
import { showInvoices } from '../handlers/invoices';
import { addServiceMenu, startAddServiceFlow } from './add-service.menu';
import { clientsMenu } from './clients.menu';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://chc.app';

export const managerMenu = new Menu<BotContext>('manager')
  .text('👤 My Profile', async (ctx) => {
    await showProfile(ctx);
  })
  .row()
  .text('➕ Add Service', async (ctx) => {
    startAddServiceFlow(ctx);
    await ctx.answerCallbackQuery('📝 Enter service name');
    await ctx.reply(
      '➕ *Add New Service*\n\n' +
      '📝 Enter the service name:',
      { parse_mode: 'Markdown' }
    );
  })
  .text('📋 Invoices', async (ctx) => {
    await showInvoices(ctx);
  })
  .row()
  .url('🌐 Open Dashboard', APP_URL + '/dashboard')
  .row()
  .submenu('👥 Manage Clients', 'clients')
  .row()
  .text('📊 Monthly Summary', async (ctx) => {
    await showMonthlySummary(ctx);
  });

// Register child menus
managerMenu.register(addServiceMenu);
managerMenu.register(clientsMenu);

async function showMonthlySummary(ctx: BotContext): Promise<void> {
  const { getServiceClient } = await import('../middleware/stable-context');
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
