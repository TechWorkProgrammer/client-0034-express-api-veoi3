import {Context, Markup} from "telegraf";
import TelegramService from "@/service/TelegramService";
import VideoService from "@/service/VideoService";

export async function video(ctx: Context) {
    let videoId: string | undefined;

    if (ctx.callbackQuery && "data" in ctx.callbackQuery) {
        const cbData = ctx.callbackQuery.data;
        if (cbData.startsWith("video_")) {
            videoId = cbData.replace("video_", "").trim();
        }
    }

    if (!videoId && ctx.message && "text" in ctx.message) {
        const parts = ctx.message.text.trim().split(/\s+/);
        if (parts.length >= 2) {
            videoId = parts[1];
        }
    }

    if (!videoId) {
        return ctx.reply("ℹ️ Usage: /video <videoId> or click a gallery button.");
    }

    if (!ctx.from) {
        return ctx.reply("❌ Could not identify you. Please try again.");
    }
    const tgId = ctx.from.id.toString();

    try {
        const user = await TelegramService.getDetailUserByTelegram(tgId);
        const video = await VideoService.getGenerationResult(videoId);

        const ownerId = video.generateAttempts?.[0]?.userId;
        if (ownerId !== user.id) {
            return ctx.reply("❌ Video not found or not yours.");
        }

        const info =
            `🎬 *Video Detail*
        
            \`\`\`
            ID:       ${video.id}
            Prompt:   ${video.prompt}
            Status:   ${video.status}
            Duration: ${video.durationSeconds}s
            Samples:  ${video.sampleCount}
            Views:    ${video.views}
            \`\`\``;

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
