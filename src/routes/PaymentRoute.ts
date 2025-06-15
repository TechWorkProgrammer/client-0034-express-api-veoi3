import {Router} from "express";
import Auth from "@/middleware/Auth";
import PaymentValidation from "@/validation/PaymentValidation";
import PaymentController from "@/controller/PaymentController";
import Multer from "@/config/Multer";

class PaymentRoute {
    private static router = Router();

    public static route(): Router {
        this.router.post("/", Auth.authorize(), Multer.uploader, PaymentValidation.createPayment(), PaymentController.create);
        this.router.get("/history", Auth.authorize(), PaymentValidation.getHistory(), PaymentController.getHistory);

        return this.router;
    }
}

export default PaymentRoute;