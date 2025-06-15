import { Router } from "express";
import Auth from "@/middleware/Auth";
import PlanValidation from "@/validation/PlanValidation";
import PlanController from "@/controller/PlanController";

class PlanRoute {
    private static router = Router();

    public static route(): Router {
        this.router.get("/", PlanController.getAll);
        this.router.post("/", Auth.authorizeIsAdmin(), PlanValidation.createPlan(), PlanController.create);
        this.router.put("/:id", Auth.authorizeIsAdmin(), PlanValidation.updatePlan(), PlanController.update);
        this.router.delete("/:id", Auth.authorizeIsAdmin(), PlanController.delete);

        return this.router;
    }
}

export default PlanRoute;