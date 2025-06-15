import {Request, Response as EResponse} from "express";
import Response from "@/config/Response";
import VideoService from "@/service/VideoService";
import {moveAndStoreImage} from "@/config/Multer";
import QueueManager from "@/config/QueueManager";
import {readFileSync} from 'fs';
import NotificationController from "@/controller/NotificationController";

const TOKENS_PER_SECOND = 10;

class VideoController {
    public static async generate(req: Request, res: EResponse): Promise<void> {
        const user = res.locals.user;
        const file = req.file;
        const {sampleCount, generateAudio, durationSeconds, ...restOfBody} = req.body;
        const numericDuration = Number(durationSeconds);

        const tokensRequired = numericDuration * TOKENS_PER_SECOND;
        if (user.token < tokensRequired) {
            Response.BadRequest(res, `Insufficient tokens. Required: ${tokensRequired}, Available: ${user.token}`);
            return;
        }

        let imagePromptUrl: string | null = null;
        if (file) {
            imagePromptUrl = await moveAndStoreImage(file);
        }

        const imageBase64 = file ? readFileSync(file.path, 'base64') : null;

        const {videoResult} = await VideoService.initiateGeneration({
            userId: user.id,
            ...restOfBody,
            sampleCount: Number(sampleCount),
            generateAudio: generateAudio === 'true',
            durationSeconds: numericDuration,
            imagePrompt: imagePromptUrl,
            tokensRequired: tokensRequired,
        });

        await QueueManager.videoQueue.add('generate-video', {
            videoResultId: videoResult.id,
            userId: user.id,
            jobData: {
                ...restOfBody,
                durationSeconds: numericDuration,
                image: imageBase64 ? {bytesBase64Encoded: imageBase64, mimeType: file?.mimetype} : undefined,
            }
        });

        Response.Accepted(res, "Video generation started. You will be notified.", {resultId: videoResult.id});
    }

    public static async getPublicVideos(req: Request, res: EResponse): Promise<void> {
        const result = await VideoService.getVideos(req.query);
        Response.Success(res, "Videos retrieved successfully", result);
    }

    public static async getUserVideos(req: Request, res: EResponse): Promise<void> {
        const user = res.locals.user;
        const result = await VideoService.getVideos({...req.query, userId: user.id});
        Response.Success(res, "User videos retrieved successfully", result);
    }

    public static async incrementView(req: Request, res: EResponse): Promise<void> {
        const {videoId} = req.params;
        VideoService.incrementViewCount(videoId).catch(err => console.error(err));
        Response.Success(res, "View count updated.");
    }

    public static async toggleLike(req: Request, res: EResponse): Promise<void> {
        const {videoId} = req.params;
        const liker = res.locals.user;

        const result = await VideoService.toggleLike(liker.id, videoId);

        if (result.liked) {
            const video = await VideoService.getVideoWithAuthor(videoId);

            if (video && video.generateAttempts && video.generateAttempts.length > 0) {

                const videoOwnerId = video.generateAttempts[0].userId;

                if (videoOwnerId && videoOwnerId !== liker.id) {
                    await NotificationController.sendNotification({
                        userId: videoOwnerId,
                        title: "You've got a new like! 👍",
                        message: `${liker.username} liked your video: "${video.prompt.substring(0, 40)}..."`,
                        type: 'INFO',
                        actionUrl: `/video/${video.id}`
                    });
                }
            }
        }

        Response.Success(res, `Video ${result.liked ? 'liked' : 'unliked'} successfully.`, result);
    }

    public static async getResultById(req: Request, res: EResponse): Promise<void> {
        const {resultId} = req.params;
        const user = res.locals.user;

        const result = await VideoService.getGenerationResult(resultId, user.id);
        if (!result) {
            Response.NotFound(res, "Generation result not found or you don't have access.");
            return;
        }
        Response.Success(res, "Result retrieved successfully", result);
    }
}

export default VideoController;