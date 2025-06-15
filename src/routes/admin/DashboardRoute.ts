import {Router} from "express";
import Auth from "@/middleware/Auth";
import DashboardController from "@/controller/admin/DashboardController";

class DashboardRoute {
    private static router = Router();

    public static route(): Router {
        this.router.get("/stats", Auth.authorizeIsAdmin(), DashboardController.getStats);

        return this.router;
    }
}

export default DashboardRoute;