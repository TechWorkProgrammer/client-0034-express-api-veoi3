import {Role, User} from "@prisma/client";

export interface IGetAllUsersOptions {
    page?: number;
    limit?: number;
    search?: string;
    role?: Role;
}

export interface IPaginatedUserResult {
    users: User[];
    pagination: {
        total: number;
        totalPages: number;
        currentPage: number;
        limit: number;
    };
}