/**
 * @module api/bot
 * @description Telegram webhook endpoint for the GrammY bot
 * @safety RED
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWebhookCallback } from '@/modules/telegram-bot/services/bot.service';

export async function POST(request: NextRequest) {
  try {
    const callback = getWebhookCallback();
    return callback(request);
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Telegram bot webhook is active' });
}
