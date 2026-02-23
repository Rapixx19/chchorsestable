/**
 * @module notifications/domain
 * @description Type definitions for notification services
 * @safety RED
 */

export interface TelegramSendDocumentInput {
  chatId: string;
  document: Uint8Array;
  filename: string;
  caption?: string;
}

export interface TelegramSendDocumentResult {
  success: boolean;
  messageId?: number;
  error?: string;
}
