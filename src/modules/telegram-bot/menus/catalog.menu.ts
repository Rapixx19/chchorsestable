/**
 * @module telegram-bot/menus
 * @description Service catalog picker menu for adding services to a client
 * @safety YELLOW
 */

import { Menu } from '@grammyjs/menu';
import type { BotContext } from '../domain/bot.types';
import { getServiceClient } from '../middleware/stable-context';

const ITEMS_PER_PAGE = 5;

export const catalogMenu = new Menu<BotContext>('catalog')
  .dynamic(async (ctx, range) => {
    const stableId = ctx.session.stable_id;
    const clientId = ctx.session.selectedClientId;

    if (!stableId || !clientId) {
      range.text('No client selected').row();
      return;
    }

    const supabase = getServiceClient();
    const { data: services } = await supabase
      .from('services')
      .select('id, name, price_cents, billing_unit')
      .eq('stable_id', stableId)
      .eq('archived', false)
      .order('name', { ascending: true });

    if (!services || services.length === 0) {
      range.text('No services available').row();
      return;
    }

    const page = ctx.session.servicesPage || 0;
    const totalPages = Math.ceil(services.length / ITEMS_PER_PAGE);
    const start = page * ITEMS_PER_PAGE;
    const pageServices = services.slice(start, start + ITEMS_PER_PAGE);

    // Display services
    for (const service of pageServices) {
      const priceStr = formatPrice(service.price_cents, service.billing_unit);
      range.text(
        `${service.name} (${priceStr})`,
        async (ctx) => {
          await addServiceToClient(ctx, service.id, service.name);
        }
      ).row();
    }

    // Pagination
    if (totalPages > 1) {
      if (page > 0) {
        range.text('◀️ Prev', async (ctx) => {
          ctx.session.servicesPage = page - 1;
          await ctx.menu.update();
        });
      }
      range.text(`${page + 1}/${totalPages}`);
      if (page < totalPages - 1) {
        range.text('Next ▶️', async (ctx) => {
          ctx.session.servicesPage = page + 1;
          await ctx.menu.update();
        });
      }
      range.row();
    }
  })
  .text('⬅️ Back', async (ctx) => {
    ctx.session.servicesPage = 0;
    await ctx.menu.nav('service-editor');
  });

function formatPrice(cents: number, unit: string): string {
  const amount = (cents / 100).toFixed(2);
  switch (unit) {
    case 'monthly':
      return `€${amount}/mo`;
    case 'per_session':
      return `€${amount}/session`;
    default:
      return `€${amount}`;
  }
}

async function addServiceToClient(
  ctx: BotContext,
  serviceId: string,
  serviceName: string
): Promise<void> {
  const stableId = ctx.session.stable_id;
  const clientId = ctx.session.selectedClientId;

  if (!stableId || !clientId) {
    await ctx.answerCallbackQuery('❌ Session error');
    return;
  }

  const supabase = getServiceClient();

  const { error } = await supabase
    .from('service_assignments')
    .insert({
      stable_id: stableId,
      client_id: clientId,
      service_id: serviceId,
      quantity: 1,
      start_date: new Date().toISOString().split('T')[0],
      active: true,
    });

  if (error) {
    await ctx.answerCallbackQuery('❌ Failed to add service');
    return;
  }

  await ctx.answerCallbackQuery(`✅ Added: ${serviceName}`);
  await ctx.menu.nav('service-editor');
}
