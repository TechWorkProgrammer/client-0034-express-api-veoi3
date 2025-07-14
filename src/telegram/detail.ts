import {Context} from "telegraf";
import TelegramService from "@/service/TelegramService";

export async function detail(ctx: Context) {
    const msg = ctx.message as any;
    if (!msg?.text || typeof msg.text !== "string") return;

    const from = ctx.from;
    if (!from) {
        return ctx.reply("❌ Could not identify you. Please try again.");
    }

    try {
        const user = await TelegramService.getDetailUserByTelegram(from.id.toString());

        const profileText =
            `👤 *Your Profile*

\`\`\`
ID:       ${user.id}
Username: ${user.username}
Address:  ${user.address}
Points:   ${user.point}
Tokens:   ${user.token}
\`\`\``;

        if (user.profileImage) {
            await ctx.replyWithPhoto(user.profileImage, {
                caption: profileText,
                parse_mode: "Markdown",
            });
        } else {
            await ctx.reply(profileText, {
                parse_mode: "Markdown",
            });
        }
    } catch (err: any) {
        await ctx.reply(`❌ ${err.message}`);
    }
}
