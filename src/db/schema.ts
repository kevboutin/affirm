import mongoose from "mongoose";
import { z } from "zod";

export const insertRoleSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters in length"),
    description: z.string().optional(),
});

export const selectRoleSchema = z.object({
    _id: z.instanceof(mongoose.Types.ObjectId),
    name: z.string(),
    description: z.string().optional(),
    createdAt: z.instanceof(Date).optional(),
    updatedAt: z.instanceof(Date).optional(),
});

export const insertUserSchema = z.object({
    username: z.string(),
    email: z.string().email({
        message: "Email is not valid.",
    }),
    roles: z.array(z.string()).optional(),
    locale: z.string().optional(),
    timezone: z.string().optional(),
    verifiedEmail: z.boolean().optional(),
});

export const selectUserSchema = z.object({
    _id: z.instanceof(mongoose.Types.ObjectId),
    username: z.string(),
    email: z.string(),
    roles: z.array(selectRoleSchema),
    locale: z.string().optional(),
    timezone: z.string().optional(),
    verifiedEmail: z.boolean(),
    createdAt: z.instanceof(Date).optional(),
    updatedAt: z.instanceof(Date).optional(),
});

export const patchRoleSchema = insertRoleSchema.partial();
export const patchUserSchema = insertUserSchema.partial();
