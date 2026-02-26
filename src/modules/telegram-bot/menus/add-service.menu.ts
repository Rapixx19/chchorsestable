/**
 * @module telegram-bot/menus
 * @description Add Service multi-step flow menu
 * @safety YELLOW
 */

import { Menu } from '@grammyjs/menu';
import type { BotContext, BillingUnit } from '../domain/bot.types';
import { getServiceClient } from '../middleware/stable-context';

const BILLING_UNIT_LABELS: Record<BillingUnit, string> = {
  monthly: '📅 Monthly',
  per_session: '🎯 Per Session',
  one_time: '1️⃣ One-Time',
};

export const addServiceMenu = new Menu<BotContext>('add-service')
  .dynamic((ctx, range) => {
    const step = ctx.session.addServiceStep;
    const data = ctx.session.addServiceData;

    if (step === 'idle' || step === 'name') {
      range.text('📝 Waiting for service name...').row();
      range.text('❌ Cancel', async (ctx) => {
        resetAddServiceFlow(ctx);
        await ctx.menu.nav('manager');
      });
    } else if (step === 'price') {
      range.text(`✅ Name: ${data.name}`).row();
      range.text('💰 Waiting for price...').row();
      range.text('❌ Cancel', async (ctx) => {
        resetAddServiceFlow(ctx);
        await ctx.menu.nav('manager');
      });
    } else if (step === 'billing_unit') {
      range.text(`✅ Name: ${data.name}`).row();
      range.text(`✅ Price: €${((data.price_cents || 0) / 100).toFixed(2)}`).row();
      range.text('📊 Select billing type:').row();

      // Billing unit buttons
      range.text('📅 Monthly', async (ctx) => {
        ctx.session.addServiceData.billing_unit = 'monthly';
        ctx.session.addServiceStep = 'confirm';
        await ctx.menu.update();
      });
      range.text('🎯 Per Session', async (ctx) => {
        ctx.session.addServiceData.billing_unit = 'per_session';
        ctx.session.addServiceStep = 'confirm';
        await ctx.menu.update();
      }).row();
      range.text('1️⃣ One-Time', async (ctx) => {
        ctx.session.addServiceData.billing_unit = 'one_time';
        ctx.session.addServiceStep = 'confirm';
        await ctx.menu.update();
      });
      range.text('❌ Cancel', async (ctx) => {
        resetAddServiceFlow(ctx);
        await ctx.menu.nav('manager');
      }).row();
    } else if (step === 'confirm') {
      const billingLabel = data.billing_unit
        ? BILLING_UNIT_LABELS[data.billing_unit]
        : 'Unknown';

      range.text('📋 *Confirm New Service*').row();
      range.text(`Name: ${data.name}`).row();
      range.text(`Price: €${((data.price_cents || 0) / 100).toFixed(2)}`).row();
      range.text(`Billing: ${billingLabel}`).row();

      range.text('✅ Create Service', async (ctx) => {
        await createService(ctx);
      });
      range.text('❌ Cancel', async (ctx) => {
        resetAddServiceFlow(ctx);
        await ctx.menu.nav('manager');
      }).row();
    }
  });

function resetAddServiceFlow(ctx: BotContext): void {
  ctx.session.addServiceStep = 'idle';
  ctx.session.addServiceData = {};
}

async function createService(ctx: BotContext): Promise<void> {
  const stableId = ctx.session.stable_id;
  const data = ctx.session.addServiceData;

  if (!stableId || !data.name || !data.price_cents || !data.billing_unit) {
    await ctx.answerCallbackQuery('❌ Missing required data');
    return;
  }

  const supabase = getServiceClient();

  const { error } = await supabase.from('services').insert({
    stable_id: stableId,
    name: data.name,
    price_cents: data.price_cents,
    billing_unit: data.billing_unit,
    archived: false,
  });

  if (error) {
    await ctx.answerCallbackQuery('❌ Failed to create service');
    return;
  }

  await ctx.answerCallbackQuery('✅ Service created!');
  await ctx.reply(
    `✅ *Service Created*\n\n` +
    `*Name:* ${data.name}\n` +
    `*Price:* €${(data.price_cents / 100).toFixed(2)}\n` +
    `*Billing:* ${BILLING_UNIT_LABELS[data.billing_unit]}`,
    { parse_mode: 'Markdown' }
  );

  resetAddServiceFlow(ctx);
  await ctx.menu.nav('manager');
}

/**
 * Start the Add Service flow
 */
export function startAddServiceFlow(ctx: BotContext): void {
  ctx.session.addServiceStep = 'name';
  ctx.session.addServiceData = {};
}

/**
 * Handle text input during Add Service flow
 * Returns true if the message was handled
 */
export async function handleAddServiceInput(ctx: BotContext): Promise<boolean> {
  const step = ctx.session.addServiceStep;
  const text = ctx.message?.text?.trim();

  if (step === 'idle' || !text) {
    return false;
  }

  if (step === 'name') {
    if (text.length < 2 || text.length > 100) {
      await ctx.reply('❌ Service name must be 2-100 characters. Try again:');
      return true;
    }
    ctx.session.addServiceData.name = text;
    ctx.session.addServiceStep = 'price';
    await ctx.reply(
      `✅ Name: *${text}*\n\n` +
      `💰 Now enter the price (e.g., 50.00 or 50):`,
      { parse_mode: 'Markdown' }
    );
    return true;
  }

  if (step === 'price') {
    // Parse price - accept formats like "50", "50.00", "50,00"
    const normalized = text.replace(',', '.');
    const price = parseFloat(normalized);

    if (isNaN(price) || price < 0 || price > 99999) {
      await ctx.reply('❌ Invalid price. Enter a number (e.g., 50.00):');
      return true;
    }

    const priceCents = Math.round(price * 100);
    ctx.session.addServiceData.price_cents = priceCents;
    ctx.session.addServiceStep = 'billing_unit';

    await ctx.reply(
      `✅ Price: *€${(priceCents / 100).toFixed(2)}*\n\n` +
      `📊 Select the billing type:`,
      {
        parse_mode: 'Markdown',
        reply_markup: addServiceMenu,
      }
    );
    return true;
  }

  return false;
}
