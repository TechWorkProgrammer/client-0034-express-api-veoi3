import {Router} from "express";
import Auth from "@/middleware/Auth";
import UserValidation from "@/validation/UserValidation";
import UserController from "@/controller/UserController";
import PointController from "@/controller/PointController";
import Multer from "@/config/Multer";

class UserRoute {
    private static router = Router();

    public static route(): Router {
        this.router.put("/username", Auth.authorize(), UserValidation.updateUsername(), UserController.updateUsername);
        this.router.get("/me", Auth.authorize(), UserController.getUser);
        this.router.get("/me/exp-history", Auth.authorize(), UserValidation.getHistory(), PointController.getHistory);
        this.router.put("/me/profile-image", Auth.authorize(), Multer.uploader, UserController.updateProfileImage);
        this.router.delete("/me/profile-image", Auth.authorize(), UserController.clearProfileImage);

        return this.router;
    }
}

export default UserRoute;
