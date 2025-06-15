import Joi from "joi";
import Validator from "@/validation/Validator";
import AuthValidation from "@/validation/AuthValidation";
import Variables from "@/config/Variables";

class UserValidation extends Validator {
    public static updateUsername() {
        return this.validate(
            Joi.object({
                username: AuthValidation.usernameSchema
            })
        );
    }

    public static updateProfileImage() {
        return this.validate(
            Joi.object({
                image: Joi.object({
                    mimetype: Joi.string().valid('image/jpeg', 'image/png', 'image/webp', 'image/jpg').required(),
                    size: Joi.number().max(Variables.MAX_FILE_SIZE).required()
                }).unknown(true)
                    .required()
                    .messages({
                        'any.required': 'Image file is required.',
                        'object.base': 'Image file is required.',
                        'string.valid': 'Invalid file type. Only jpeg, png, and webp are allowed.',
                        'number.max': `File size cannot exceed ${Variables.MAX_FILE_SIZE / 1024 / 1024}MB.`
                    })
            })
        );
    }
}

export default UserValidation;
