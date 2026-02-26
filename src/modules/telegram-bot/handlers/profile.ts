/**
 * @module telegram-bot/handlers
 * @description Profile display handler for stable owners
 * @safety YELLOW
 */

import type { BotContext } from '../domain/bot.types';
import { getServiceClient } from '../middleware/stable-context';

export async function showProfile(ctx: BotContext): Promise<void> {
  const stableId = ctx.session.stable_id;

  if (!stableId) {
    await ctx.answerCallbackQuery('❌ Not linked to a stable');
    return;
  }

  const supabase = getServiceClient();

  // Get stable info
  const { data: stable } = await supabase
    .from('stables')
    .select('name, logo_url')
    .eq('id', stableId)
    .single();

  if (!stable) {
    await ctx.answerCallbackQuery('❌ Stable not found');
    return;
  }

  // Get stats in parallel
  const [clientsResult, servicesResult, assignmentsResult] = await Promise.all([
    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('stable_id', stableId)
      .eq('archived', false),
    supabase
      .from('services')
      .select('id', { count: 'exact', head: true })
      .eq('stable_id', stableId)
      .eq('archived', false),
    supabase
      .from('service_assignments')
      .select('id', { count: 'exact', head: true })
      .eq('stable_id', stableId)
      .eq('active', true),
  ]);

  const clientCount = clientsResult.count ?? 0;
  const serviceCount = servicesResult.count ?? 0;
  const assignmentCount = assignmentsResult.count ?? 0;

  const logoStatus = stable.logo_url ? '✅ Uploaded' : '❌ Not set';

  await ctx.answerCallbackQuery('👤 Profile loaded');
  await ctx.reply(
    `👤 *Stable Profile*\n\n` +
    `*Name:* ${stable.name}\n` +
    `*Logo:* ${logoStatus}\n\n` +
    `📊 *Statistics:*\n` +
    `• Clients: ${clientCount}\n` +
    `• Services: ${serviceCount}\n` +
    `• Active Assignments: ${assignmentCount}\n\n` +
    `_Use the web dashboard for full settings._`,
    { parse_mode: 'Markdown' }
  );
}
