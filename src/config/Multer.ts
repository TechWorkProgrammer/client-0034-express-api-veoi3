import {Request} from 'express';
import multer from 'multer';
import crypto from 'crypto';
import path, {join} from 'path';
import {rename} from 'fs/promises';
import process from 'process';
import Variables from '@/config/Variables';

const uploaderMiddleware = multer({
    storage: multer.diskStorage({
        destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
            const tempPath = join(process.cwd(), Variables.TEMP_PATH);
            cb(null, tempPath);
        },
        filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
            const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(8).toString('hex');
            const ext = path.extname(file.originalname);
            cb(null, 'image' + '-' + uniqueSuffix + ext);
        }
    }),
    limits: {fileSize: Variables.MAX_FILE_SIZE},
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only jpeg, png, and webp are allowed.'));
        }
    }
}).single('image');

export const moveAndStoreImage = async (file: Express.Multer.File): Promise<string> => {
    const tempPath = file.path;
    const finalDestination = join(process.cwd(), Variables.ASSETS_IMAGE_PATH, file.filename);
    await rename(tempPath, finalDestination);
    return `${Variables.BASE_URL}/${Variables.ASSETS_IMAGE_PATH}/${file.filename}`;
};

class Multer {
    public static uploader = uploaderMiddleware;
}

export default Multer;