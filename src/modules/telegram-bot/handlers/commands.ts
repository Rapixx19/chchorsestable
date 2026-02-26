/**
 * @module telegram-bot/handlers
 * @description Command handlers for /start, /link, /unlink, /manager, /menu, /help, /profile, /services
 * @safety YELLOW
 */

import type { BotContext } from '../domain/bot.types';
import { getServiceClient } from '../middleware/stable-context';
import { showProfile } from './profile';
import { showInvoices } from './invoices';

export function registerCommands(
  bot: { command: (cmd: string, handler: (ctx: BotContext) => Promise<void>) => void }
) {
  bot.command('start', handleStart);
  bot.command('link', handleLink);
  bot.command('unlink', handleUnlink);
  bot.command('manager', handleManager);
  bot.command('help', handleHelp);
  bot.command('profile', handleProfile);
  bot.command('services', handleServices);
  // Note: /menu is handled in bot.service.ts with menu attached
}

async function handleStart(ctx: BotContext): Promise<void> {
  if (ctx.session.stable_id) {
    const mode = ctx.session.is_owner ? 'Manager' : 'Client';
    await ctx.reply(
      `🐴 Welcome back to CHC!\n\n` +
      `Mode: ${mode}\n` +
      `Use /menu to ${ctx.session.is_owner ? 'manage your stable' : 'manage your services'}.`
    );
  } else {
    await ctx.reply(
      '🐴 Welcome to CHC!\n\n' +
      '*For clients:*\n' +
      '/link YOUR_CLIENT_ID\n\n' +
      '*For stable owners:*\n' +
      '/manager YOUR_STABLE_ID',
      { parse_mode: 'Markdown' }
    );
  }
}

async function handleLink(ctx: BotContext): Promise<void> {
  const text = ctx.message?.text || '';
  const parts = text.split(' ');
  const clientId = parts[1]?.trim();

  if (!clientId) {
    await ctx.reply('❌ Please provide your Client ID:\n/link YOUR_CLIENT_ID');
    return;
  }

  const chatId = ctx.chat?.id?.toString();
  if (!chatId) {
    await ctx.reply('❌ Could not determine chat ID');
    return;
  }

  try {
    const supabase = getServiceClient();

    // Check if client exists
    const { data: client, error: fetchError } = await supabase
      .from('clients')
      .select('id, stable_id, name')
      .eq('id', clientId)
      .single();

    if (fetchError || !client) {
      await ctx.reply('❌ Client not found. Please check your Client ID.');
      return;
    }

    // Update client with telegram_chat_id
    const { error: updateError } = await supabase
      .from('clients')
      .update({ telegram_chat_id: chatId })
      .eq('id', clientId);

    if (updateError) {
      await ctx.reply('❌ Failed to link account. Please try again.');
      return;
    }

    // Update session
    ctx.session.stable_id = client.stable_id;
    ctx.session.is_owner = false;

    await ctx.reply(
      `✅ Account linked successfully!\n\n` +
      `Welcome, ${client.name}!\n\n` +
      `Use /menu to manage your services.`
    );
  } catch {
    await ctx.reply('❌ An error occurred. Please try again.');
  }
}

async function handleUnlink(ctx: BotContext): Promise<void> {
  const chatId = ctx.chat?.id?.toString();
  if (!chatId) {
    await ctx.reply('❌ Could not determine chat ID');
    return;
  }

  try {
    const supabase = getServiceClient();

    // Clear client link
    await supabase
      .from('clients')
      .update({ telegram_chat_id: null })
      .eq('telegram_chat_id', chatId);

    // Clear owner link
    await supabase
      .from('stables')
      .update({ owner_telegram_chat_id: null })
      .eq('owner_telegram_chat_id', chatId);

    // Clear session
    ctx.session.stable_id = null;
    ctx.session.selectedClientId = null;
    ctx.session.is_owner = false;

    await ctx.reply('✅ Account unlinked. Use /link or /manager to connect again.');
  } catch {
    await ctx.reply('❌ An error occurred. Please try again.');
  }
}

async function handleManager(ctx: BotContext): Promise<void> {
  const text = ctx.message?.text || '';
  const parts = text.split(' ');
  const stableId = parts[1]?.trim();

  if (!stableId) {
    await ctx.reply('❌ Please provide your Stable ID:\n/manager YOUR_STABLE_ID');
    return;
  }

  const chatId = ctx.chat?.id?.toString();
  if (!chatId) {
    await ctx.reply('❌ Could not determine chat ID');
    return;
  }

  try {
    const supabase = getServiceClient();

    // Verify stable exists
    const { data: stable, error: fetchError } = await supabase
      .from('stables')
      .select('id, name')
      .eq('id', stableId)
      .single();

    if (fetchError || !stable) {
      await ctx.reply('❌ Stable not found. Please check your Stable ID.');
      return;
    }

    // Link owner telegram chat ID
    const { error: updateError } = await supabase
      .from('stables')
      .update({ owner_telegram_chat_id: chatId })
      .eq('id', stableId);

    if (updateError) {
      await ctx.reply('❌ Failed to activate manager mode. Please try again.');
      return;
    }

    // Update session
    ctx.session.stable_id = stable.id;
    ctx.session.is_owner = true;

    await ctx.reply(
      `✅ Manager mode activated for *${stable.name}*!\n\n` +
      `Use /menu to manage your stable.`,
      { parse_mode: 'Markdown' }
    );
  } catch {
    await ctx.reply('❌ An error occurred. Please try again.');
  }
}

async function handleHelp(ctx: BotContext): Promise<void> {
  const baseCommands =
    '/start - Welcome message\n' +
    '/menu - Show main menu\n' +
    '/unlink - Remove account link\n' +
    '/help - Show this help';

  if (ctx.session.is_owner) {
    await ctx.reply(
      '🐴 *CHC Bot Help - Manager Mode*\n\n' +
      '*Commands:*\n' +
      baseCommands + '\n' +
      '/profile - View stable settings\n' +
      '/services - Manage service list\n\n' +
      '*Manager Features:*\n' +
      '• View and manage all clients\n' +
      '• Add/remove services for clients\n' +
      '• View monthly summary\n' +
      '• View recent invoices\n\n' +
      '*Linking:*\n' +
      '/manager STABLE_ID - Link as stable owner',
      { parse_mode: 'Markdown' }
    );
  } else {
    await ctx.reply(
      '🐴 *CHC Bot Help*\n\n' +
      '*Commands:*\n' +
      baseCommands + '\n\n' +
      '*Linking:*\n' +
      '/link CLIENT_ID - Link as client\n' +
      '/manager STABLE_ID - Link as stable owner\n\n' +
      '*Need assistance?*\n' +
      'Contact your stable manager for your Client ID.',
      { parse_mode: 'Markdown' }
    );
  }
}

async function handleProfile(ctx: BotContext): Promise<void> {
  if (!ctx.session.stable_id) {
    await ctx.reply('❌ Please link your account first:\n/manager YOUR_STABLE_ID');
    return;
  }

  if (!ctx.session.is_owner) {
    await ctx.reply('❌ This command is for stable owners only.');
    return;
  }

  // Use a fake callback query context for the handler
  await showProfileDirect(ctx);
}

async function handleServices(ctx: BotContext): Promise<void> {
  if (!ctx.session.stable_id) {
    await ctx.reply('❌ Please link your account first:\n/manager YOUR_STABLE_ID');
    return;
  }

  if (!ctx.session.is_owner) {
    await ctx.reply('❌ This command is for stable owners only.');
    return;
  }

  await showServicesList(ctx);
}

async function showProfileDirect(ctx: BotContext): Promise<void> {
  const stableId = ctx.session.stable_id;

  if (!stableId) {
    await ctx.reply('❌ Not linked to a stable');
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
    await ctx.reply('❌ Stable not found');
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

async function showServicesList(ctx: BotContext): Promise<void> {
  const stableId = ctx.session.stable_id;

  if (!stableId) {
    await ctx.reply('❌ Not linked to a stable');
    return;
  }

  const supabase = getServiceClient();

  const { data: services } = await supabase
    .from('services')
    .select('id, name, price_cents, billing_unit')
    .eq('stable_id', stableId)
    .eq('archived', false)
    .order('name', { ascending: true })
    .limit(10);

  if (!services || services.length === 0) {
    await ctx.reply(
      '📋 *Services*\n\n' +
      'No services found.\n\n' +
      'Use /menu → Add Service to create one.',
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const billingLabels: Record<string, string> = {
    monthly: '📅 Monthly',
    per_session: '🎯 Per Session',
    one_time: '1️⃣ One-Time',
  };

  const lines = services.map((s) => {
    const billing = billingLabels[s.billing_unit] || s.billing_unit;
    return `• *${s.name}* - €${(s.price_cents / 100).toFixed(2)} (${billing})`;
  });

  await ctx.reply(
    `📋 *Services*\n\n` +
    lines.join('\n') +
    '\n\n_Use /menu → Add Service to create more._',
    { parse_mode: 'Markdown' }
  );
}
