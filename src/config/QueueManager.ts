import {Queue} from 'bullmq';
import Variables from "@/config/Variables";

class QueueManager {
    public static videoQueue: Queue;

    public static boot(): void {
        const connectionOptions = {
            host: Variables.REDIS_HOST,
            port: Variables.REDIS_PORT,
            password: Variables.REDIS_PASSWORD,
        };

        this.videoQueue = new Queue('video-generation', {
            connection: connectionOptions,
        });

        console.log('🎬 Queue Manager booted and connected to Redis.');
    }
}

export default QueueManager;