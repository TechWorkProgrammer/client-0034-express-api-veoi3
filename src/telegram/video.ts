import {Context, Markup} from "telegraf";
import TelegramService from "@/service/TelegramService";
import VideoService from "@/service/VideoService";

export async function video(ctx: Context) {
    let data: string | undefined;
    if (
        ctx.callbackQuery &&
        "data" in ctx.callbackQuery
    ) {
        data = ctx.callbackQuery.data;
    } else if (
        ctx.message &&
        typeof (ctx.message as any).text === "string"
    ) {
        data = (ctx.message as any).text;
    }
    if (!data) {
        return ctx.reply("ℹ️ Usage: /video <videoId>");
    }

    const vid = data.trim().split(/\s+|_/).pop();
    if (!vid) {
        return ctx.reply("ℹ️ Usage: /video <videoId>");
    }

    if (!ctx.from) {
        return ctx.reply("❌ Could not identify you. Please try again.");
    }
    const tgId = ctx.from.id.toString();

    try {
        const user = await TelegramService.getDetailUserByTelegram(tgId);
        const video = await VideoService.getGenerationResult(vid);

        const ownerId = video.generateAttempts?.[0]?.userId;
        if (ownerId !== user.id) {
            return ctx.reply("❌ Video not found or not yours.");
        }

        const info =
            `🎬 *Video Detail*\n` +
            `• ID: \`${video.id}\`\n` +
            `• Prompt: _${video.prompt}_\n` +
            `• Status: \`${video.status}\`\n` +
            `• Duration: \`${video.durationSeconds}s\`\n` +
            `• Samples: \`${video.sampleCount}\`\n` +
            `• Views: \`${video.views}\``;

        const buttons = [];
        if (video.videoFiles.length > 0) {
            buttons.push(
                Markup.button.url("▶️ Watch Video", video.videoFiles[0].videoUrl)
            );
            if (video.videoFiles[0].thumbnailUrl) {
                buttons.push(
                    Markup.button.url("🖼️ View Thumbnail", video.videoFiles[0].thumbnailUrl)
                );
            }
        }

        return ctx.reply(info, {
            parse_mode: "Markdown",
            ...Markup.inlineKeyboard([buttons]),
        });
    } catch (err: any) {
        return ctx.reply(`❌ Failed to fetch video detail: ${err.message}`);
    }
}
