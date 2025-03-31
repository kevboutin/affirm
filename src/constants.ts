import * as HttpStatusPhrases from "./httpStatusPhrases";
import * as HttpStatusCodes from "./httpStatusCodes";
import {
    createAuthErrorObjectSchema,
    createMessageObjectSchema,
} from "./openapi/schemas/index";

export const ZOD_ERROR_MESSAGES = {
    REQUIRED: "Required",
    EXPECTED_ID: "Expected a properly formatted identifier",
    EXPECTED_NUMBER: "Expected number, received NaN",
    NO_UPDATES: "No updates provided",
};

export const ZOD_ERROR_CODES = {
    INVALID_UPDATES: "invalid_updates",
};

export const badRequestSchema = createMessageObjectSchema(
    HttpStatusPhrases.BAD_REQUEST,
    HttpStatusCodes.BAD_REQUEST,
);

export const badRequestRevocationSchema = createAuthErrorObjectSchema(
    "invalid_request",
    HttpStatusPhrases.BAD_REQUEST,
    HttpStatusCodes.BAD_REQUEST,
);

export const unsupportedGrantTypeSchema = createAuthErrorObjectSchema(
    "unsupported_grant_type",
    "The provided grant_type is not supported.",
    HttpStatusCodes.UNAUTHORIZED,
);

export const unauthorizedSchema = createAuthErrorObjectSchema(
    "invalid_client",
    HttpStatusPhrases.UNAUTHORIZED,
    HttpStatusCodes.UNAUTHORIZED,
);

export const notFoundSchema = createMessageObjectSchema(
    HttpStatusPhrases.NOT_FOUND,
    HttpStatusCodes.NOT_FOUND,
);

export const tooManyRequestsSchema = createMessageObjectSchema(
    HttpStatusPhrases.TOO_MANY_REQUESTS,
    HttpStatusCodes.TOO_MANY_REQUESTS,
);

export const serverErrorSchema = createMessageObjectSchema(
    HttpStatusPhrases.INTERNAL_SERVER_ERROR,
    HttpStatusCodes.INTERNAL_SERVER_ERROR,
);

export const serverAuthErrorSchema = createAuthErrorObjectSchema(
    "invalid_request",
    HttpStatusPhrases.INTERNAL_SERVER_ERROR,
    HttpStatusCodes.INTERNAL_SERVER_ERROR,
);

export const timeoutErrorSchema = createMessageObjectSchema(
    HttpStatusPhrases.GATEWAY_TIMEOUT,
    HttpStatusCodes.GATEWAY_TIMEOUT,
);
