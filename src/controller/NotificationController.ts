import { Request, Response as EResponse } from "express";
import Response from "@/config/Response";
import NotificationService from "@/service/NotificationService";
import WebSocket from "@/config/WebSocket";
import {SendNotificationData} from "@/types/Notification";

class NotificationController {
    public static async sendNotification(data: SendNotificationData) {
        try {
            const newNotification = await NotificationService.createNotification(data);
            WebSocket.sendNotificationToUser(data.userId, newNotification);

            return newNotification;
        } catch (error) {
            console.error("Failed to send notification:", error);
        }
    }

    public static async getHistory(req: Request, res: EResponse): Promise<void> {
        const user = res.locals.user;
        const { page, limit } = req.query;
        const result = await NotificationService.getNotificationsByUser(user.id, { page: Number(page), limit: Number(limit) });
        Response.Success(res, "Notifications retrieved", result);
    }

    public static async markAsRead(req: Request, res: EResponse): Promise<void> {
        const user = res.locals.user;
        const { notificationId } = req.params;
        const notification = await NotificationService.markAsRead(notificationId, user.id);
        Response.Success(res, "Notification marked as read", notification);
    }

    public static async delete(req: Request, res: EResponse): Promise<void> {
        const user = res.locals.user;
        const { notificationId } = req.params;
        await NotificationService.deleteNotification(notificationId, user.id);
        Response.Success(res, "Notification deleted");
    }
}

export default NotificationController;