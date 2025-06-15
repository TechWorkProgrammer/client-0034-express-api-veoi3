import Joi from "joi";
import Validator from "@/validation/Validator";

class AuthValidation extends Validator {

    public static usernameSchema = Joi.string()
        .min(4)
        .max(16)
        .pattern(/^[a-zA-Z0-9_]+$/)
        .required()
        .messages({
            'string.min': 'Username must be at least {#limit} characters long',
            'string.max': 'Username cannot be longer than {#limit} characters',
            'string.pattern.base': 'Username can only contain letters, numbers, and underscores (_)',
            'any.required': 'Username is required'
        });

    private static passwordSchema = Joi.string()
        .min(8)
        .max(30)
        .pattern(new RegExp('(?=.*[a-z])'))
        .pattern(new RegExp('(?=.*[A-Z])'))
        .pattern(new RegExp('(?=.*\\d)'))
        .pattern(new RegExp('(?=.*[!@#$%^&*])'))
        .required()
        .messages({
            'string.min': 'Password must be at least {#limit} characters long',
            'string.max': 'Password cannot be longer than {#limit} characters',
            'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special symbol (!@#$%^&*)',
            'any.required': 'Password is required'
        });

    public static login() {
        return this.validate(
            Joi.object({
                username: this.usernameSchema,
                password: Joi.string().required().messages({
                    'any.required': 'Password is required'
                })
            })
        );
    }

    public static register() {
        return this.validate(
            Joi.object({
                username: this.usernameSchema,
                password: this.passwordSchema,
                repeat_password: Joi.string().valid(Joi.ref('password')).required().messages({
                    'any.only': 'Passwords do not match',
                    'any.required': 'Password confirmation is required'
                })
            })
        );
    }
}

export default AuthValidation;