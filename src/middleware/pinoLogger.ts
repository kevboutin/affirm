import { pinoLogger as logger } from "hono-pino";
import pino from "pino";
import pretty from "pino-pretty";
import env from "../env";

export const pinoLogger = () => {
    return logger({
        pino: pino(
            {
                level: env!.LOG_LEVEL || "info",
            },
            env!.NODE_ENV === "production" || env!.NODE_ENV === "test"
                ? undefined
                : pretty(),
        ),
        http: {
            reqId: () => crypto.randomUUID(),
        },
    });
};
