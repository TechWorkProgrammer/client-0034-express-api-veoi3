import {Telegraf} from "telegraf";
import * as TeleHandlers from "@/telegram";
import Variables from "@/config/Variables";

export default class TelegramBot {
    private static bot: Telegraf;

    public static boot(): void {
        this.bot = new Telegraf(Variables.TELEGRAM_BOT_KEY);

        this.bot.command("help", TeleHandlers.help);
        this.bot.command("start", TeleHandlers.help);
        this.bot.command("verify", TeleHandlers.verify);
        this.bot.command("gallery", TeleHandlers.gallery).action(/^gallery_(\d+)$/, TeleHandlers.gallery);
        this.bot.command("detail", TeleHandlers.detail);
        this.bot.command("generate", TeleHandlers.generate);
        this.bot.command("video", TeleHandlers.video).action(/^video_(.+)$/, TeleHandlers.video);

        this.bot.catch((err: any, ctx) => {
            console.error("Telegram Bot Error:", err);
            ctx.reply(`⚠️ An error occurred: ${err.message}`).then();
        });

        this.bot
            .launch()
            .then(() => console.log("📡 Telegram bot launched"))
            .catch(err => console.error("❌ Bot launch failed:", err));
    }
}