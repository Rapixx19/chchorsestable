/**
 * @module telegram-bot/handlers
 * @description Command handlers for /start, /link, /unlink, /menu, /help
 * @safety YELLOW
 */

import type { BotContext } from '../domain/bot.types';
import { getServiceClient } from '../middleware/stable-context';

export function registerCommands(
  bot: { command: (cmd: string, handler: (ctx: BotContext) => Promise<void>) => void }
) {
  bot.command('start', handleStart);
  bot.command('link', handleLink);
  bot.command('unlink', handleUnlink);
  bot.command('help', handleHelp);
  // Note: /menu is handled in bot.service.ts with menu attached
}

async function handleStart(ctx: BotContext): Promise<void> {
  if (ctx.session.stable_id) {
    await ctx.reply(
      '🐴 Welcome back to CHC!\n\n' +
      'Your account is linked. Use /menu to manage your services.'
    );
  } else {
    await ctx.reply(
      '🐴 Welcome to CHC!\n\n' +
      'To get started, link your account:\n' +
      '/link YOUR_CLIENT_ID\n\n' +
      'Contact your stable manager to get your Client ID.'
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

    const { error } = await supabase
      .from('clients')
      .update({ telegram_chat_id: null })
      .eq('telegram_chat_id', chatId);

    if (error) {
      await ctx.reply('❌ Failed to unlink account');
      return;
    }

    // Clear session
    ctx.session.stable_id = null;
    ctx.session.selectedClientId = null;

    await ctx.reply('✅ Account unlinked. Use /link to connect again.');
  } catch {
    await ctx.reply('❌ An error occurred. Please try again.');
  }
}

async function handleHelp(ctx: BotContext): Promise<void> {
  await ctx.reply(
    '🐴 *CHC Bot Help*\n\n' +
    '*Commands:*\n' +
    '/start - Welcome message\n' +
    '/link CLIENT_ID - Link your account\n' +
    '/unlink - Remove account link\n' +
    '/menu - Show main menu\n' +
    '/help - Show this help\n\n' +
    '*Need assistance?*\n' +
    'Contact your stable manager for your Client ID.',
    { parse_mode: 'Markdown' }
  );
}
