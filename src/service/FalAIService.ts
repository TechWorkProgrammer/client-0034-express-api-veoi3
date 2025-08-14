import {fal, Result} from '@fal-ai/client';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import {v4 as uuidv4} from 'uuid';
import Service from "@/service/Service";
import Variables from '@/config/Variables';
import {spawn} from 'child_process';
import crypto from 'crypto';
import {pipeline} from 'stream/promises';
import os from 'os';

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


async function ensureWritableDir(dir: string): Promise<string> {
    try {
        await fs.promises.mkdir(dir, {recursive: true});
        await fs.promises.access(dir, fs.constants.W_OK);
        return dir;
    } catch {
        const fallback = os.tmpdir();
        await fs.promises.access(fallback, fs.constants.W_OK);
        return fallback;
    }
}

async function downloadFile(url: string, outPath: string): Promise<void> {
    const resp = await axios.get(url, {
        responseType: 'stream',
        timeout: 60_000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
    });
    await fs.promises.mkdir(path.dirname(outPath), {recursive: true});
    const writer = fs.createWriteStream(outPath);
    await pipeline(resp.data, writer);
}

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
        const outAbsPath = path.join(process.cwd(), Variables.ASSETS_VIDEO_PATH, uniqueFileName);
        const outPublicUrl = `${Variables.BASE_URL}/${path.join(Variables.ASSETS_VIDEO_PATH, uniqueFileName).replace(/\\/g, '/')}`;

        const tempRoot = await ensureWritableDir(Variables.TEMP_PATH);
        const tmpVid = path.join(tempRoot, `veo3_${crypto.randomBytes(6).toString('hex')}.mp4`);
        const tmpPng = path.join(tempRoot, `wm_${crypto.randomBytes(6).toString('hex')}.png`);

        await downloadFile(videoUrl, tmpVid);
        await downloadFile('https://veoi3.app/icon_watermark.png', tmpPng);

        await fs.promises.mkdir(path.dirname(outAbsPath), {recursive: true});

        const wmFile = tmpPng.replace(/\\/g, '/');

        const ffArgs = [
            '-y',
            '-i', tmpVid,
            '-filter_complex',
            "movie=" + wmFile + "[wmraw];" +
            "[wmraw][0:v]scale2ref=w=main_w*0.35:h=-1[wm][base];" +
            "[base][wm]overlay=x=main_w*0.75 - w/2:y=main_h - h - main_h*0.05:format=auto[vout]",
            '-map', '[vout]',
            '-map', '0:a?',
            '-c:v', 'libx264',
            '-crf', '18',
            '-preset', 'veryfast',
            '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart',
            '-c:a', 'copy',
            outAbsPath
        ];

        await new Promise<void>((resolve, reject) => {
            const ff = spawn('ffmpeg', ffArgs);
            ff.stdout.on('data', d => process.stdout.write(d));
            ff.stderr.on('data', d => process.stderr.write(d));
            ff.on('error', reject);
            ff.on('close', code => code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}`)));
        });

        try {
            await fs.promises.unlink(tmpVid);
        } catch {
        }
        try {
            await fs.promises.unlink(tmpPng);
        } catch {
        }

        return outPublicUrl;
    }
}

export default FalAIService;