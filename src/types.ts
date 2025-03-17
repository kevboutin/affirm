import type { OpenAPIHono, RouteConfig, RouteHandler } from "@hono/zod-openapi";
import type { PinoLogger } from "hono-pino";
import { AffirmTokenPayload } from "./jwt";

export interface AppBindings {
    Variables: {
        logger: PinoLogger;
        jwtPayload?: AffirmTokenPayload;
    };
}

export type AppOpenAPI = OpenAPIHono<AppBindings>;
export type AppRouteHandler<R extends RouteConfig> = RouteHandler<
    R,
    AppBindings
>;
