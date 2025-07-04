import {ExpHistory, ExpType} from "@prisma/client";

export interface IGetExpHistoryOptions {
    page?: number;
    limit?: number;
}

export interface IPaginatedExpResult {
    history: ExpHistory[];
    pagination: {
        total: number;
        totalPages: number;
        currentPage: number;
        limit: number;
    };
}

export interface IAddExpOptions {
    userId: string;
    amount: number;
    type: ExpType;
    description: string;
    referenceId?: string;
}