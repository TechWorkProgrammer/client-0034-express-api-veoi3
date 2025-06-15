import {Request, Response as EResponse} from "express";
import PlanService from "@/service/PlanService";
import Response from "@/config/Response";

class PlanController {
    public static async getAll(req: Request, res: EResponse): Promise<void> {
        const plans = await PlanService.getAllPlans();
        Response.Success(res, "Plans retrieved successfully", plans);
    }

    public static async create(req: Request, res: EResponse): Promise<void> {
        const plan = await PlanService.createPlan(req.body);
        Response.Created(res, "Plan created successfully", plan);
    }

    public static async update(req: Request, res: EResponse): Promise<void> {
        const {id} = req.params;
        const plan = await PlanService.updatePlan(id, req.body);
        Response.Success(res, "Plan updated successfully", plan);
    }

    public static async delete(req: Request, res: EResponse): Promise<void> {
        const {id} = req.params;
        await PlanService.deletePlan(id);
        Response.Success(res, "Plan deleted successfully");
    }
}

export default PlanController;