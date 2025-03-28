import { OpenAPIHono } from "@hono/zod-openapi";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { jwk } from "hono/jwk";
import { rateLimiter } from "hono-rate-limiter";
import { secureHeaders } from "hono/secure-headers";
import { timeout } from "hono/timeout";
import notFound from "./middleware/notFound";
import onError from "./middleware/onError";
import { pinoLogger } from "./middleware/pinoLogger";
import env from "./env";
import * as HttpStatusCodes from "./httpStatusCodes";
import * as HttpStatusPhrases from "./httpStatusPhrases";
import defaultHook from "./openapi/defaultHook";
import type { AppBindings, AppOpenAPI } from "./types";
import type { Context } from "hono";
import { HonoJsonWebKey } from "hono/utils/jwt/jws";

const keyMap: Map<string, any> = new Map<string, any>();

async function getJwks(): Promise<HonoJsonWebKey[]> {
    const jKey = "jwks";
    const jUrlKey = "jwks_url";
    const jwksUrl = `${env!.PROTOCOL}://${env!.HOST}:${env!.PORT}/.well-known/jwks.json`;
    const existingUrl = keyMap.get(jUrlKey);
    let jwks = existingUrl === jwksUrl ? keyMap.get(jKey) : null;
    if (!jwks) {
        console.info(`getJwks: Fetching JWKS from ${jwksUrl}`);
        const response = await fetch(jwksUrl);
        if (!response.ok) {
            throw new Error(
                `Failed to fetch JWKS from ${jwksUrl}. error: ${response.statusText}`,
            );
        }
        const responseText = await response.text();
        jwks = JSON.parse(responseText);
        keyMap.set(jKey, jwks);
        keyMap.set(jUrlKey, jwksUrl);
    }
    const keys = jwks.keys;
    console.info(`getJwks: keys: ${JSON.stringify(keys)}`);
    return keys;
}

export function createRouter() {
    return new OpenAPIHono<AppBindings>({ strict: false, defaultHook });
}

export default function createApp() {
    const app = createRouter();
    app.use("*", timeout(5000));
    app.use(compress());
    app.use(secureHeaders());
    // Only apply JWT middleware if not in test environment
    if (env!.NODE_ENV !== "test") {
        app.use(
            "/roles",
            jwk({
                keys: getJwks,
            }),
        );
        app.use(
            "/roles/*",
            jwk({
                keys: getJwks,
            }),
        );
        app.use(
            "/users/*",
            jwk({
                keys: getJwks,
            }),
        );
    }
    app.use(
        "/userinfo",
        jwk({
            keys: getJwks,
        }),
    );
    app.use(
        rateLimiter({
            windowMs: 15 * 60 * 1000, // 15 minutes
            limit: 100, // Limit each IP address to 100 requests per `window` (here, per 15 minutes).
            standardHeaders: "draft-6", // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
            // This will generate a custom identifier for the client based on the username in the JWT payload.
            keyGenerator: (c: Context<AppBindings>) => {
                const payload = c.get("jwtPayload");
                return payload?.username ?? "anonymous";
            },
            handler: (c) => {
                const responseMessage = {
                    message: HttpStatusPhrases.TOO_MANY_REQUESTS,
                    statusCode: HttpStatusCodes.TOO_MANY_REQUESTS,
                };
                return c.json(responseMessage);
            },
        }),
    );
    app.use("*", async (c, next) => {
        const corsMiddleware = cors({
            origin: env!.CORS_ORIGIN ?? "*",
            allowMethods: ["GET", "OPTIONS", "PATCH", "POST", "PUT", "DELETE"],
        });
        return await corsMiddleware(c, next);
    });
    app.use("*", async (c, next) => {
        const start = Date.now();
        await next();
        const ms = Date.now() - start;
        c.header("Response-Time", `${ms}ms`);
    });
    app.use(pinoLogger());
    app.onError(onError);
    app.notFound(notFound);
    return app;
}

export function createTestApp<R extends AppOpenAPI>(router: R) {
    return createApp().route("/", router);
}
