import {Request, Response as EResponse} from "express";
import UserService from "@/service/UserService";
import Response from "@/config/Response";
import {Role} from "@prisma/client";
import {IGetAllUsersOptions} from "@/types/User";

class UserManagementController {
    public static async getAllUsers(req: Request, res: EResponse): Promise<void> {
        const {page, limit, search, role} = req.query;

        const options: IGetAllUsersOptions = {
            page: Number(page) || 1,
            limit: Number(limit) || 10,
            search: search as string | undefined,
            role: role as Role | undefined
        };
        const result = await UserService.getAllUsers(options);
        Response.Success(res, "Users retrieved successfully", result);
    }

    public static async updateUserTokens(req: Request, res: EResponse): Promise<void> {
        const {userId} = req.params;
        const {token} = req.body;
        const adminUser = res.locals.user;
        const currentUser = await UserService.getUserByID(userId);
        if (!currentUser) {
            Response.NotFound(res, "User not found");
            return;
        }
        const updatedUser = await UserService.updateUserTokens(currentUser.id, currentUser.token, token, adminUser.id);
        Response.Success(res, "User tokens updated successfully", updatedUser);

    }
}

export default UserManagementController;