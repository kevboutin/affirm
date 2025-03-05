import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "../httpStatusCodes";
import jsonContent from "../openapi/helpers/jsonContent";
import createMessageObjectSchema from "../openapi/schemas/createMessageObject";

import { createRouter } from "../createApp";

const router = createRouter().openapi(
    createRoute({
        tags: ["index"],
        method: "get",
        path: "/",
        responses: {
            [HttpStatusCodes.OK]: jsonContent(
                createMessageObjectSchema("affirm API", HttpStatusCodes.OK),
                "affirm API index",
            ),
        },
    }),
    (c) => {
        return c.json(
            {
                message: "affirm API",
                statusCode: HttpStatusCodes.OK,
            },
            HttpStatusCodes.OK,
        );
    },
);

export default router;
