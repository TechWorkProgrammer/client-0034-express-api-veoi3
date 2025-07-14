import {Context} from "telegraf";
import TelegramService from "@/service/TelegramService";
import VideoService from "@/service/VideoService";
import QueueManager from "@/config/QueueManager";

const TOKENS_PER_SECOND = 10;
const TOKENS_PER_SECOND_AUDIO = 5;

export async function generate(ctx: Context) {
    const msg = ctx.message as any;
    if (!msg?.text || typeof msg.text !== "string") return;

    const from = ctx.from;
    if (!from) {
        return ctx.reply("❌ Could not identify you. Please try again.");
    }
    const tgId = from.id.toString();

    const parts = msg.text.trim().split(/\s+/).slice(1);
    const numericDuration = Number(parts[0]);
    const numericSampleCount = Number(parts[1]) || 1;
    const generateAudio = parts[2] === "true";
    const seed = parts[3] || undefined;
    const negativePrompt = parts[4] || undefined;
    const aspectRatio = parts[5] || "16:9";
    const prompt = parts.slice(6).join(" ");

    if (!numericDuration || !prompt) {
        return ctx.reply(
            "ℹ️ Usage:\n" +
            "/generate <durationSeconds> <sampleCount> <generateAudio(true|false)> " +
            "<seed?> <negativePrompt?> <aspectRatio?> <prompt…>"
        );
    }

    const costPerSecond = TOKENS_PER_SECOND + (generateAudio ? TOKENS_PER_SECOND_AUDIO : 0);
    const tokensRequired = numericDuration * costPerSecond * numericSampleCount;

    try {
        const user = await TelegramService.getDetailUserByTelegram(tgId);

        if (user.token < tokensRequired) {
            return ctx.reply(
                `❌ Insufficient tokens. Required: ${tokensRequired}, Available: ${user.token}`
            );
        }

        const {videoResult} = await VideoService.initiateGeneration({
            userId: user.id,
            durationSeconds: numericDuration,
            sampleCount: numericSampleCount,
            imagePrompt: null,
            generateAudio,
            seed,
            negativePrompt,
            aspectRatio,
            prompt,
            tokensRequired,
        });

        await QueueManager.videoQueue.add("generate-video", {
            videoResultId: videoResult.id,
            userId: user.id,
            jobData: {
                seed: seed ? parseInt(seed, 10) : undefined,
                negative_prompt: negativePrompt,
                duration: `${numericDuration}s`,
                generate_audio: generateAudio,
                prompt,
                enhance_prompt: true,
                aspect_ratio: aspectRatio,
            },
        });

        return ctx.reply(
            `⌛ Video generation started. You will be notified when done.\n` +
            `Job ID: ${videoResult.id}`
        );
    } catch (err: any) {
        return ctx.reply(`❌ Failed to start generation: ${err.message}`);
    }
}
