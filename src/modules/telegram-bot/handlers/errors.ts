/**
 * @module telegram-bot/handlers
 * @description Error handling for the Telegram bot
 * @safety YELLOW
 */

import type { BotError } from 'grammy';
import type { BotContext } from '../domain/bot.types';

export function handleError(err: BotError<BotContext>): void {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);

  const e = err.error;

  if (e instanceof Error) {
    console.error('Error name:', e.name);
    console.error('Error message:', e.message);
    console.error('Stack:', e.stack);
  } else {
    console.error('Unknown error:', e);
  }

  // Try to notify user of error
  ctx.reply('❌ An error occurred. Please try again.').catch(() => {
    // Ignore if we can't reply
  });
}
