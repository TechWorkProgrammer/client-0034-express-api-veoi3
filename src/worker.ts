import { Worker } from 'bullmq';
import { GenerateStatus } from '@prisma/client';
import VideoService from "@/service/VideoService";
import FalAIService from "@/service/FalAIService";
import NotificationController from "@/controller/NotificationController";
import Variables from "@/config/Variables";

Variables.boot();

const connectionOptions = {
    host: Variables.REDIS_HOST,
    port: Variables.REDIS_PORT,
    password: Variables.REDIS_PASSWORD,
};

console.log("🚀 Video generation worker (using Fal AI) started...");

const worker = new Worker('video-generation', async job => {
    const { videoResultId, userId, jobData } = job.data;
    console.log(`[WORKER] Processing job ${job.id} for videoResult: ${videoResultId}`);
    try {
        await VideoService.updateGenerationStatus(videoResultId, GenerateStatus.PROCESSING);
        const result = await FalAIService.generateVideo(jobData);
        const videoUrlFromFal = result.video.url;
        const localVideoUrl = await FalAIService.downloadAndSave(videoUrlFromFal);
        await VideoService.addVideoFiles(videoResultId, [{ videoUrl: localVideoUrl, thumbnailUrl: null }]);
        await VideoService.updateGenerationStatus(videoResultId, GenerateStatus.COMPLETED);
        await NotificationController.sendNotification({
            userId,
            title: 'Video Generation Complete!',
            message: `Your video for prompt "${jobData.prompt.substring(0, 30)}..." is now ready.`,
            actionUrl: "/gallery",
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
}, { connection: connectionOptions });

worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} has failed with error: ${err.message}`);
});