import {Context} from "telegraf";
import TelegramService from "@/service/TelegramService";
import VideoService from "@/service/VideoService";
import QueueManager from "@/config/QueueManager";

const DEFAULT_DURATION = 8;
const SAMPLE_COUNT = 1;
const TOKENS_PER_SECOND = 15;
const ASPECT_RATIO = "16:9";
const GENERATE_AUDIO = true;
const SEED = undefined;
const NEGATIVE_PROMPT = undefined;

export async function generate(ctx: Context) {
    const msg = ctx.message as any;
    if (!msg?.text || typeof msg.text !== "string") return;

    const from = ctx.from;
    if (!from) {
        return ctx.reply("❌ Could not identify you. Please try again.");
    }
    const tgId = from.id.toString();

    const args = msg.text.trim().split(/\s+/).slice(1);
    const prompt = args.join(" ");
    if (!prompt) {
        return ctx.reply("ℹ️ Usage: /generate <your prompt here>");
    }

    const tokensRequired = DEFAULT_DURATION * TOKENS_PER_SECOND * SAMPLE_COUNT;

    try {
        const user = await TelegramService.getDetailUserByTelegram(tgId);
        if (user.token < tokensRequired) {
            return ctx.reply(
                `❌ Insufficient tokens. Required: ${tokensRequired}, Available: ${user.token}`
            );
        }

        const {videoResult} = await VideoService.initiateGeneration({
            userId: user.id,
            durationSeconds: DEFAULT_DURATION,
            sampleCount: SAMPLE_COUNT,
            imagePrompt: null,
            generateAudio: GENERATE_AUDIO,
            seed: SEED,
            negativePrompt: NEGATIVE_PROMPT,
            aspectRatio: ASPECT_RATIO,
            prompt,
            tokensRequired,
        });

        await QueueManager.videoQueue.add("generate-video", {
            videoResultId: videoResult.id,
            userId: user.id,
            jobData: {
                seed: SEED,
                negative_prompt: NEGATIVE_PROMPT,
                duration: `${DEFAULT_DURATION}s`,
                generate_audio: GENERATE_AUDIO,
                prompt,
                enhance_prompt: true,
                aspect_ratio: ASPECT_RATIO,
            },
        });

        return ctx.reply(
            `⌛ Video generation started. You will be notified when done.\nJob ID: ${videoResult.id}`
        );
    } catch (err: any) {
        return ctx.reply(`❌ Failed to start generation: ${err.message}`);
    }
}
