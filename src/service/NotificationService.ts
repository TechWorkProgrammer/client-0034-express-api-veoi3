import Service from "@/service/Service";
import {Prisma, Notification} from "@prisma/client";

class NotificationService extends Service {
    public static async getNotificationsByUser(userId: string, options: { page?: number, limit?: number }) {
        try {
            const {page = 1, limit = 10} = options;
            const where = {userId};

            const [total, unreadCount, notifications] = await this.prisma.$transaction([
                this.prisma.notification.count({where}),
                this.prisma.notification.count({where: {...where, isRead: false}}),
                this.prisma.notification.findMany({
                    where,
                    skip: (page - 1) * limit,
                    take: limit,
                    orderBy: {createdAt: 'desc'}
                })
            ]);

            return {
                notifications,
                pagination: {total, totalPages: Math.ceil(total / limit), currentPage: page, limit},
                unreadCount
            };
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    public static async createNotification(data: Prisma.NotificationUncheckedCreateInput): Promise<Notification> {
        try {
            return this.prisma.notification.create({data});
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    public static async markAsRead(notificationId: string, userId: string): Promise<Notification> {
        try {
            return this.prisma.notification.update({
                where: {id: notificationId, userId: userId},
                data: {isRead: true}
            });
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    public static async deleteNotification(notificationId: string, userId: string): Promise<Notification> {
        try {
            return this.prisma.notification.update({
                where: {id: notificationId, userId: userId},
                data: {deletedAt: new Date()}
            });
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }
}

export default NotificationService;