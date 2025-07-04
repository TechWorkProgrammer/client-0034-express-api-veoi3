import Service from "@/service/Service";
import {GenerationOptions, IGetVideosOptions} from "@/types/Video";
import {FavoriteType, GenerateStatus, Prisma} from "@prisma/client";

class VideoService extends Service {
    public static async initiateGeneration(options: GenerationOptions) {
        try {
            const {userId, tokensRequired, ...restOfOptions} = options;

            return this.prisma.$transaction(async (tx) => {
                await tx.user.update({
                    where: {id: userId},
                    data: {token: {decrement: tokensRequired}}
                });

                if (restOfOptions.seed) {
                    (restOfOptions as any).seed = BigInt(restOfOptions.seed);
                }

                const videoResult = await tx.videoGenerationResult.create({
                    data: {
                        ...restOfOptions,
                        status: 'PENDING'
                    }
                });

                await tx.generateAttempt.create({
                    data: {
                        userId,
                        resultId: videoResult.id,
                        tokensUsed: tokensRequired,
                        status: 'PENDING'
                    }
                });

                await tx.tokenHistory.create({
                    data: {
                        userId: userId,
                        type: 'SPEND',
                        amount: -tokensRequired,
                        description: `Tokens used for video generation: ${videoResult.id}`,
                        referenceId: videoResult.id
                    }
                });

                return {videoResult};
            });
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    public static async updateGenerationStatus(resultId: string, status: GenerateStatus, errorMessage?: string): Promise<void> {
        await this.prisma.$transaction([
            this.prisma.videoGenerationResult.update({
                where: {id: resultId},
                data: {status, errorMessage: errorMessage || null}
            }),
            this.prisma.generateAttempt.updateMany({
                where: {resultId: resultId},
                data: {status, errorMessage: errorMessage || null}
            })
        ]);
    }

    public static async addVideoFiles(resultId: string, files: {
        videoUrl: string,
        thumbnailUrl: string | null
    }[]): Promise<void> {
        await this.prisma.videoFile.createMany({
            data: files.map(file => ({
                videoGenerationResultId: resultId,
                ...file
            }))
        });
    }

    public static async getGenerationResult(resultId: string) {
        try {
            return this.prisma.videoGenerationResult.findFirstOrThrow({
                where: {
                    id: resultId,
                },
                include: {
                    generateAttempts: true,
                    videoFiles: true
                }
            });
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    public static async handleFailedGeneration(resultId: string, errorMessage: string): Promise<void> {
        const attempt = await this.prisma.generateAttempt.findFirst({
            where: {resultId: resultId}
        });

        if (!attempt || !attempt.tokensUsed || attempt.tokensUsed <= 0) {
            await this.updateGenerationStatus(resultId, GenerateStatus.FAILED, errorMessage);
            return;
        }

        await this.prisma.$transaction([
            this.prisma.videoGenerationResult.update({
                where: {id: resultId},
                data: {status: GenerateStatus.FAILED, errorMessage: errorMessage}
            }),
            this.prisma.generateAttempt.update({
                where: {id: attempt.id},
                data: {status: GenerateStatus.FAILED, errorMessage: errorMessage}
            }),
            this.prisma.user.update({
                where: {id: attempt.userId},
                data: {token: {increment: attempt.tokensUsed}}
            }),
            this.prisma.tokenHistory.create({
                data: {
                    userId: attempt.userId,
                    type: 'REFUND_TOKEN',
                    amount: attempt.tokensUsed,
                    description: `Refund for failed video generation: ${resultId}`,
                    referenceId: resultId
                }
            })
        ]);
    }

    public static async getVideos(options: IGetVideosOptions) {
        try {
            const {page = 1, limit = 12, sortBy = 'newest', userId, favoritedBy, type = 'DEFAULT'} = options;

            let orderBy: Prisma.VideoGenerationResultOrderByWithRelationInput = {createdAt: 'desc'};
            if (sortBy === 'views') orderBy = {views: 'desc'};
            if (sortBy === 'likes') orderBy = {favorites: {_count: 'desc'}};

            const where: Prisma.VideoGenerationResultWhereInput = {
                status: 'COMPLETED',
                deletedAt: null,
                generateAttempts: userId ? {some: {userId: userId}} : undefined,
                favorites: favoritedBy ? {some: {userId: favoritedBy, type: type as FavoriteType,}} : undefined
            };

            const [total, videos] = await this.prisma.$transaction([
                this.prisma.videoGenerationResult.count({where}),
                this.prisma.videoGenerationResult.findMany({
                    where,
                    skip: (page - 1) * limit,
                    take: limit,
                    orderBy,
                    include: {
                        videoFiles: true,
                        _count: {select: {favorites: true}}
                    }
                })
            ]);

            return {videos, pagination: {total, totalPages: Math.ceil(total / limit), currentPage: page, limit}};
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    public static async incrementViewCount(videoId: string) {
        try {
            return this.prisma.videoGenerationResult.update({
                where: {id: videoId},
                data: {views: {increment: 1}},
            });
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    public static async toggleLike(userId: string, resultId: string, type: FavoriteType) {
        try {
            const existing = await this.prisma.favorite.findUnique({
                where: {
                    userId_resultId_type: {userId, resultId, type},
                },
            });

            if (existing) {
                await this.prisma.favorite.delete({where: {id: existing.id}});
                return {liked: false};
            } else {
                await this.prisma.favorite.create({
                    data: {userId, resultId, type},
                });
                return {liked: true};
            }
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    public static async getVideoWithAuthor(videoId: string) {
        try {
            return this.prisma.videoGenerationResult.findUnique({
                where: {id: videoId},
                include: {
                    generateAttempts: {
                        select: {
                            userId: true
                        },
                        take: 1
                    }
                }
            });
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    public static async getDetailsById(videoId: string, userId: string): Promise<{
        isFavorited: boolean;
        isGalleryFavorite: boolean;
        favoriteCount: number;
    }> {
        try {
            const [defaultFav, galleryFav, defaultCount] = await this.prisma.$transaction([
                this.prisma.favorite.findFirst({
                    where: {
                        userId,
                        resultId: videoId,
                        type: FavoriteType.DEFAULT,
                    },
                }),
                this.prisma.favorite.findFirst({
                    where: {
                        userId,
                        resultId: videoId,
                        type: FavoriteType.GALLERY,
                    },
                }),
                this.prisma.favorite.count({
                    where: {
                        resultId: videoId,
                        type: FavoriteType.DEFAULT,
                    },
                }),
            ]);

            return {
                isFavorited: Boolean(defaultFav),
                isGalleryFavorite: Boolean(galleryFav),
                favoriteCount: defaultCount,
            };
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }
}

export default VideoService;