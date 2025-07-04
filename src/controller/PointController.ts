import {Request, Response as EResponse} from "express";
import Response from "@/config/Response";
import UserService from "@/service/UserService";

class PointController {
    public static async getHistory(req: Request, res: EResponse): Promise<void> {
        const user = res.locals.user;
        const {page, limit} = req.query;
        const result = await UserService.getExpHistoryByUser(user.id, {
            page: Number(page),
            limit: Number(limit),
        });
        Response.Success(res, "Point history retrieved successfully", result);
    }
}

export default PointController;