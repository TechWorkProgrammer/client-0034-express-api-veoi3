import Joi from "joi";
import Validator from "@/validation/Validator";
import AuthValidation from "@/validation/AuthValidation";

class UserValidation extends Validator {
    public static updateUsername() {
        return this.validate(
            Joi.object({
                username: AuthValidation.usernameSchema
            })
        );
    }

    public static getHistory() {
        return this.validateQuery(
            Joi.object({
                page: Joi.number().integer().min(1).optional().default(1),
                limit: Joi.number().integer().min(1).max(50).optional().default(10),
            })
        );
    }
}

export default UserValidation;
