import { z } from "@hono/zod-openapi";

const createAuthErrorObjectSchema = (
    errorType: "invalid_request" | "invalid_client" | "unsupported_grant_type",
    message: string,
    statusCode: number,
) => {
    return z
        .object({
            error: z.enum([
                "invalid_request",
                "invalid_client",
                "unsupported_grant_type",
            ]),
            message: z.string(),
            statusCode: z.number(),
        })
        .openapi({
            example: {
                error: errorType,
                message: message,
                statusCode: statusCode,
            },
        });
};

export default createAuthErrorObjectSchema;
