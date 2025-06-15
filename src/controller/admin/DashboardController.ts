import {Request, Response as EResponse} from "express";
import DashboardService from "@/service/DashboardService";
import Response from "@/config/Response";

class DashboardController {
    public static async getStats(req: Request, res: EResponse): Promise<void> {
        try {
            const stats = await DashboardService.getDashboardStats();
            Response.Success(res, "Dashboard statistics retrieved successfully", stats);
        } catch (error: any) {
            Response.BadRequest(res, error.message);
        }
    }
}

export default DashboardController;