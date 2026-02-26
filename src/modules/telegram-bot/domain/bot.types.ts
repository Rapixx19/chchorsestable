/**
 * @module telegram-bot/domain
 * @description Session and context types for the Telegram bot
 * @safety YELLOW
 */

import type { Context, SessionFlavor } from 'grammy';
import type { MenuFlavor } from '@grammyjs/menu';

export type AddServiceStep = 'idle' | 'name' | 'price' | 'billing_unit' | 'confirm';
export type BillingUnit = 'one_time' | 'monthly' | 'per_session';

export interface AddServiceData {
  name?: string;
  price_cents?: number;
  billing_unit?: BillingUnit;
}

export interface SessionData {
  stable_id: string | null;
  selectedClientId: string | null;
  clientsPage: number;
  servicesPage: number;
  is_owner: boolean;
  // Add Service flow state
  addServiceStep: AddServiceStep;
  addServiceData: AddServiceData;
}

export function createInitialSessionData(): SessionData {
  return {
    stable_id: null,
    selectedClientId: null,
    clientsPage: 0,
    servicesPage: 0,
    is_owner: false,
    addServiceStep: 'idle',
    addServiceData: {},
  };
}

export type BotContext = Context & SessionFlavor<SessionData> & MenuFlavor;
