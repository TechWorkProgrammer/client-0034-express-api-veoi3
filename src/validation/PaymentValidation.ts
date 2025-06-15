import Joi from "joi";
import Validator from "@/validation/Validator";

class PaymentValidation extends Validator {
    public static getHistory() {
        return this.validateQuery(
            Joi.object({
                page: Joi.number().integer().min(1).optional().default(1),
                limit: Joi.number().integer().min(1).max(50).optional().default(10),
            })
        );
    }

    public static createPayment() {
        return this.validate(
            Joi.object({
                planId: Joi.string().uuid().optional(),
                customTokenAmount: Joi.string().optional(),
                totalPrice: Joi.string().required()
            }).xor('planId', 'customTokenAmount')
        );
    }
}

export default PaymentValidation;