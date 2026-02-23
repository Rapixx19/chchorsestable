import "dotenv/config";
import TelegramBot from "node-telegram-bot-api";
import { createClient } from "@supabase/supabase-js";

const token = process.env.TELEGRAM_BOT_TOKEN!;
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!token) throw new Error("TELEGRAM_BOT_TOKEN missing");
if (!supabaseUrl) throw new Error("SUPABASE_URL missing");
if (!supabaseKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");

const supabase = createClient(supabaseUrl, supabaseKey);

const bot = new TelegramBot(token, {
  polling: true,
});

console.log("Telegram bot running...");

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "🐴 Welcome to CHC\n\nSend:\n/link YOUR_CLIENT_ID\n\nto connect your account."
  );
});

bot.onText(/\/link (.+)/, async (msg, match) => {
  const clientId = match?.[1];
  const chatId = msg.chat.id.toString();

  if (!clientId) {
    bot.sendMessage(msg.chat.id, "❌ Missing client ID");
    return;
  }

  try {
    const { error } = await supabase
      .from("clients")
      .update({ telegram_chat_id: chatId })
      .eq("id", clientId);

    if (error) throw error;

    bot.sendMessage(msg.chat.id, "✅ Telegram linked successfully!");
  } catch (err) {
    console.error(err);
    bot.sendMessage(msg.chat.id, "❌ Failed to link account");
  }
});
