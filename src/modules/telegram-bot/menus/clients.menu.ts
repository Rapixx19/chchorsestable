/**
 * @module telegram-bot/menus
 * @description Dynamic client list menu with pagination
 * @safety YELLOW
 */

import { Menu } from '@grammyjs/menu';
import type { BotContext } from '../domain/bot.types';
import { getServiceClient } from '../middleware/stable-context';
import { serviceEditorMenu } from './service-editor.menu';

const ITEMS_PER_PAGE = 5;

export const clientsMenu = new Menu<BotContext>('clients')
  .dynamic(async (ctx, range) => {
    const stableId = ctx.session.stable_id;

    if (!stableId) {
      range.text('Not linked to a stable').row();
      return;
    }

    const supabase = getServiceClient();

    // Get all clients for this stable
    const { data: clients } = await supabase
      .from('clients')
      .select('id, name, telegram_chat_id')
      .eq('stable_id', stableId)
      .eq('archived', false)
      .order('name', { ascending: true });

    if (!clients || clients.length === 0) {
      range.text('No clients found').row();
      return;
    }

    // Get assignments count per client
    const { data: assignments } = await supabase
      .from('service_assignments')
      .select('client_id')
      .eq('stable_id', stableId)
      .eq('active', true);

    const assignmentCounts = new Map<string, number>();
    if (assignments) {
      for (const a of assignments) {
        const count = assignmentCounts.get(a.client_id) || 0;
        assignmentCounts.set(a.client_id, count + 1);
      }
    }

    const page = ctx.session.clientsPage || 0;
    const totalPages = Math.ceil(clients.length / ITEMS_PER_PAGE);
    const start = page * ITEMS_PER_PAGE;
    const pageClients = clients.slice(start, start + ITEMS_PER_PAGE);

    // Display clients
    for (const client of pageClients) {
      const hasServices = (assignmentCounts.get(client.id) || 0) > 0;
      const statusIcon = hasServices ? '✅' : '⚪';
      const linkedIcon = client.telegram_chat_id ? '📱' : '';

      range.text(
        `${statusIcon} ${client.name} ${linkedIcon}`,
        async (ctx) => {
          ctx.session.selectedClientId = client.id;
          await ctx.menu.nav('service-editor');
        }
      ).row();
    }

    // Pagination
    if (totalPages > 1) {
      if (page > 0) {
        range.text('◀️ Prev', async (ctx) => {
          ctx.session.clientsPage = page - 1;
          await ctx.menu.update();
        });
      }
      range.text(`${page + 1}/${totalPages}`);
      if (page < totalPages - 1) {
        range.text('Next ▶️', async (ctx) => {
          ctx.session.clientsPage = page + 1;
          await ctx.menu.update();
        });
      }
      range.row();
    }
  })
  .text('⬅️ Back', async (ctx) => {
    ctx.session.clientsPage = 0;
    await ctx.menu.nav('root');
  });

// Register child menu
clientsMenu.register(serviceEditorMenu);
