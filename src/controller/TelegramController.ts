import {Request, Response as ExResponse} from "express";
import Response from "@/config/Response";
import TelegramService from "@/service/TelegramService";
import Variables from "@/config/Variables";

class TelegramController {
    public static async connect(_req: Request, res: ExResponse) {
        const user = res.locals.user;
        const code = await TelegramService.createSession(user.id);
        const deepLink = `https://t.me/${Variables.TELEGRAM_BOT_USERNAME}?start=${code}`;
        Response.Success(res, "Telegram session created", {code, deepLink},);
    }

    public static async disconnect(_req: Request, res: ExResponse) {
        const user = res.locals.user;
        await TelegramService.disconnect(user.id);
        Response.Success(res, "Disconnected from Telegram", null,);
    }

    public static async status(_req: Request, res: ExResponse) {
        const user = res.locals.user;
        const status = await TelegramService.getStatus(user.id);
        Response.Success(res, "Telegram connection status", status,);
    }
}

export default TelegramController;
