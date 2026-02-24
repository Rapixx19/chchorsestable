/**
 * @module notifications/services
 * @description Telegram notification service
 * @safety RED
 */

import type {
  TelegramSendDocumentInput,
  TelegramSendDocumentResult,
} from '../domain/notification.types';

export async function sendTelegramDocument(
  input: TelegramSendDocumentInput
): Promise<TelegramSendDocumentResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN not set');
  }

  const url = `https://api.telegram.org/bot${token}/sendDocument`;
  const formData = new FormData();
  formData.append('chat_id', input.chatId);
  formData.append(
    'document',
    new Blob([input.document as unknown as BlobPart], { type: 'application/pdf' }),
    input.filename
  );
  if (input.caption) {
    formData.append('caption', input.caption);
  }

  const response = await fetch(url, { method: 'POST', body: formData });
  const data = await response.json();

  if (!response.ok || !data.ok) {
    return { success: false, error: data.description || 'Telegram API error' };
  }

  return { success: true, messageId: data.result?.message_id };
}
