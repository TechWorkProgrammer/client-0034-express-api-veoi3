import {Router} from "express";
import TelegramController from "@/controller/TelegramController";
import Auth from "@/middleware/Auth";

class TelegramRoute {
    private static router = Router();

    public static route(): Router {
        this.router.post("/connect", Auth.authorize(), TelegramController.connect);
        this.router.post("/disconnect", Auth.authorize(), TelegramController.disconnect);
        this.router.get("/status", Auth.authorize(), TelegramController.status);

        return this.router;
    }
}

export default TelegramRoute;