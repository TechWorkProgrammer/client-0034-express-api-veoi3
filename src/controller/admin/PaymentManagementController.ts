import {Request, Response as EResponse} from "express";
import Response from "@/config/Response";
import PaymentService from "@/service/PaymentService";
import NotificationController from "@/controller/NotificationController";
import {PaymentStatus} from "@prisma/client";

class PaymentManagementController {
    public static async getAll(req: Request, res: EResponse): Promise<void> {
        const result = await PaymentService.getAllPayments(req.query);
        Response.Success(res, "Payments retrieved successfully", result);
    }

    public static async updateStatus(req: Request, res: EResponse): Promise<void> {
        const {paymentId} = req.params;
        const {status, tokensToAdd, message} = req.body as {
            status: PaymentStatus,
            tokensToAdd?: number,
            message?: string
        };
        const adminUser = res.locals.user;

        const payment = await PaymentService.getPaymentById(paymentId);
        if (!payment) {
            Response.NotFound(res, "Payment not found.");
            return;
        }

        if (payment.status === 'CONFIRMED') {
            Response.BadRequest(res, "This payment has already been confirmed.");
            return;
        }

        let updatedPayment;

        if (status === 'CONFIRMED') {
            if (!tokensToAdd || tokensToAdd <= 0) {
                Response.BadRequest(res, "tokensToAdd is required and must be positive for a CONFIRMED status.");
                return;
            }
            updatedPayment = await PaymentService.confirmPayment(paymentId, payment.userId, tokensToAdd, adminUser.id);
        } else {
            updatedPayment = await PaymentService.updateStatus(paymentId, status);
        }

        let notificationTitle = '';
        let notificationMessage = '';
        let shouldSendNotification = true;
        const defaultRejectReason = "Please contact support for more information.";

        switch (status) {
            case 'CONFIRMED':
                notificationTitle = "Payment Confirmed";
                notificationMessage = `Your payment for ${tokensToAdd} tokens has been confirmed.`;
                break;
            case 'REJECTED':
                notificationTitle = "Payment Rejected";
                notificationMessage = `Your payment of $${payment.totalPrice} was rejected. ${message || defaultRejectReason}`;
                break;
            case 'CANCELLED':
                notificationTitle = "Payment Cancelled";
                notificationMessage = `Your payment of $${payment.totalPrice} has been cancelled. ${message || ''}`.trim();
                break;
            default:
                shouldSendNotification = false;
        }

        if (shouldSendNotification) {
            await NotificationController.sendNotification({
                userId: payment.userId,
                title: notificationTitle,
                message: notificationMessage,
                type: status === 'CONFIRMED' ? 'SUCCESS' : 'ERROR',
            });
        }

        Response.Success(res, `Payment status updated to ${status}`, updatedPayment);
    }
}

export default PaymentManagementController;