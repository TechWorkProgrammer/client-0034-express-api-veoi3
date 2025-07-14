import {Context, Markup} from "telegraf";
import TelegramService from "@/service/TelegramService";
import VideoService from "@/service/VideoService";

export async function gallery(ctx: Context) {
    let page = 1;

    if (
        ctx.callbackQuery &&
        "data" in ctx.callbackQuery &&
        ctx.callbackQuery.data.startsWith("gallery_")
    ) {
        page = parseInt(ctx.callbackQuery.data.split("_")[1], 10) || 1;
    } else {
        const msg = ctx.message as any;
        if (!msg?.text || typeof msg.text !== "string") return;
        const parts = msg.text.trim().split(/\s+/).slice(1);
        page = Math.max(1, parseInt(parts[0] || "1", 10));
    }

    if (!ctx.from) {
        return ctx.reply("❌ Could not identify you. Please try again.");
    }
    const tgId = ctx.from.id.toString();

    try {
        const user = await TelegramService.getDetailUserByTelegram(tgId);
        const {videos, pagination} = await VideoService.getVideos({
            userId: user.id,
            page,
            limit: 5,
            sortBy: "newest",
        });

        if (videos.length === 0) {
            return ctx.reply(`📂 You have no videos on page ${page}.`);
        }

        const header = `📁 *Your Gallery* (Page ${pagination.currentPage}/${pagination.totalPages}):`;
        const rows = videos.map(v =>
            [Markup.button.callback(
                v.prompt.length > 20 ? `${v.prompt.slice(0, 20)}…` : v.prompt,
                `video_${v.id}`
            )]
        );
        if (pagination.currentPage < pagination.totalPages) {
            rows.push([
                Markup.button.callback(
                    `➡️ Page ${pagination.currentPage + 1}`,
                    `gallery_${pagination.currentPage + 1}`
                )
            ]);
        }

        return ctx.reply(header, {
            parse_mode: "Markdown",
            ...Markup.inlineKeyboard(rows),
        });
    } catch (err: any) {
        return ctx.reply(`❌ Failed to fetch gallery: ${err.message}`);
    }
}
