import express, {Application, json, NextFunction, Request, Response as EResponse, Router, urlencoded} from "express";
import responseTime from "response-time";
import {join} from "path";
import process from "process";
import Variables from "@/config/Variables";
import Response from "@/config/Response";
import Exception from "@/config/Exception";
import AuthRoute from "@/routes/AuthRoute";
import UserRoute from "@/routes/UserRoute";
import UserManagementRoute from "@/routes/admin/UserManagementRoute";
import DashboardRoute from "@/routes/admin/DashboardRoute";
import PlanRoute from "@/routes/PlanRoute";
import PaymentRoute from "@/routes/PaymentRoute";
import PaymentManagementRoute from "@/routes/admin/PaymentManagementRoute";
import NotificationRoute from "@/routes/NotificationRoute";
import VideoRoute from "@/routes/VideoRoute";
import AuthController from "@/controller/AuthController";
import TelegramRoute from "@/routes/TelegramRoute";

class Route {
    public static registerRoutes(app: any): void {
        app.use(json());
        app.use(urlencoded({extended: true}));
        app.use(responseTime());

        this.wrapAllRoutes(app);

        app.use("/auth", AuthRoute.route());
        app.use("/user", UserRoute.route());
        app.use('/notification', NotificationRoute.route());
        app.use('/plans', PlanRoute.route());
        app.use('/payment', PaymentRoute.route());
        app.use('/video', VideoRoute.route());
        app.use('/telegram', TelegramRoute.route());

        app.use("/admin/dashboard", DashboardRoute.route());
        app.use("/admin/users", UserManagementRoute.route());
        app.use("/admin/payments", PaymentManagementRoute.route());

        app.use("/storage/assets", express.static(join(process.cwd(), Variables.ASSETS_PATH)));
        app.get('/whoami', (req: Request, res: EResponse) => {
            Response.Success(res, "Success", {
                ip: AuthController.getIp(req),
                expressIp: req.ip,
                forwarded: req.headers['x-forwarded-for'],
                socket: req.socket.remoteAddress,
                ips: req.ips,
            });
        });

        app.use("/*", (_req: Request, res: EResponse) => {
            Response.NotFound(res);
        });
    }

    private static wrapAllRoutes(app: Application): void {
        const originalUse = app.use.bind(app);
        app.use = (...args: any[]) => {
            const path = typeof args[0] === "string" ? args[0] : null;
            const handler = path ? args[1] : args[0];
            if (handler && (handler as Router).stack) {
                this.wrapAsyncRouter(handler as Router);
            } else if (typeof handler === "function") {
                const wrappedHandler = this.asyncErrorCatcher(handler);
                if (path) {
                    return originalUse(path, wrappedHandler);
                }
                return originalUse(wrappedHandler);
            }
            return originalUse(...args);
        };
    }

    private static wrapAsyncRouter(router: Router): Router {
        router.stack.forEach((layer: any) => {
            const route = layer.route;
            if (route) {
                route.stack.forEach((layer: any) => {
                    if (layer.method && typeof layer.handle === "function") {
                        layer.handle = this.asyncErrorCatcher(layer.handle);
                    }
                });
            }
        });
        return router;
    }

    private static asyncErrorCatcher(fn: Function) {
        return (req: Request, res: EResponse, next: NextFunction) => {
            Promise.resolve(fn(req, res, next)).catch((error) => {
                Exception.handleError(error, req, res);
            });
        };
    }
}

export default Route;
