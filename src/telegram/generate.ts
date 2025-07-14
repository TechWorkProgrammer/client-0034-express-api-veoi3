import {Context} from "telegraf";
import TelegramService from "@/service/TelegramService";
import VideoService from "@/service/VideoService";
import QueueManager from "@/config/QueueManager";

const TOKENS_PER_SECOND = 10;
const TOKENS_PER_SECOND_AUDIO = 5;
const DEFAULT_DURATION = 8;
const SAMPLE_COUNT = 1;

export async function generate(ctx: Context) {
    const msg = ctx.message as any;
    if (!msg?.text || typeof msg.text !== "string") return;

    const from = ctx.from;
    if (!from) {
        return ctx.reply("❌ Could not identify you. Please try again.");
    }
    const tgId = from.id.toString();

    const args = msg.text.trim().split(/\s+/).slice(1);
    if (args.length === 0) {
        return ctx.reply(
            "ℹ️ Usage:\n" +
            "/generate <prompt…> <generateAudio?> <seed?> <negativePrompt?> <aspectRatio?>"
        );
    }

    const aspectRatio = args.length >= 5 ? args[args.length - 1] : "16:9";
    const negativePrompt = args.length >= 4 ? args[args.length - 2] : undefined;
    const seed = args.length >= 3 ? args[args.length - 3] : undefined;
    const generateAudio = args.length >= 2 ? args[args.length - 4] === "true" : false;

    const prompt = args.slice(0, args.length - 4).join(" ") || args.join(" ");
    if (!prompt) {
        return ctx.reply("❌ Prompt is required. Please try again.");
    }

    const costPerSecond = TOKENS_PER_SECOND + (generateAudio ? TOKENS_PER_SECOND_AUDIO : 0);
    const tokensRequired = DEFAULT_DURATION * costPerSecond * SAMPLE_COUNT;

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
                duration: `${DEFAULT_DURATION}s`,
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
