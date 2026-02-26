/**
 * @module telegram-bot/domain
 * @description Session and context types for the Telegram bot
 * @safety YELLOW
 */

import type { Context, SessionFlavor } from 'grammy';
import type { MenuFlavor } from '@grammyjs/menu';

export interface SessionData {
  stable_id: string | null;
  selectedClientId: string | null;
  clientsPage: number;
  servicesPage: number;
  is_owner: boolean;
}

export function createInitialSessionData(): SessionData {
  return {
    stable_id: null,
    selectedClientId: null,
    clientsPage: 0,
    servicesPage: 0,
    is_owner: false,
  };
}

export type BotContext = Context & SessionFlavor<SessionData> & MenuFlavor;
