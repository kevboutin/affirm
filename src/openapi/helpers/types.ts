import type { z } from "@hono/zod-openapi";
export type ZodSchema = z.ZodUnion<any> | z.ZodObject | z.ZodArray<z.ZodObject>;
