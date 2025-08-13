import {fal, Result} from '@fal-ai/client';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import {v4 as uuidv4} from 'uuid';
import Service from "@/service/Service";
import Variables from '@/config/Variables';
import {spawn} from 'child_process';
import os from 'os';
import crypto from 'crypto';

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
        const outAbsPath = path.join(process.cwd(), Variables.ASSETS_VIDEO_PATH, uniqueFileName);
        const outPublicUrl = `${Variables.BASE_URL}/${path.join(Variables.ASSETS_VIDEO_PATH, uniqueFileName).replace(/\\/g, '/')}`;

        const tmpDir = os.tmpdir();
        const tmpVid = path.join(tmpDir, `veo3_${crypto.randomBytes(6).toString('hex')}.mp4`);
        const tmpPng = path.join(tmpDir, `wm_${crypto.randomBytes(6).toString('hex')}.png`);

        console.log(`[FalAIService] Downloading video to ${tmpVid}...`);
        await new Promise<void>(async (resolve, reject) => {
            const writer = fs.createWriteStream(tmpVid);
            try {
                const resp = await axios({url: videoUrl, method: 'GET', responseType: 'stream'});
                resp.data.pipe(writer);
                writer.on('finish', () => resolve());
                writer.on('error', reject);
            } catch (e) {
                reject(e);
            }
        });

        const watermarkUrl = 'https://veoi3.app/icon_watermark.png';
        console.log(`[FalAIService] Downloading watermark from ${watermarkUrl}...`);
        await new Promise<void>(async (resolve, reject) => {
            const writer = fs.createWriteStream(tmpPng);
            try {
                const resp = await axios({url: watermarkUrl, method: 'GET', responseType: 'stream'});
                resp.data.pipe(writer);
                writer.on('finish', () => resolve());
                writer.on('error', reject);
            } catch (e) {
                reject(e);
            }
        });

        fs.mkdirSync(path.dirname(outAbsPath), {recursive: true});

        const ffArgs = [
            '-y',
            '-i', tmpVid,
            '-i', tmpPng,
            '-filter_complex',
            "[1][0]scale2ref=w='W*0.12':h=-1[wm][base];" +
            " [base][wm]overlay=x='W*0.25 - w/2':y='H - h - H*0.05'",
            '-c:v', 'libx264', '-crf', '18', '-preset', 'veryfast',
            '-c:a', 'copy',
            outAbsPath
        ];

        console.log('[FalAIService] Running ffmpeg:', ffArgs.join(' '));
        await new Promise<void>((resolve, reject) => {
            const ff = spawn('ffmpeg', ffArgs);
            ff.stdout.on('data', d => process.stdout.write(d));
            ff.stderr.on('data', d => process.stderr.write(d));
            ff.on('error', reject);
            ff.on('close', (code) => code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}`)));
        });

        try {
            fs.unlinkSync(tmpVid);
        } catch {
        }
        try {
            fs.unlinkSync(tmpPng);
        } catch {
        }

        console.log(`[FalAIService] Saved watermarked video to ${outAbsPath}`);
        return outPublicUrl;
    }
}

export default FalAIService;