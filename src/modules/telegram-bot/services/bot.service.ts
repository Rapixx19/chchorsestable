/**
 * @module telegram-bot/services
 * @description Bot initialization and webhook handler
 * @safety RED
 */

import { Bot, session, webhookCallback } from 'grammy';
import type { BotContext, SessionData } from '../domain/bot.types';
import { createInitialSessionData } from '../domain/bot.types';
import { stableContextMiddleware } from '../middleware/stable-context';
import { mainMenu, handleAddServiceInput } from '../menus';
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

  // Handle text input for Add Service flow
  newBot.on('message:text', async (ctx, next) => {
    // Skip if message starts with / (command)
    if (ctx.message.text.startsWith('/')) {
      return next();
    }

    // Check if we're in an Add Service flow
    const handled = await handleAddServiceInput(ctx);
    if (!handled) {
      // Not in a flow, continue to next handler
      return next();
    }
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
