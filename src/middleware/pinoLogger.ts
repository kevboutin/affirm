import { pinoLogger as logger } from "hono-pino";
import pino from "pino";
import pretty from "pino-pretty";
import { Writable } from "node:stream";
import env from "../env";

// Create a no-op stream for suppressing pino output during tests
const silentStream = new Writable({
    write(_chunk, _encoding, callback) {
        callback();
    },
});

export const pinoLogger = () => {
    return logger({
        pino: pino(
            {
                level: env!.LOG_LEVEL || "info",
            },
            env!.NODE_ENV === "test"
                ? silentStream
                : env!.NODE_ENV === "production"
                  ? undefined
                  : pretty(),
        ),
        http: {
            reqId: () => crypto.randomUUID(),
        },
    });
};
