import dotenv from "dotenv";
import process from "process";
import CustomError from "@/middleware/CustomError";

class Variables {
    static PORT: string;
    static BASE_URL: string;
    static DATABASE_URL: string;
    static SECRET: string;
    static TIMEOUT: number;
    static TEMP_PATH: string;
    static ASSETS_PATH: string;
    static ASSETS_IMAGE_PATH: string;
    static ASSETS_VIDEO_PATH: string;
    static ALLOWED_ORIGINS: string[];
    static ALLOWED_HEADERS: string;
    static ALLOWED_METHODS: string;
    static RATE_LIMIT_MAX: number;
    static RATE_LIMIT_WINDOW_MS: number;
    static MAX_FILE_SIZE: number;
    static GOOGLE_APPLICATION_CREDENTIALS: string;
    static REDIS_HOST: string;
    static REDIS_PORT: number;
    static REDIS_PASSWORD?: string;
    static GCP_PROJECT_ID: string;
    static GCP_LOCATION: string;
    static GCS_BUCKET_NAME: string;

    static boot(): void {
        dotenv.config();

        this.PORT = process.env.PORT || this.throwError("PORT");
        this.BASE_URL = process.env.BASE_URL || this.throwError("BASE_URL");
        this.DATABASE_URL = process.env.DATABASE_URL || this.throwError("DATABASE_URL");
        this.SECRET = process.env.SECRET || this.throwError("SECRET");
        this.TIMEOUT = process.env.TIMEOUT ? parseInt(process.env.TIMEOUT) : 5000;
        this.TEMP_PATH = process.env.TEMP_PATH || "/storage/temp";
        this.ASSETS_PATH = process.env.ASSETS_PATH || "/storage/assets";
        this.ASSETS_IMAGE_PATH = process.env.ASSETS_IMAGE_PATH || "/storage/assets/images";
        this.ASSETS_VIDEO_PATH = process.env.ASSETS_VIDEO_PATH || "/storage/assets/images";
        this.ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
            ? process.env.ALLOWED_ORIGINS.split(",")
            : ["http://localhost:3000"];
        this.ALLOWED_HEADERS = process.env.ALLOWED_HEADERS || "Content-Type,Authorization,Accept";
        this.ALLOWED_METHODS = process.env.ALLOWED_METHODS || "GET,POST,PUT,DELETE";

        this.RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS ? parseInt(process.env.RATE_LIMIT_WINDOW_MS) : 60000;
        this.RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX) : 30;
        this.MAX_FILE_SIZE = process.env.MAX_FILE_SIZE ? parseInt(process.env.MAX_FILE_SIZE) : 1048576;
        this.GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS || this.throwError("GOOGLE_APPLICATION_CREDENTIALS");
        this.REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
        this.REDIS_PORT = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379;
        this.REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;
        this.GCP_PROJECT_ID = process.env.GCP_PROJECT_ID || this.throwError("GCP_PROJECT_ID");
        this.GCP_LOCATION = process.env.GCP_LOCATION || "us-central1";
        this.GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME || this.throwError("GCS_BUCKET_NAME");
    }

    static throwError(variable: string): never {
        throw new CustomError(`Missing required environment variable: ${variable}`);
    }
}

export default Variables;
