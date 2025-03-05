import type { NotFoundHandler } from "hono";
import { NOT_FOUND } from "../httpStatusCodes";
import { NOT_FOUND as NOT_FOUND_MESSAGE } from "../httpStatusPhrases";

/**
 * Not Found middleware.
 */
const notFound: NotFoundHandler = (c) => {
    return c.json(
        {
            message: `${NOT_FOUND_MESSAGE} - ${c.req.path}`,
            statusCode: NOT_FOUND,
        },
        NOT_FOUND,
    );
};

export default notFound;
