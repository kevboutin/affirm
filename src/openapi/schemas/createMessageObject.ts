import { z } from "@hono/zod-openapi";

const createMessageObjectSchema = (message: string, statusCode: number) => {
    return z
        .object({
            message: z.string(),
            statusCode: z.number(),
        })
        .openapi({
            example: {
                message: message,
                statusCode: statusCode,
            },
        });
};

export default createMessageObjectSchema;
