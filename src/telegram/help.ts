import {Context} from "telegraf";

export async function help(ctx: Context) {
    const text =
        `🤖 *Available Commands:*

\`\`\`
/help                             Show this menu
/verify <code>                    Connect your Telegram account
/gallery [page]                   View your video gallery
/detail                           View your account profile
/video <videoId>                  Show details for a video
/generate <prompt>                Generate a new video
\`\`\``;

    await ctx.reply(text, {parse_mode: "Markdown"});
}
