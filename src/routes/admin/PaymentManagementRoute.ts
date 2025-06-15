import {Router} from "express";
import Auth from "@/middleware/Auth";
import PaymentManagementValidation from "@/validation/admin/PaymentManagementValidation";
import PaymentManagementController from "@/controller/admin/PaymentManagementController";

class PaymentManagementRoute {
    private static router = Router();

    public static route(): Router {
        this.router.get("/", Auth.authorizeIsAdmin(), PaymentManagementValidation.getAll(), PaymentManagementController.getAll);
        this.router.put("/:paymentId/status", Auth.authorizeIsAdmin(), PaymentManagementValidation.updateStatus(), PaymentManagementController.updateStatus);

        return this.router;
    }
}

export default PaymentManagementRoute;