import Joi from "joi";
import Validator from "@/validation/Validator";
import {PaymentStatus} from "@prisma/client";

class PaymentManagementValidation extends Validator {
    public static getAll() {
        return this.validateQuery(
            Joi.object({
                page: Joi.number().integer().min(1).optional(),
                limit: Joi.number().integer().min(1).max(100).optional(),
                status: Joi.string().valid(...Object.values(PaymentStatus)).optional(),
                search: Joi.string().allow('').optional(),
                startDate: Joi.date().iso().optional(),
                endDate: Joi.date().iso().optional()
            })
        );
    }

    public static updateStatus() {
        return this.validate(
            Joi.object({
                status: Joi.string().valid(...Object.values(PaymentStatus)).required(),
                tokensToAdd: Joi.number().integer().min(1).when('status', {
                    is: 'CONFIRMED',
                    then: Joi.required(),
                    otherwise: Joi.optional()
                }),
                message: Joi.string().allow('').optional()
            })
        );
    }
}

export default PaymentManagementValidation;