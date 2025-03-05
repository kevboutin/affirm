import type { ErrorHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { INTERNAL_SERVER_ERROR, OK } from "../httpStatusCodes";

/**
 * On Error middleware
 */
const onError: ErrorHandler = (err, c) => {
    const currentStatus =
        "status" in err ? err.status : c.newResponse(null).status;
    const statusCode =
        currentStatus !== OK
            ? (currentStatus as ContentfulStatusCode)
            : INTERNAL_SERVER_ERROR;
    const env = c.env?.NODE_ENV || process.env?.NODE_ENV;
    return c.json(
        {
            message: err.message,
            statusCode,
            stack: env === "production" ? undefined : err.stack,
        },
        statusCode,
    );
};

export default onError;
