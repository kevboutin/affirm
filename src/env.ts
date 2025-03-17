import { config } from "dotenv";
import { expand } from "dotenv-expand";
import * as path from "node:path";
import { z } from "zod";

const readPreferenceValues = [
    "nearest",
    "primaryPreferred",
    "secondaryPreferred",
    "primary",
    "secondary",
] as const;
const ReadPreferenceSchema = z
    .enum(readPreferenceValues)
    .default("secondaryPreferred");

const EnvSchema = z
    .object({
        NODE_ENV: z.string().default("development"),
        PROTOCOL: z.string().default("http"),
        HOST: z.string().default("localhost"),
        PORT: z.coerce.number().default(3000),
        AUTHORIZATION_ENDPOINT_PATH: z.string().default("/authorize"),
        CORS_ORIGIN: z.string().optional(),
        DB_URL: z.string().url(),
        DB_AUTH_TOKEN: z.string().optional(),
        DB_BUFFER_COMMANDS: z.boolean().optional(),
        DB_CONNECT_TIMEOUT: z.coerce.number().optional(),
        DB_MAX_IDLE_TIME: z.coerce.number().optional(),
        DB_MAX_POOL_SIZE: z.coerce.number().optional(),
        DB_MIN_POOL_SIZE: z.coerce.number().optional(),
        DB_NAME: z.string(),
        DB_READ_PREF: ReadPreferenceSchema,
        DB_SOCKET_TIMEOUT: z.coerce.number().optional(),
        INTROSPECTION_ENDPOINT_PATH: z.string().default("/authorize"),
        LOG_LEVEL: z.enum([
            "fatal",
            "error",
            "warn",
            "info",
            "debug",
            "trace",
            "silent",
        ]),
        JWT_PRIVATE_KEY: z.string(),
        JWT_PUBLIC_KEY: z.string(),
        REGISTRATION_ENDPOINT_PATH: z.string().default("/user"),
        SERVICE_DOCUMENTATION_ENDPOINT_PATH: z.string().default("/reference"),
        TOKEN_ALGORITHM: z.enum(["RS256", "HS256"]).default("RS256"),
        TOKEN_AUDIENCE: z.string().default("affirm"),
        TOKEN_ENDPOINT_PATH: z.string().default("/token"),
        TOKEN_EXPIRATION_IN_SECONDS: z.coerce.number().default(3600),
        TOKEN_ISSUER: z.string().default("https://auth.affirm.com"),
        USERINFO_ENDPOINT_PATH: z.string().default("/userinfo"),
    })
    .superRefine((input, ctx) => {
        if (input.NODE_ENV === "production" && !input.CORS_ORIGIN) {
            ctx.addIssue({
                code: z.ZodIssueCode.invalid_type,
                expected: "string",
                received: "undefined",
                path: ["CORS_ORIGIN"],
                message: "Must be set when NODE_ENV is 'production'",
            });
        }
        if (input.NODE_ENV === "production" && !input.DB_URL) {
            ctx.addIssue({
                code: z.ZodIssueCode.invalid_type,
                expected: "string",
                received: "undefined",
                path: ["DB_URL"],
                message: "Must be set when NODE_ENV is 'production'",
            });
        }
        if (input.NODE_ENV === "production" && !input.DB_NAME) {
            ctx.addIssue({
                code: z.ZodIssueCode.invalid_type,
                expected: "string",
                received: "undefined",
                path: ["DB_NAME"],
                message: "Must be set when NODE_ENV is 'production'",
            });
        }
    });

export type env = z.infer<typeof EnvSchema>;

expand(
    config({
        path: path.resolve(
            process.cwd(),
            process.env.NODE_ENV === "test" ? ".env.test" : ".env",
        ),
    }),
);

const { data: env, error } = EnvSchema.safeParse(process.env);

if (error) {
    console.error("❌ Invalid env:");
    console.error(JSON.stringify(error.flatten().fieldErrors, null, 4));
    process.exit(1);
}

export default env;
