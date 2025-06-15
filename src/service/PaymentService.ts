import Service from "@/service/Service";
import {Payment, PaymentStatus, Prisma} from "@prisma/client";
import {
    IGetAllPaymentsOptions,
    IGetPaymentHistoryOptions,
    IPaginatedPaymentResult,
    ValidatedPaymentData
} from "@/types/Payment";

class PaymentService extends Service {

    public static async getPaymentHistoryByUser(userId: string, options: IGetPaymentHistoryOptions): Promise<IPaginatedPaymentResult> {
        try {
            const {page = 1, limit = 10} = options;

            const where: Prisma.PaymentWhereInput = {userId};
            const [total, payments] = await this.prisma.$transaction([
                this.prisma.payment.count({where}),
                this.prisma.payment.findMany({
                    where,
                    skip: (page - 1) * limit,
                    take: limit,
                    orderBy: {
                        createdAt: 'desc',
                    },
                    include: {
                        itemPack: true,
                    },
                }),
            ]);

            const totalPages = Math.ceil(total / limit);

            return {
                payments,
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

    public static async getAllPayments(options: IGetAllPaymentsOptions) {
        try {
            const {page = 1, limit = 10, status, search, startDate, endDate} = options;

            const where: Prisma.PaymentWhereInput = {};
            if (status) where.status = status;
            if (search) where.user = {username: {contains: search}};
            if (startDate && endDate) where.createdAt = {gte: new Date(startDate), lte: new Date(endDate)};

            const [total, payments] = await this.prisma.$transaction([
                this.prisma.payment.count({where}),
                this.prisma.payment.findMany({
                    where,
                    skip: (page - 1) * limit,
                    take: limit,
                    orderBy: {createdAt: 'desc'},
                    include: {user: {select: {id: true, username: true}}, itemPack: true},
                }),
            ]);

            return {payments, pagination: {total, totalPages: Math.ceil(total / limit), currentPage: page, limit}};
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    public static async createPayment(data: ValidatedPaymentData): Promise<Payment> {
        try {
            return await this.prisma.payment.create({
                data: {
                    ...data,
                    status: 'PENDING'
                }
            });
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    public static async getPaymentById(id: string): Promise<Payment | null> {
        try {
            return this.prisma.payment.findUnique({where: {id}});
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    public static async confirmPayment(paymentId: string, userId: string, tokensToAdd: number, adminId: string): Promise<Payment> {
        try {
            const operations = [
                this.prisma.payment.update({
                    where: {id: paymentId},
                    data: {status: 'CONFIRMED'},
                }),
                this.prisma.user.update({
                    where: {id: userId},
                    data: {token: {increment: tokensToAdd}}
                }),
                this.prisma.tokenHistory.create({
                    data: {
                        userId: userId,
                        type: 'PURCHASE',
                        amount: tokensToAdd,
                        description: `Tokens added from confirmed payment. Admin ID: ${adminId}`,
                        referenceId: paymentId
                    }
                })
            ];

            const result = await this.prisma.$transaction(operations);
            return result[0] as Payment;
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    public static async updateStatus(id: string, newStatus: PaymentStatus): Promise<Payment> {
        try {
            return this.prisma.payment.update({
                where: {id},
                data: {status: newStatus},
            });
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }
}

export default PaymentService;