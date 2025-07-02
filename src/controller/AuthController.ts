import {Request, Response as EResponse} from "express";
import {User} from "@prisma/client";
import {verifyMessage} from "ethers";
import {randomBytes} from "crypto";
import Auth from "@/middleware/Auth";
import UserService from "@/service/UserService";
import Response from "@/config/Response";
import Service from "@/service/Service";

class AuthController extends Service {
    private static async _createSessionAndSendResponse(res: EResponse, user: User, successMessage: string): Promise<void> {
        const accessToken = Auth.generateAccessToken(user.id);
        const refreshToken = Auth.generateRefreshToken(user.id);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await this.prisma.session.upsert({
            where: {userId: user.id},
            update: {token: accessToken, refreshToken, expiresAt},
            create: {userId: user.id, token: accessToken, refreshToken, expiresAt}
        });

        Response.Success(res, successMessage, {
            user,
            accessToken,
            refreshToken
        });
    }

    public static async getNonce(req: Request, res: EResponse): Promise<void> {
        const {address} = req.query;
        if (!address || typeof address !== "string") {
            Response.BadRequest(res, "Wallet address is required");
            return;
        }

        const nonce = randomBytes(32).toString("hex");
        await this.prisma.walletNonce.upsert({
            where: {address},
            update: {nonce, createdAt: new Date()},
            create: {address, nonce}
        });

        Response.Success(res, "Nonce generated successfully", {nonce});
    }

    public static async walletLogin(req: Request, res: EResponse): Promise<void> {
        const {address, signature} = req.body;
        if (!address || !signature) {
            Response.BadRequest(res, "Address and Signature are required");
            return;
        }

        const record = await this.prisma.walletNonce.findUnique({where: {address}});
        if (!record) {
            Response.Forbidden(res, "No nonce found. Please request a new nonce.");
            return;
        }

        const message = record.nonce;
        let recoveredAddress: string;
        try {
            recoveredAddress = verifyMessage(message, signature);
        } catch {
            Response.Forbidden(res, "Invalid signature format");
            return;
        }

        if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
            Response.Forbidden(res, "Signature does not match address");
            return;
        }
        await this.prisma.walletNonce.delete({where: {address}});

        let user = await UserService.getUserByAddress(address);
        if (!user) {
            user = await UserService.createUser(address, null);
        }

        await this._createSessionAndSendResponse(res, user, "Wallet login successful");
    }

    public static async login(req: Request, res: EResponse): Promise<void> {
        const {username, password} = req.body;
        if (!username || !password) {
            Response.BadRequest(res, "Username and password are required");
            return;
        }

        const user = await UserService.getUserByUsername(username);

        if (!user || user.password !== password) {
            Response.Forbidden(res, "Username and password mismatch");
            return;
        }

        await this._createSessionAndSendResponse(res, user, "Login successful");
    }

    public static async register(req: Request, res: EResponse): Promise<void> {
        const {username, password} = req.body;
        if (!username || !password) {
            Response.BadRequest(res, "Username and password are required");
            return;
        }

        const existingUser = await UserService.getUserByUsername(username);
        if (existingUser) {
            Response.BadRequest(res, "Username is already taken");
            return;
        }
        const user = await UserService.createUserVeoI(username, password);
        await this._createSessionAndSendResponse(res, user, "Registration successful");
    }

    public static async refreshToken(req: Request, res: EResponse): Promise<void> {
        const {refreshToken} = req.body;
        if (!refreshToken) {
            Response.BadRequest(res, "refreshToken is required");
            return;
        }

        const decoded = Auth.verifyRefreshToken(refreshToken, res);
        if (!decoded) return;

        const session = await this.prisma.session.findUnique({where: {userId: decoded.id}});
        if (!session || session.refreshToken !== refreshToken) {
            Response.Unauthorized(res, "Refresh token mismatch or session not found");
            return;
        }

        const user = await UserService.getUserByID(decoded.id);
        if (!user) {
            Response.NotFound(res, "User account associated with this token not found");
            return;
        }

        await this._createSessionAndSendResponse(res, user, "Tokens refreshed successfully");
    }
}

export default AuthController;