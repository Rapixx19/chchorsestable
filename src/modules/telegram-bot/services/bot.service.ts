/**
 * @module telegram-bot/services
 * @description Bot initialization and webhook handler
 * @safety RED
 */

import { Bot, session, webhookCallback } from 'grammy';
import type { BotContext, SessionData } from '../domain/bot.types';
import { createInitialSessionData } from '../domain/bot.types';
import { stableContextMiddleware } from '../middleware/stable-context';
import { mainMenu } from '../menus';
import { registerCommands } from '../handlers/commands';
import { handleError } from '../handlers/errors';

let bot: Bot<BotContext> | null = null;

function createBot(): Bot<BotContext> {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not set');
  }

  const newBot = new Bot<BotContext>(token);

  // Session middleware (in-memory for simplicity)
  newBot.use(
    session<SessionData, BotContext>({
      initial: createInitialSessionData,
    })
  );

  // Multi-tenancy middleware
  newBot.use(stableContextMiddleware);

  // Register menu hierarchy
  newBot.use(mainMenu);

  // Register commands
  registerCommands(newBot);

  // Handle /menu command with menu attached
  newBot.command('menu', async (ctx) => {
    if (!ctx.session.stable_id) {
      await ctx.reply('❌ Please link your account first:\n/link YOUR_CLIENT_ID');
      return;
    }
    await ctx.reply('🐴 *CHC Main Menu*\n\nSelect an option:', {
      parse_mode: 'Markdown',
      reply_markup: mainMenu,
    });
  });

  // Error handling
  newBot.catch(handleError);

  return newBot;
}

export function getBot(): Bot<BotContext> {
  if (!bot) {
    bot = createBot();
  }
  return bot;
}

export function getWebhookCallback() {
  const botInstance = getBot();
  return webhookCallback(botInstance, 'std/http');
}
