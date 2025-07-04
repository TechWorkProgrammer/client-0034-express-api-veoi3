import {randomBytes} from "crypto";
import Service from "@/service/Service";
import {Prisma, User} from "@prisma/client";
import {IGetAllUsersOptions, IPaginatedUserResult} from "@/types/User";
import {
    IAddExpOptions,
    IGetExpHistoryOptions,
    IPaginatedExpResult,
} from "@/types/Point";

class UserService extends Service {
    public static async createUser(address: string, password?: string | null): Promise<User> {
        try {
            const randomUsername = `user_${randomBytes(4).toString("hex")}`;

            return await this.prisma.user.create({
                data: {
                    username: randomUsername,
                    address: address,
                    password,
                    point: 0,
                    token: 80
                }
            });
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    public static async createUserVeoI(username: string, password?: string | null): Promise<User> {
        try {
            const address = `veoi3_${randomBytes(16).toString("hex")}`;

            return await this.prisma.user.create({
                data: {
                    username: username,
                    address: address,
                    password,
                    point: 0,
                    token: 80,
                }
            });
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    public static async getAllUsers(options: IGetAllUsersOptions): Promise<IPaginatedUserResult> {
        try {
            const {page = 1, limit = 10, search, role} = options;

            const where: Prisma.UserWhereInput = {};
            if (search) {
                where.username = {
                    contains: search,
                };
            }
            if (role) {
                where.role = role;
            }

            const [total, users] = await this.prisma.$transaction([
                this.prisma.user.count({where}),
                this.prisma.user.findMany({
                    where,
                    skip: (page - 1) * limit,
                    take: limit,
                    orderBy: {
                        createdAt: 'desc',
                    },
                }),
            ]);

            const totalPages = Math.ceil(total / limit);

            return {
                users,
                pagination: {
                    total,
                    totalPages,
                    currentPage: page,
                    limit,
                },
            };
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    public static async getUserByID(id: string): Promise<User | null> {
        try {
            return await this.prisma.user.findUnique({
                where: {id}
            });
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    public static async getUserByAddress(address: string): Promise<User | null> {
        try {
            return await this.prisma.user.findUnique({
                where: {address}
            });
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    public static async getUserByUsername(username: string): Promise<User | null> {
        try {
            return await this.prisma.user.findUnique({
                where: {username}
            });
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    public static async updateUsername(userId: string, username: string): Promise<User> {
        try {
            return await this.prisma.user.update({
                where: {id: userId},
                data: {username}
            });
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    public static async updateProfileImage(userId: string, imageUrl: string): Promise<User> {
        try {
            return await this.prisma.user.update({
                where: {id: userId},
                data: {profileImage: imageUrl}
            });
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    public static async clearProfileImage(userId: string): Promise<User> {
        try {
            return await this.prisma.user.update({
                where: {id: userId},
                data: {profileImage: null}
            });
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    public static async updateUserTokens(userId: string, currentTotal: number, newTotal: number, adminId: string): Promise<User> {
        try {
            const changeAmount = newTotal - currentTotal;
            const [updatedUser] = await this.prisma.$transaction([
                this.prisma.user.update({
                    where: {id: userId},
                    data: {token: newTotal}
                }),
                this.prisma.tokenHistory.create({
                    data: {
                        userId: userId,
                        type: "ADJUSTMENT_TOKEN",
                        amount: changeAmount,
                        description: `Token adjustment by admin (ID: ${adminId})`,
                        referenceId: adminId
                    }
                })
            ]);

            return updatedUser;
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    public static async getExpHistoryByUser(userId: string, options: IGetExpHistoryOptions): Promise<IPaginatedExpResult> {
        try {
            const { page = 1, limit = 10 } = options;

            const skip = (page - 1) * limit;
            const [total, history] = await this.prisma.$transaction([
                this.prisma.expHistory.count({
                    where: { userId },
                }),
                this.prisma.expHistory.findMany({
                    where: { userId },
                    skip: skip,
                    take: limit,
                    orderBy: {
                        createdAt: 'desc',
                    },
                }),
            ]);

            const totalPages = Math.ceil(total / limit);

            return {
                history,
                pagination: {
                    total,
                    totalPages,
                    currentPage: page,
                    limit,
                },
            };
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    public static async addExpAndCreateHistory(options: IAddExpOptions): Promise<User> {
        const { userId, amount, type, description, referenceId } = options;
        try {
            const [updatedUser] = await this.prisma.$transaction([
                this.prisma.user.update({
                    where: { id: userId },
                    data: { point: { increment: amount } },
                }),
                this.prisma.expHistory.create({
                    data: {
                        userId,
                        type,
                        amount,
                        description,
                        referenceId,
                    },
                }),
            ]);
            return updatedUser;
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }
}

export default UserService;
