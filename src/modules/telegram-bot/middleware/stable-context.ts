/**
 * @module telegram-bot/middleware
 * @description Multi-tenancy middleware that resolves stable_id from telegram_chat_id
 * @safety RED
 */

import { createClient } from '@supabase/supabase-js';
import type { NextFunction } from 'grammy';
import type { BotContext } from '../domain/bot.types';
import type { Database } from '@/infra/supabase/types';

// Service role client for bot operations (bypasses RLS)
function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient<Database>(url, key);
}

// Singleton instance
let serviceClient: ReturnType<typeof createServiceClient> | null = null;

export function getServiceClient() {
  if (!serviceClient) {
    serviceClient = createServiceClient();
  }
  return serviceClient;
}

/**
 * Middleware that resolves stable_id from the chat's linked client account.
 * Sets ctx.session.stable_id if the chat is linked to a client.
 */
export async function stableContextMiddleware(
  ctx: BotContext,
  next: NextFunction
): Promise<void> {
  // Skip if stable_id already set in session
  if (ctx.session.stable_id) {
    return next();
  }

  const chatId = ctx.chat?.id?.toString();
  if (!chatId) {
    return next();
  }

  try {
    const supabase = getServiceClient();
    const { data: client } = await supabase
      .from('clients')
      .select('stable_id')
      .eq('telegram_chat_id', chatId)
      .single();

    if (client?.stable_id) {
      ctx.session.stable_id = client.stable_id;
    }
  } catch {
    // Client not linked yet, that's okay
  }

  return next();
}
