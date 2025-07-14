import {randomBytes} from "crypto";
import Service from "@/service/Service";
import {TelegramAccount, User} from "@prisma/client";
import Redis from "ioredis";
import Variables from "@/config/Variables";

const redis = new Redis({
    host: Variables.REDIS_HOST,
    port: Variables.REDIS_PORT,
    password: Variables.REDIS_PASSWORD,
});

class TelegramService extends Service {
    public static async createSession(userId: string): Promise<string> {
        try {
            const code = randomBytes(16).toString("hex");
            await redis.set(`telegram:session:${code}`, userId, "EX", 600);
            return code;
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    public static async disconnect(userId: string): Promise<void> {
        try {
            await this.prisma.telegramAccount.deleteMany({
                where: {userId},
            });
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    public static async getStatus(
        userId: string
    ): Promise<{ connected: boolean; telegramUserId?: string; username?: string }> {
        try {
            const acct = await this.prisma.telegramAccount.findUnique({
                where: {userId},
            });
            if (!acct) {
                return {connected: false};
            }
            return {
                connected: true,
                telegramUserId: acct.telegramUserId,
                username: acct.username || undefined,
            };
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    public static async handleBotStart(
        code: string,
        telegramUserId: string,
        username?: string
    ): Promise<TelegramAccount> {
        const key = `telegram:session:${code}`;
        const userId = await redis.get(key);
        if (!userId) {
            throw new Error("Invalid or expired session code");
        }

        const existing = await this.prisma.telegramAccount.findFirst({
            where: {telegramUserId},
        });
        if (existing && existing.userId !== userId) {
            throw new Error("This Telegram account is already connected to another user.");
        }
        const acct = await this.prisma.telegramAccount.upsert({
            where: {userId},
            update: {telegramUserId, username, connectedAt: new Date()},
            create: {userId, telegramUserId, username},
        });
        await redis.del(key);
        return acct;
    }

    public static async getDetailUserByTelegram(telegramUserId: string): Promise<Pick<User, "id" | "username" | "address" | "point" | "token" | "profileImage">> {
        const acct = await this.prisma.telegramAccount.findFirst({
            where: {telegramUserId},
            include: {user: true},
        });

        if (!acct) {
            throw new Error("This Telegram account is not connected.");
        }

        const {id, username, address, point, token, profileImage} = acct.user;
        return {id, username, address, point, token, profileImage};

    }

    public static async getTelegramAccountByUserId(userId: string): Promise<{
        telegramUserId: string;
        username?: string
    }> {
        const acct = await this.prisma.telegramAccount.findUnique({
            where: {userId},
        });
        if (!acct) {
            throw new Error("User has not connected their Telegram account.");
        }
        return {
            telegramUserId: acct.telegramUserId,
            username: acct.username ?? undefined,
        };
    }
}

export default TelegramService;
