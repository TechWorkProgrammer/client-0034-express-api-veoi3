import {Request, Response as EResponse} from "express";
import Response from "@/config/Response";
import VideoService from "@/service/VideoService";
import {moveAndStoreImage} from "@/config/Multer";
import QueueManager from "@/config/QueueManager";
import NotificationController from "@/controller/NotificationController";

const TOKENS_PER_SECOND = 10;
const TOKENS_PER_SECOND_AUDIO = 5;

class VideoController {
    public static async generate(req: Request, res: EResponse): Promise<void> {
        const user = res.locals.user;
        const file = req.file;
        const {durationSeconds, sampleCount, generateAudio, seed, negativePrompt, prompt, aspectRatio, ...restOfBody} = req.body;

        const numericDuration = Number(durationSeconds);
        const numericSampleCount = Number(sampleCount) || 1;
        const costPerSecond = TOKENS_PER_SECOND + (generateAudio === 'true' ? TOKENS_PER_SECOND_AUDIO : 0);
        const tokensRequired = (numericDuration * costPerSecond) * numericSampleCount;

        if (user.token < tokensRequired) {
            Response.BadRequest(res, `Insufficient tokens. Required: ${tokensRequired}, Available: ${user.token}`);
            return;
        }

        const imagePromptUrl = file ? await moveAndStoreImage(file) : null;

        try {
            const {videoResult} = await VideoService.initiateGeneration({
                userId: user.id,
                ...restOfBody,
                seed: seed,
                negativePrompt: negativePrompt,
                durationSeconds: numericDuration,
                sampleCount: numericSampleCount,
                generateAudio: generateAudio === 'true',
                imagePrompt: imagePromptUrl,
                tokensRequired: tokensRequired,
                prompt: prompt,
                aspectRatio: aspectRatio
            });

            await QueueManager.videoQueue.add('generate-video', {
                videoResultId: videoResult.id,
                userId: user.id,
                jobData: {
                    seed: parseInt(seed),
                    negative_prompt: negativePrompt,
                    duration: numericDuration + "s",
                    generate_audio: generateAudio === 'true',
                    imageUrl: imagePromptUrl,
                    prompt: prompt,
                    enhance_prompt: true,
                    aspect_ratio: aspectRatio
                }
            });

            Response.Accepted(res, "Video generation started. You will be notified.", {resultId: videoResult.id});

        } catch (error: any) {
            Response.BadRequest(res, error.message);
        }
    }

    public static async getPublicVideos(req: Request, res: EResponse): Promise<void> {
        const result = await VideoService.getVideos(req.query);
        const serializedVideos = result.videos.map(video => {
            return {
                ...video,
                seed: video.seed ? video.seed.toString() : null,
            };
        });

        const finalResult = {
            ...result,
            videos: serializedVideos,
        };

        Response.Success(res, "Videos retrieved successfully", finalResult);
    }

    public static async getUserVideos(req: Request, res: EResponse): Promise<void> {
        const user = res.locals.user;
        const result = await VideoService.getVideos({...req.query, userId: user.id});

        const serializedVideos = result.videos.map(video => {
            return {
                ...video,
                seed: video.seed ? video.seed.toString() : null,
            };
        });

        const finalResult = {
            ...result,
            videos: serializedVideos,
        };

        Response.Success(res, "User videos retrieved successfully", finalResult);
    }

    public static async incrementView(req: Request, res: EResponse): Promise<void> {
        const {videoId} = req.params;
        VideoService.incrementViewCount(videoId).catch(err => console.error(err));
        Response.Success(res, "View count updated.");
    }

    public static async toggleLike(req: Request, res: EResponse): Promise<void> {
        const {videoId} = req.params;
        const {type} = req.body as { type: "DEFAULT" | "GALLERY" };
        const liker = res.locals.user;

        const result = await VideoService.toggleLike(liker.id, videoId, type);

        if (result.liked) {
            const video = await VideoService.getVideoWithAuthor(videoId);
            const ownerId = video?.generateAttempts?.[0]?.userId;
            if (ownerId && ownerId !== liker.id) {
                await NotificationController.sendNotification({
                    userId: ownerId,
                    title: `You've got a new ${type === "GALLERY" ? "gallery-" : ""}like!`,
                    message: `${liker.username} liked your video: "${video.prompt.substring(0, 40)}..."`,
                    type: "INFO",
                });
            }
        }

        Response.Success(
            res,
            `Video ${result.liked ? "liked" : "unliked"} successfully.`,
            {liked: result.liked, type}
        );
    }

    public static async getResultById(req: Request, res: EResponse): Promise<void> {
        const {resultId} = req.params;

        const result = await VideoService.getGenerationResult(resultId);
        if (!result) {
            Response.NotFound(res, "Generation result not found or you don't have access.");
            return;
        }
        const serializedResult = {
            ...result,
            seed: result.seed ? result.seed.toString() : null,
        };

        Response.Success(res, "Result retrieved successfully", serializedResult);
    }

    public static async getFavoriteVideos(req: Request, res: EResponse): Promise<void> {
        const user = res.locals.user;
        const result = await VideoService.getVideos({...req.query, favoritedBy: user.id});
        const serializedVideos = result.videos.map(video => {
            return {
                ...video,
                seed: video.seed ? video.seed.toString() : null,
            };
        });
        const finalResult = {
            ...result,
            videos: serializedVideos,
        };

        Response.Success(res, "Favorite videos retrieved successfully", finalResult);
    }

    public static async getVideoDetails(req: Request, res: EResponse): Promise<void> {
        const {videoId} = req.params;
        const userId = res.locals.user.id;

        const videoDetails = await VideoService.getDetailsById(videoId, userId);

        Response.Success(res, "Video details fetched successfully", videoDetails);
    }
}

export default VideoController;