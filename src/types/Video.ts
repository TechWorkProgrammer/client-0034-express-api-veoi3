export interface GenerationOptions {
    userId: string;
    tokensRequired: number;
    prompt: string;
    negativePrompt?: string;
    durationSeconds: number;
    aspectRatio?: string;
    sampleCount?: number;
    generateAudio?: boolean;
    seed?: number;
    enhancePrompt?: boolean;
    personGeneration?: string;
    imagePrompt: string | null;
}

export interface IGetVideosOptions {
    page?: number;
    limit?: number;
    sortBy?: 'newest' | 'views' | 'likes';
    userId?: string;
    favoritedBy?: string;
}