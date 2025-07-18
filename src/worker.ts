import {Worker} from 'bullmq';
import {ExpType, GenerateStatus} from '@prisma/client';
import VideoService from "@/service/VideoService";
import FalAIService from "@/service/FalAIService";
import NotificationController from "@/controller/NotificationController";
import Variables from "@/config/Variables";
import UserService from "@/service/UserService";
import TelegramService from "@/service/TelegramService";
import {Telegraf} from "telegraf";

Variables.boot();

const connectionOptions = {
    host: Variables.REDIS_HOST,
    port: Variables.REDIS_PORT,
    password: Variables.REDIS_PASSWORD,
};

console.log("🚀 Video generation worker (using Fal AI) started...");

const tgBot = new Telegraf(Variables.TELEGRAM_BOT_KEY);
const worker = new Worker('video-generation', async job => {
    const {videoResultId, userId, jobData} = job.data;
    console.log(`[WORKER] Processing job ${job.id} for videoResult: ${videoResultId}`);
    try {
        await VideoService.updateGenerationStatus(videoResultId, GenerateStatus.PROCESSING);
        const result = await FalAIService.generateVideo(jobData);
        const videoUrlFromFal = result.video.url;
        const localVideoUrl = await FalAIService.downloadAndSave(videoUrlFromFal);
        await VideoService.addVideoFiles(videoResultId, [{videoUrl: localVideoUrl, thumbnailUrl: null}]);
        await VideoService.updateGenerationStatus(videoResultId, GenerateStatus.COMPLETED);
        await NotificationController.sendNotification({
            userId,
            title: 'Video Generation Complete!',
            message: `Your video for prompt "${jobData.prompt.substring(0, 30)}..." is now ready.`,
            actionUrl: "/gallery",
            type: 'SUCCESS'
        });
        try {
            const acct = await TelegramService.getTelegramAccountByUserId(userId);
            await tgBot.telegram.sendMessage(
                acct.telegramUserId!,
                `🎬 *Your video is ready!*

\`\`\`
ID:     ${videoResultId}
Prompt: ${jobData.prompt}
\`\`\`

Use /video ${videoResultId} to view it.`,
                {parse_mode: "Markdown"}
            );
        } catch {
        }
        const expAmount = 10;
        await UserService.addExpAndCreateHistory({
            userId,
            amount: expAmount,
            type: ExpType.EARN_SUCCESS_GENERATE,
            description: `You earned ${expAmount} $VEOI for successfully generating a video.`,
            referenceId: videoResultId,
        });

        await NotificationController.sendNotification({
            userId,
            title: `You've earned ${expAmount} $VEOI!`,
            message: `Congratulations! You received ${expAmount} $VEOI for creating a new video.`,
            type: 'SUCCESS'
        });
        console.log(`[WORKER] Job ${job.id} completed successfully.`);
    } catch (error: any) {
        console.error(`[WORKER] Job ${job.id} failed:`, error.message);
        await VideoService.handleFailedGeneration(videoResultId, error.message);
        await NotificationController.sendNotification({
            userId,
            title: 'Video Generation Failed',
            message: `We encountered an error. Your tokens have been refunded.`,
            type: 'ERROR'
        });
        throw error;
    }
}, {connection: connectionOptions});

worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} has failed with error: ${err.message}`);
});