import Joi from "joi";
import Validator from "./Validator";

class VideoValidation extends Validator {
    public static generate() {
        return this.validate(Joi.object({
            prompt: Joi.string().min(10).when('image', {
                is: Joi.exist(),
                then: Joi.optional(),
                otherwise: Joi.required()
            }),
            durationSeconds: Joi.number().integer().min(1).max(8).required(),
            negativePrompt: Joi.string().allow('').optional(),
            enhancePrompt: Joi.boolean().optional().default(true),
            seed: Joi.number().integer().min(0).optional(),
            sampleCount: Joi.number().integer().min(1).max(4).optional().default(1),
            aspectRatio: Joi.string().valid("16:9", "1:1", "9:16").optional().default("16:9"),
            personGeneration: Joi.string().valid('allow_adult', 'dont_allow').optional().default('allow_adult'),
            generateAudio: Joi.boolean().optional().default(true),
        }));
    }

    public static getVideos() {
        return this.validateQuery(
            Joi.object({
                page: Joi.number().integer().min(1).optional().default(1),
                limit: Joi.number().integer().min(1).max(50).optional().default(10),
                sortBy: Joi.string().valid('newest', 'views', 'likes').optional().default('newest'),
                type: Joi.string().valid("DEFAULT", "GALLERY").optional().default("DEFAULT"),
            })
        );
    }

    public static like() {
        return this.validate(
            Joi.object({
                type: Joi.string().valid("DEFAULT", "GALLERY").optional().default("DEFAULT"),
            })
        );
    }
}

export default VideoValidation;