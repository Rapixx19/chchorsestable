-- Migration: Add owner_telegram_chat_id to stables
-- Allows stable owners to authenticate via Telegram for manager mode

ALTER TABLE stables
ADD COLUMN owner_telegram_chat_id TEXT;

-- Index for fast lookups when authenticating via Telegram
CREATE INDEX idx_stables_owner_telegram
ON stables(owner_telegram_chat_id)
WHERE owner_telegram_chat_id IS NOT NULL;
