import Service from "@/service/Service";
import {Prisma, TokenHistory} from "@prisma/client";

class TokenHistoryService extends Service {
    public static async createHistory(data: Prisma.TokenHistoryCreateInput): Promise<TokenHistory> {
        try {
            return this.prisma.tokenHistory.create({data});
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }
}

export default TokenHistoryService;