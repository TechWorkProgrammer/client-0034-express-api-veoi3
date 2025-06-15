import {Notification as PrismaNotification, NotificationType} from "@prisma/client";

export type INotification = PrismaNotification;

export interface SendNotificationData {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    actionUrl?: string;
}