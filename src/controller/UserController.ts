import {Request, Response as EResponse} from "express";
import UserService from "@/service/UserService";
import Response from "@/config/Response";
import {moveAndStoreImage} from "@/config/Multer";

class UserController {
    public static async updateUsername(req: Request, res: EResponse): Promise<void> {
        const userId = res.locals.user.id;
        const {username} = req.body;
        const updatedUser = await UserService.updateUsername(userId, username);
        Response.Success(res, "Username updated successfully", {
            id: updatedUser.id,
            username: updatedUser.username,
            address: updatedUser.address,
            point: updatedUser.point,
        });
    }

    public static async getUser(_req: Request, res: EResponse): Promise<void> {
        const user = res.locals.user;
        if (!user) {
            Response.NotFound(res, "User not found");
            return;
        }
        Response.Success(res, "User retrieved successfully", user);
    }

    public static async updateProfileImage(req: Request, res: EResponse): Promise<void> {
        const user = res.locals.user;
        const file = req.file;
        if (!file) {
            Response.BadRequest(res, "Image file is required.");
            return;
        }
        const imageUrl = await moveAndStoreImage(file);
        const updatedUser = await UserService.updateProfileImage(user.id, imageUrl);
        Response.Success(res, "Profile image updated successfully", {
            id: updatedUser.id,
            username: updatedUser.username,
            profileImage: updatedUser.profileImage
        });
    }

    public static async clearProfileImage(_req: Request, res: EResponse): Promise<void> {
        const user = res.locals.user;
        await UserService.clearProfileImage(user.id);
        Response.Success(res, "Profile image cleared successfully.");
    }
}

export default UserController;
