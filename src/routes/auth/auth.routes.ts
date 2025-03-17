import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "../../httpStatusCodes";
import {
    authenticateSchema,
    introspectionResponseSchema,
    jwksResponseSchema,
    metadataResponseSchema,
    selectUserSchema,
    tokenResponseSchema,
} from "../../db/schema";
import { formContent, jsonContent } from "../../openapi/helpers/index";
import {
    notFoundSchema,
    serverErrorSchema,
    timeoutErrorSchema,
    tooManyRequestsSchema,
    unauthorizedSchema,
} from "../../constants";

const tags = ["auth"];

export const authenticate = createRoute({
    path: "/token",
    method: "post",
    request: {
        body: formContent(authenticateSchema, "Authentication grant type"),
    },
    tags,
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            tokenResponseSchema,
            "Token response that includes an access token",
        ),
        [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
            unauthorizedSchema,
            "The request is not authorized",
        ),
        [HttpStatusCodes.TOO_MANY_REQUESTS]: jsonContent(
            tooManyRequestsSchema,
            "Too many requests",
        ),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
            serverErrorSchema,
            "There was a server error",
        ),
        [HttpStatusCodes.GATEWAY_TIMEOUT]: jsonContent(
            timeoutErrorSchema,
            "The request timed out",
        ),
    },
});

export const authorize = createRoute({
    path: "/authorize",
    method: "get",
    tags,
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            introspectionResponseSchema,
            "The access token contents",
        ),
        [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
            unauthorizedSchema,
            "The request is not authorized",
        ),
        [HttpStatusCodes.TOO_MANY_REQUESTS]: jsonContent(
            tooManyRequestsSchema,
            "Too many requests",
        ),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
            serverErrorSchema,
            "There was a server error",
        ),
        [HttpStatusCodes.GATEWAY_TIMEOUT]: jsonContent(
            timeoutErrorSchema,
            "The request timed out",
        ),
    },
});

export const jwks = createRoute({
    path: "/.well-known/jwks.json",
    method: "get",
    tags,
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            jwksResponseSchema,
            "The JSON Web Key Set (JWKS)",
        ),
        [HttpStatusCodes.TOO_MANY_REQUESTS]: jsonContent(
            tooManyRequestsSchema,
            "Too many requests",
        ),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
            serverErrorSchema,
            "There was a server error",
        ),
        [HttpStatusCodes.GATEWAY_TIMEOUT]: jsonContent(
            timeoutErrorSchema,
            "The request timed out",
        ),
    },
});

export const metadata = createRoute({
    path: "/.well-known/oauth-authorization-server",
    method: "get",
    tags,
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            metadataResponseSchema,
            "The metadata discovery",
        ),
        [HttpStatusCodes.TOO_MANY_REQUESTS]: jsonContent(
            tooManyRequestsSchema,
            "Too many requests",
        ),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
            serverErrorSchema,
            "There was a server error",
        ),
        [HttpStatusCodes.GATEWAY_TIMEOUT]: jsonContent(
            timeoutErrorSchema,
            "The request timed out",
        ),
    },
});

export const userinfo = createRoute({
    path: "/userinfo",
    method: "get",
    tags,
    responses: {
        [HttpStatusCodes.OK]: jsonContent(selectUserSchema, "User information"),
        [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
            unauthorizedSchema,
            "The request is not authorized",
        ),
        [HttpStatusCodes.NOT_FOUND]: jsonContent(
            notFoundSchema,
            "User not found",
        ),
        [HttpStatusCodes.TOO_MANY_REQUESTS]: jsonContent(
            tooManyRequestsSchema,
            "Too many requests",
        ),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
            serverErrorSchema,
            "There was a server error",
        ),
        [HttpStatusCodes.GATEWAY_TIMEOUT]: jsonContent(
            timeoutErrorSchema,
            "The request timed out",
        ),
    },
});

export type AuthenticateRoute = typeof authenticate;
export type AuthorizeRoute = typeof authorize;
export type JWKSRoute = typeof jwks;
export type MetadataRoute = typeof metadata;
export type UserinfoRoute = typeof userinfo;
