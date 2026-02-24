/**
 * @module telegram-bot/menus
 * @description Current services list with toggle and remove actions
 * @safety YELLOW
 */

import { Menu } from '@grammyjs/menu';
import type { BotContext } from '../domain/bot.types';
import { getServiceClient } from '../middleware/stable-context';

export const activeServicesMenu = new Menu<BotContext>('active-services')
  .dynamic(async (ctx, range) => {
    const clientId = ctx.session.selectedClientId;

    if (!clientId) {
      range.text('No client selected').row();
      return;
    }

    const supabase = getServiceClient();
    const { data } = await supabase
      .from('service_assignments')
      .select(`
        id,
        active,
        services(name)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    interface AssignmentRow {
      id: string;
      active: boolean;
      services: { name: string } | null;
    }
    const assignments = data as AssignmentRow[] | null;

    if (!assignments || assignments.length === 0) {
      range.text('No active services').row();
      return;
    }

    // Display each assignment with toggle and delete buttons
    for (const assignment of assignments) {
      const services = assignment.services;
      const serviceName = services?.name || 'Unknown';
      const statusIcon = assignment.active ? '✅' : '⏸️';

      range.text(`${statusIcon} ${serviceName}`);

      // Toggle button
      range.text(
        assignment.active ? '⏸️' : '▶️',
        async (ctx) => {
          await toggleAssignment(ctx, assignment.id, !assignment.active);
        }
      );

      // Delete button
      range.text(
        '🗑️',
        async (ctx) => {
          await deleteAssignment(ctx, assignment.id, serviceName);
        }
      );

      range.row();
    }
  })
  .text('⬅️ Back', async (ctx) => {
    await ctx.menu.nav('service-editor');
  });

async function toggleAssignment(
  ctx: BotContext,
  assignmentId: string,
  active: boolean
): Promise<void> {
  const supabase = getServiceClient();

  const { error } = await supabase
    .from('service_assignments')
    .update({ active })
    .eq('id', assignmentId);

  if (error) {
    await ctx.answerCallbackQuery('❌ Failed to update');
    return;
  }

  await ctx.answerCallbackQuery(active ? '▶️ Activated' : '⏸️ Paused');
  await ctx.menu.update();
}

async function deleteAssignment(
  ctx: BotContext,
  assignmentId: string,
  serviceName: string
): Promise<void> {
  const supabase = getServiceClient();

  // Soft delete by deactivating
  const { error } = await supabase
    .from('service_assignments')
    .delete()
    .eq('id', assignmentId);

  if (error) {
    await ctx.answerCallbackQuery('❌ Failed to remove');
    return;
  }

  await ctx.answerCallbackQuery(`🗑️ Removed: ${serviceName}`);
  await ctx.menu.update();
}
