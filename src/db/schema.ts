import mongoose from "mongoose";
import { z } from "zod";

export const authenticateSchema = z.object({
    // We want to control the error for a bad grant_type with a 401 not 422.
    // grant_type: z.enum(["client_credentials"]),
    grant_type: z.string().optional(),
    client_id: z.string().optional(),
    client_secret: z.string().optional(),
});

export const ssoAuthorizeSchema = z.object({
    metadataUrl: z.string().url(),
});

// https://www.rfc-editor.org/rfc/rfc7662.html
export const introspectionResponseSchema = z.object({
    active: z.boolean(),
    aud: z.array(z.string()).optional(),
    email: z.string().optional(),
    exp: z.number().optional(),
    iat: z.number().optional(),
    iss: z.string().optional(),
    nbf: z.number().optional(),
    roles: z.array(z.string()).optional(),
    sub: z.string().optional(),
    token_type: z.string().optional(),
    username: z.string().optional(),
});

export const jwksResponseSchema = z.object({
    keys: z.array(
        z.object({
            kty: z.string(),
            alg: z.string(),
            kid: z.string(),
            n: z.string(),
            e: z.string(),
        }),
    ),
});

export const metadataResponseSchema = z.object({
    issuer: z.string(),
    authorization_endpoint: z.string(),
    token_endpoint: z.string(),
    jwks_uri: z.string(),
    registration_endpoint: z.string(),
    grant_types_supported: z.array(z.string()),
    userinfo_endpoint: z.string(),
    token_endpoint_auth_methods_supported: z.array(z.string()),
    token_endpoint_auth_signing_alg_values_supported: z.array(z.string()),
    service_documentation: z.string(),
    introspection_endpoint: z.string(),
});

// https://www.rfc-editor.org/rfc/rfc7009.html
export const revocationSchema = z.object({
    token: z.string(),
    token_type_hint: z.enum(["access_token", "refresh_token"]).optional(),
});

// https://www.rfc-editor.org/rfc/rfc6749.html
export const tokenResponseSchema = z.object({
    access_token: z.string(),
    expires_in: z.number(),
    token_type: z.string(),
});

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
    password: z.string().optional(),
    email: z.string().email({
        message: "Email is not valid.",
    }),
    roles: z.array(z.string()).optional(),
    locale: z.string().optional(),
    timezone: z.string().optional(),
    verifiedEmail: z.boolean().optional(),
    verifiedPhone: z.boolean().optional(),
    authType: z.string().optional(),
    idpClient: z.string().optional(),
    idpMetadata: z.string().optional(),
    idpSub: z.string().optional(),
});

export const patchedUserSchema = z.object({
    _id: z.instanceof(mongoose.Types.ObjectId),
    username: z.string(),
    password: z.string().optional(),
    email: z.string(),
    roles: z.array(z.string()).optional(),
    locale: z.string().optional(),
    timezone: z.string().optional(),
    verifiedEmail: z.boolean(),
    verifiedPhone: z.boolean(),
    authType: z.string().optional(),
    idpClient: z.string().optional(),
    idpMetadata: z.string().optional(),
    idpSub: z.string().optional(),
    createdAt: z.instanceof(Date).optional(),
    updatedAt: z.instanceof(Date).optional(),
});

export const selectUserSchema = z.object({
    _id: z.instanceof(mongoose.Types.ObjectId),
    username: z.string(),
    email: z.string(),
    roles: z.array(z.string()).optional(),
    locale: z.string().optional(),
    timezone: z.string().optional(),
    verifiedEmail: z.boolean(),
    verifiedPhone: z.boolean(),
    authType: z.string(),
    idpClient: z.string().optional(),
    idpMetadata: z.string().optional(),
    idpSub: z.string().optional(),
    createdAt: z.instanceof(Date).optional(),
    updatedAt: z.instanceof(Date).optional(),
});

export const selectSingleUserSchema = z.object({
    _id: z.instanceof(mongoose.Types.ObjectId),
    username: z.string(),
    password: z.string().optional(),
    email: z.string(),
    roles: z.array(selectRoleSchema).optional(),
    locale: z.string().optional(),
    timezone: z.string().optional(),
    verifiedEmail: z.boolean(),
    verifiedPhone: z.boolean(),
    authType: z.string(),
    idpClient: z.string().optional(),
    idpMetadata: z.string().optional(),
    idpSub: z.string().optional(),
    createdAt: z.instanceof(Date).optional(),
    updatedAt: z.instanceof(Date).optional(),
});

export const patchRoleSchema = insertRoleSchema.partial();
export const patchUserSchema = insertUserSchema.partial();
