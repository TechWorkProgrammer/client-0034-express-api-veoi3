import { PredictionServiceClient } from '@google-cloud/aiplatform';
import { Storage } from '@google-cloud/storage';
import Variables from '@/config/Variables';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import Service from "@/service/Service";

const clientOptions = { apiEndpoint: `${Variables.GCP_LOCATION}-aiplatform.googleapis.com` };
const predictionServiceClient = new PredictionServiceClient(clientOptions);
const storage = new Storage();

class VertexAIService extends Service {
    public static async generateVideo(jobData: any, videoResultId: string): Promise<any[]> {
        const { prompt, image, ...otherParams } = jobData;

        const instance: { [key: string]: any } = { prompt };
        if (image) {
            instance.image = image;
        }

        const parameters: { [key: string]: any } = {
            ...otherParams,
            storageUri: `gs://${Variables.GCS_BUCKET_NAME}/outputs/${videoResultId}`,
        };

        delete parameters.prompt;

        const request = {
            endpoint: `projects/${Variables.GCP_PROJECT_ID}/locations/${Variables.GCP_LOCATION}/publishers/google/models/veo-2.0-generate-001`,
            instances: [instance],
            parameters: parameters,
        };

        console.log('[VertexAIService] Sending request to Vertex AI with correct structure...');

        const [response] = await predictionServiceClient.predict(request);

        if (!response.predictions || response.predictions.length === 0) {
            throw new Error("Vertex AI job completed but returned no predictions.");
        }

        console.log('[VertexAIService] Received predictions from Vertex AI.');
        return response.predictions;
    }

    public static async downloadAndSave(gcsUri: string): Promise<string> {
        const bucketName = Variables.GCS_BUCKET_NAME;
        if (!bucketName) {
            throw new Error("GCS_BUCKET_NAME environment variable is not set.");
        }

        const fileName = gcsUri.replace(`gs://${bucketName}/`, '');
        if (!fileName) {
            throw new Error(`Invalid GCS URI provided: ${gcsUri}`);
        }

        const uniqueFileName = `${uuidv4()}${path.extname(fileName) || '.mp4'}`;
        const localFilePath = path.join(process.cwd(), Variables.ASSETS_VIDEO_PATH, uniqueFileName);

        console.log(`[VertexAIService] Downloading ${fileName} from GCS bucket ${bucketName}...`);

        await storage.bucket(bucketName).file(fileName).download({
            destination: localFilePath,
        });

        console.log(`[VertexAIService] Saved video locally to ${localFilePath}`);

        return `/${path.join(Variables.ASSETS_VIDEO_PATH, uniqueFileName).replace(/\\/g, '/')}`;
    }
}

export default VertexAIService;