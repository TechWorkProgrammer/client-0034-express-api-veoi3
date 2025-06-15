import {Request, Response as EResponse} from "express";
import PaymentService from "@/service/PaymentService";
import Response from "@/config/Response";
import {moveAndStoreImage} from "@/config/Multer";
import PlanService from "@/service/PlanService";

class PaymentController {
    public static async getHistory(req: Request, res: EResponse): Promise<void> {
        const user = res.locals.user;
        const {page, limit} = req.query;
        const result = await PaymentService.getPaymentHistoryByUser(user.id, {
            page: Number(page),
            limit: Number(limit),
        });
        Response.Success(res, "Payment history retrieved successfully", result);
    }

    public static async create(req: Request, res: EResponse): Promise<void> {
        const {planId, customTokenAmount, totalPrice} = req.body;
        const user = res.locals.user;
        const file = req.file;

        if (!file) {
            Response.BadRequest(res, "Payment proof image is required.");
            return;
        }

        let serverCalculatedPrice: number;
        let finalPackId: string | null = planId || null;
        let finalCustomAmount: number | null = null;

        const numericTotalPrice = Number(totalPrice);

        if (planId) {
            const plan = await PlanService.findPlanById(planId);
            if (!plan) {
                Response.NotFound(res, "Selected plan not found.");
                return;
            }
            serverCalculatedPrice = Number(plan.price);

        } else if (customTokenAmount) {
            const numericCustomAmount = Number(customTokenAmount);
            if (numericCustomAmount < 5000) {
                Response.BadRequest(res, "Custom token amount must be at least 5000.");
                return;
            }
            serverCalculatedPrice = numericCustomAmount / 10;
            finalCustomAmount = numericCustomAmount;

        } else {
            Response.BadRequest(res, "Either a plan or a custom token amount is required.");
            return;
        }

        if (Math.abs(serverCalculatedPrice - numericTotalPrice) > 0.01) {
            Response.BadRequest(res, `Price mismatch. Client price: ${numericTotalPrice}, Server price: ${serverCalculatedPrice}`);
            return;
        }

        const imageUrl = await moveAndStoreImage(file);

        const payment = await PaymentService.createPayment({
            userId: user.id,
            packId: finalPackId,
            customTokenAmount: finalCustomAmount,
            totalPrice: serverCalculatedPrice,
            paymentProofImage: imageUrl,
        });

        Response.Created(res, "Payment submission successful, pending for review.", payment);
    }
}

export default PaymentController;