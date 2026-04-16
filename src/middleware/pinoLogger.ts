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
    // Some tests mock `env.NODE_ENV` to exercise middleware branches while
    // the actual test runtime is still NODE_ENV=test. Prefer runtime signals.
    const isTestRuntime =
        process.env.NODE_ENV === "test" ||
        process.env.VITEST === "true" ||
        process.env.VITEST_WORKER_ID !== undefined ||
        env!.NODE_ENV === "test";

    let destination: Writable | undefined;
    if (isTestRuntime) {
        destination = silentStream;
    } else if (env!.NODE_ENV === "production") {
        destination = undefined;
    } else {
        destination = pretty();
    }

    return logger({
        pino: pino(
            {
                level: env!.LOG_LEVEL || "info",
            },
            destination,
        ),
        http: {
            reqId: () => crypto.randomUUID(),
        },
    });
};
