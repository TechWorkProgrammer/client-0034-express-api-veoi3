import {Context} from "telegraf";
import TelegramService from "@/service/TelegramService";

export async function verify(ctx: Context) {
    const msg = ctx.message as any;
    if (!msg?.text || typeof msg.text !== "string") {
        return;
    }
    const text: string = msg.text.trim();

    if (!ctx.from) {
        return ctx.reply("❌ Could not identify you. Please try again.");
    }
    const tgId = ctx.from.id.toString();
    const username = ctx.from.username ?? undefined;

    const parts = text.split(/\s+/).slice(1);
    const code = parts[0];
    if (!code) {
        return ctx.reply("ℹ️ Usage: /verify <code>");
    }

    try {
        await TelegramService.handleBotStart(code, tgId, username);
        return ctx.reply("✅ Telegram successfully verified and connected!");
    } catch (err: any) {
        return ctx.reply(`❌ Verification failed: ${err.message}`);
    }
}
