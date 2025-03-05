import { z } from "@hono/zod-openapi";

const IdParamsSchema = z.object({
    id: z.coerce.string().openapi({
        param: {
            name: "id",
            in: "path",
            required: true,
        },
        required: ["id"],
        example: "5f92cdce0cf217478ba93563",
    }),
});

export default IdParamsSchema;
