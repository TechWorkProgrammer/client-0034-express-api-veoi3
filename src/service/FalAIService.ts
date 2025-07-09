import {fal, Result} from '@fal-ai/client';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import {v4 as uuidv4} from 'uuid';
import Service from "@/service/Service";
import Variables from '@/config/Variables';

const toSnakeCase = (obj: any) => {
    const newObj: { [key: string]: any } = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            newObj[snakeKey] = obj[key];
        }
    }
    return newObj;
};

class FalAIService extends Service {
    public static async generateVideo(jobData: any): Promise<any> {
        const {prompt, imageUrl, ...rest} = jobData;
        const input: Record<string, any> = {...toSnakeCase(rest), prompt};

        if (imageUrl) {
            console.log(`[FalAIService] imageUrl provided, downloading…`);
            try {
                console.log(`[FalAIService] download image from : ${imageUrl}`);
                const resp = await axios.get(imageUrl, {responseType: 'arraybuffer'});
                console.log(resp.data);
                const buffer = Buffer.from(resp.data);
                console.log(
                    `[FalAIService] Downloaded image buffer (${buffer.length} bytes)`
                );
                console.log('[FalAIService] Uploading image stream to Fal storage…');
                const uploadUrl: string = await fal.storage.upload(buffer as unknown as Blob);
                console.log(`[FalAIService] Got image_url: ${uploadUrl}`);
                input.url = uploadUrl;
            } catch (err: any) {
                console.error(
                    `[FalAIService] Error handling imageUrl "${imageUrl}":`,
                    err
                );
                throw new Error(
                    'Failed to download or upload the provided image URL.'
                );
            }
        }

        console.log(`[FalAIService] Sending request to fal-ai/veo3 with input:`, input);
        const result: Result<any> = await fal.subscribe("fal-ai/veo3", {
            input,
            logs: true,
            onQueueUpdate(update) {
                console.log(`[FalAIService] Queue Update: Status=${update.status}`);
            },
        });

        if (!result?.data?.video?.url) {
            console.error("Fal AI returned an unexpected structure:", result);
            throw new Error("Fal AI did not return a valid video object with a URL.");
        }
        return result.data;
    }

    public static async downloadAndSave(videoUrl: string): Promise<string> {
        const uniqueFileName = `${uuidv4()}.mp4`;
        const localFilePath = path.join(process.cwd(), Variables.ASSETS_VIDEO_PATH, uniqueFileName);

        console.log(`[FalAIService] Downloading video from ${videoUrl}...`);

        const writer = fs.createWriteStream(localFilePath);
        const response = await axios({
            url: videoUrl,
            method: 'GET',
            responseType: 'stream'
        });

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                console.log(`[FalAIService] Saved video locally to ${localFilePath}`);
                const relativePath = `${Variables.BASE_URL}/${path.join(Variables.ASSETS_VIDEO_PATH, uniqueFileName).replace(/\\/g, '/')}`;
                resolve(relativePath);
            });
            writer.on('error', reject);
        });
    }
}

export default FalAIService;