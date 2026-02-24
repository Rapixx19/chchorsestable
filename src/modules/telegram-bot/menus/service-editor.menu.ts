/**
 * @module telegram-bot/menus
 * @description Service editor menu for managing a client's services
 * @safety YELLOW
 */

import { Menu } from '@grammyjs/menu';
import type { BotContext } from '../domain/bot.types';
import { getServiceClient } from '../middleware/stable-context';
import { catalogMenu } from './catalog.menu';
import { activeServicesMenu } from './active-services.menu';

export const serviceEditorMenu = new Menu<BotContext>('service-editor')
  .dynamic(async (ctx, range) => {
    const clientId = ctx.session.selectedClientId;

    if (!clientId) {
      range.text('No client selected').row();
      return;
    }

    // Get client name
    const supabase = getServiceClient();
    const { data: client } = await supabase
      .from('clients')
      .select('name')
      .eq('id', clientId)
      .single();

    const clientName = client?.name || 'Unknown Client';

    // Header with client name
    range.text(`📋 ${clientName}`).row();
  })
  .submenu('➕ Add Service', 'catalog')
  .row()
  .submenu('📋 Current Services', 'active-services')
  .row()
  .text('📄 Generate Invoice', async (ctx) => {
    await generateInvoice(ctx);
  })
  .row()
  .text('⬅️ Back', async (ctx) => {
    ctx.session.selectedClientId = null;
    await ctx.menu.nav('clients');
  });

// Register child menus
serviceEditorMenu.register(catalogMenu);
serviceEditorMenu.register(activeServicesMenu);

async function generateInvoice(ctx: BotContext): Promise<void> {
  const clientId = ctx.session.selectedClientId;
  const stableId = ctx.session.stable_id;

  if (!clientId || !stableId) {
    await ctx.answerCallbackQuery('❌ Session error');
    return;
  }

  const supabase = getServiceClient();

  // Get active assignments
  const { data } = await supabase
    .from('service_assignments')
    .select(`
      id,
      quantity,
      services(name, price_cents, billing_unit)
    `)
    .eq('client_id', clientId)
    .eq('active', true);

  interface InvoiceRow {
    id: string;
    quantity: number;
    services: { name: string; price_cents: number; billing_unit: string } | null;
  }
  const assignments = data as InvoiceRow[] | null;

  if (!assignments || assignments.length === 0) {
    await ctx.answerCallbackQuery('❌ No active services to invoice');
    return;
  }

  // Calculate total
  let totalCents = 0;
  const lines: string[] = [];

  for (const assignment of assignments) {
    const services = assignment.services;
    if (services) {
      const lineTotal = services.price_cents * assignment.quantity;
      totalCents += lineTotal;
      lines.push(
        `• ${services.name} x${assignment.quantity}: €${(lineTotal / 100).toFixed(2)}`
      );
    }
  }

  const totalStr = (totalCents / 100).toFixed(2);

  await ctx.answerCallbackQuery('📄 Invoice generated');
  await ctx.reply(
    `📄 *Invoice Summary*\n\n` +
    `${lines.join('\n')}\n\n` +
    `*Total: €${totalStr}*\n\n` +
    `_Full invoice available in the web portal._`,
    { parse_mode: 'Markdown' }
  );
}
