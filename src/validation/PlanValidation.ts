import Joi from "joi";
import Validator from "@/validation/Validator";

class PlanValidation extends Validator {
    public static createPlan() {
        return this.validate(
            Joi.object({
                name: Joi.string().min(3).max(50).required(),
                description: Joi.string().allow('').optional(),
                tokens: Joi.number().integer().min(1).required(),
                price: Joi.number().precision(2).min(0.01).required()
            })
        );
    }

    public static updatePlan() {
        return this.validate(
            Joi.object({
                name: Joi.string().min(3).max(50).optional(),
                description: Joi.string().allow('').optional(),
                tokens: Joi.number().integer().min(1).optional(),
                price: Joi.number().precision(2).min(0.01).optional()
            })
        );
    }
}

export default PlanValidation;