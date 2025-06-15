import {ItemPack, Payment, PaymentStatus} from "@prisma/client";

export interface ValidatedPaymentData {
    userId: string;
    packId: string | null;
    customTokenAmount: number | null;
    totalPrice: number;
    paymentProofImage: string;
}

export interface IGetPaymentHistoryOptions {
    page?: number;
    limit?: number;
}

export interface IPaginatedPaymentResult {
    payments: (Payment & { itemPack: ItemPack | null })[];
    pagination: {
        total: number;
        totalPages: number;
        currentPage: number;
        limit: number;
    };
}

export interface IGetAllPaymentsOptions {
    page?: number;
    limit?: number;
    status?: PaymentStatus;
    search?: string;
    startDate?: string;
    endDate?: string;
}