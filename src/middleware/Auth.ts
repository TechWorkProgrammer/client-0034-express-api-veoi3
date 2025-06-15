import {NextFunction, Request, Response as EResponse} from "express";
import jwt, {JwtPayload} from "jsonwebtoken";
import Variables from "@/config/Variables";
import Response from "@/config/Response";
import UserService from "@/service/UserService";
import {User} from "@prisma/client";

export interface AuthenticatedRequest extends Request {
    user?: User;
}

class Auth {
    private static _verifyToken(token: string, secret: string, res: EResponse, errorMsg: string): JwtPayload | undefined {
        try {
            return jwt.verify(token, secret) as JwtPayload;
        } catch (error) {
            Response.Unauthorized(res, errorMsg);
            return undefined;
        }
    }

    public static verifyAccessToken(token: string, res: EResponse): JwtPayload | undefined {
        return this._verifyToken(token, Variables.SECRET, res, "Invalid or expired access token");
    }


    public static verifyRefreshToken(token: string, res: EResponse): JwtPayload | undefined {
        return this._verifyToken(token, Variables.SECRET, res, "Invalid or expired refresh token");
    }

    private static _createAuthorizationMiddleware(
        roleCheck?: (user: User) => boolean
    ) {
        return async (req: AuthenticatedRequest, res: EResponse, next: NextFunction): Promise<void> => {
            const tokenWithBearer = req.headers.authorization;
            if (!tokenWithBearer || !tokenWithBearer.startsWith("Bearer ")) {
                Response.Unauthorized(res, "No token provided");
                return;
            }

            const token = tokenWithBearer.split(" ")[1];
            const decoded = this.verifyAccessToken(token, res);
            if (!decoded) {
                return;
            }

            const user = await UserService.getUserByID(decoded.id);
            if (!user) {
                Response.Unauthorized(res, "User not found");
                return;
            }

            if (roleCheck && !roleCheck(user)) {
                Response.Forbidden(res, "Access denied. Insufficient privileges.");
                return;
            }

            req.user = user;
            res.locals.user = user;
            next();
        };
    }

    public static authorize() {
        return this._createAuthorizationMiddleware();
    }

    public static authorizeIsAdmin() {
        return this._createAuthorizationMiddleware(user => user.role === "ADMIN");
    }

    public static generateAccessToken(id: string): string {
        return jwt.sign({id}, Variables.SECRET, {expiresIn: "15m"});
    }

    public static generateRefreshToken(id: string): string {
        return jwt.sign({id}, Variables.SECRET, {expiresIn: "7d"});
    }
}

export default Auth;
