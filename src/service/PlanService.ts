import Service from "@/service/Service";
import {ItemPack, Prisma} from "@prisma/client";

class PlanService extends Service {
    public static async getAllPlans(): Promise<ItemPack[]> {
        try {
            return await this.prisma.itemPack.findMany({
                where: {
                    deletedAt: null,
                    isCustom: false,
                },
                orderBy: {
                    price: 'asc'
                }
            });
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    public static async findPlanById(id: string): Promise<ItemPack | null> {
        try {
            return await this.prisma.itemPack.findUnique({where: {id}});
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    public static async createPlan(data: Prisma.ItemPackCreateInput): Promise<ItemPack> {
        try {
            return await this.prisma.itemPack.create({data});
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    public static async updatePlan(id: string, data: Prisma.ItemPackUpdateInput): Promise<ItemPack> {
        try {
            return await this.prisma.itemPack.update({
                where: {id},
                data
            });
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    public static async deletePlan(id: string): Promise<ItemPack> {
        try {
            return await this.prisma.itemPack.update({
                where: {id},
                data: {deletedAt: new Date()}
            });
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }
}

export default PlanService;