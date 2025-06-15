import {Router} from "express";
import Auth from "@/middleware/Auth";
import UserManagementController from "@/controller/admin/UserManagementController";
import UserManagementValidation from "@/validation/admin/UserManagementValidation";

class UserManagementRoute {
    private static router = Router();

    public static route(): Router {
        this.router.get("/", Auth.authorizeIsAdmin(), UserManagementValidation.getAllUsers(), UserManagementController.getAllUsers);
        this.router.put("/:userId/tokens", Auth.authorizeIsAdmin(), UserManagementValidation.updateUserTokens(), UserManagementController.updateUserTokens);

        return this.router;
    }
}

export default UserManagementRoute;