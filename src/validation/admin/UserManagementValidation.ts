import Joi from "joi";
import Validator from "@/validation/Validator";
import {Role} from "@prisma/client";

class UserManagementValidation extends Validator {
    public static getAllUsers() {
        return this.validateQuery(
            Joi.object({
                page: Joi.number().integer().min(1).optional().default(1),
                limit: Joi.number().integer().min(1).max(100).optional().default(10),
                search: Joi.string().allow('').optional(),
                role: Joi.string().valid(...Object.values(Role)).optional()
            })
        );
    }

    public static updateUserTokens() {
        return this.validate(
            Joi.object({
                token: Joi.number().integer().min(0).required().messages({
                    'number.base': 'Token must be a number.',
                    'number.integer': 'Token must be an integer.',
                    'number.min': 'Token cannot be negative.',
                    'any.required': 'Token field is required.'
                })
            })
        );
    }
}

export default UserManagementValidation;