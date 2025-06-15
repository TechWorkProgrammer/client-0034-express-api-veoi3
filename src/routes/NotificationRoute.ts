import {Router} from "express";
import Auth from "@/middleware/Auth";
import NotificationController from "@/controller/NotificationController";

class NotificationRoute {
    private static router = Router();

    public static route(): Router {
        this.router.get("/", Auth.authorize(), NotificationController.getHistory);
        this.router.put("/:notificationId/read", Auth.authorize(), NotificationController.markAsRead);
        this.router.delete("/:notificationId", Auth.authorize(), NotificationController.delete);

        return this.router;
    }
}

export default NotificationRoute;