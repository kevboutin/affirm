import * as HttpStatusCodes from "../../httpStatusCodes";
import * as HttpStatusPhrases from "../../httpStatusPhrases";
import DatabaseService from "../../db/index";
import env from "../../env";
import type { AppRouteHandler } from "../../types";
import { User } from "../../db/models/index";
import UserRepository from "../../db/repositories/userRepository";
import type {
    AuthenticateRoute,
    AuthorizeRoute,
    JWKSRoute,
    MetadataRoute,
    SsoAuthorizeRoute,
    UserinfoRoute,
} from "./auth.routes.js";
import { jwt } from "@/jwt";
import { importPKCS8, importSPKI, exportJWK } from "jose";
import bcrypt from "bcrypt";
import { authz } from "@/authz";
import { RedactedUserDocumentWithRoles } from "@/db/models/user";

const db = new DatabaseService({
    dbUri: env!.DB_URL,
    dbName: env!.DB_NAME,
    databaseOpts: {
        bufferCommands: env!.DB_BUFFER_COMMANDS,
        readPreference: env!.DB_READ_PREF,
        minPoolSize: env!.DB_MIN_POOL_SIZE,
        maxPoolSize: env!.DB_MAX_POOL_SIZE,
        connectTimeoutMS: env!.DB_CONNECT_TIMEOUT,
        socketTimeoutMS: env!.DB_SOCKET_TIMEOUT,
        maxIdleTimeMS: env!.DB_MAX_IDLE_TIME,
    },
});
const _ = await db.createConnection();
const userRepository = new UserRepository(User as any);

const validatePassword = async (
    password: string,
    hashedPassword: string,
): Promise<boolean> => {
    return await bcrypt.compare(password, hashedPassword);
};

const getProviderUserinfo = async (
    bearerToken: string,
    metadataUrl: string,
): Promise<{ userId: string; providerUserinfo: any }> => {
    const providerMetadata = await authz.getProviderMetadata(metadataUrl);
    const providerUserinfo = await authz.getProviderUserinfo(
        providerMetadata.userinfo_endpoint,
        bearerToken,
    );
    const userId = providerUserinfo.sub ?? providerUserinfo.oid;
    if (!userId) {
        throw new Error("Provider userinfo missing required identifier.");
    }
    return { userId, providerUserinfo };
};

const createUserUpdates = (
    providerUserinfo: any,
    metadataUrl: string,
): Object => ({
    authType: "oidc" as const,
    verifiedEmail: true,
    idpMetadataUrl: metadataUrl,
    ...(providerUserinfo.username && {
        username: providerUserinfo.username as string,
    }),
    ...(providerUserinfo.email && { email: providerUserinfo.email as string }),
    ...(providerUserinfo.locale && {
        locale: providerUserinfo.locale as string,
    }),
    ...(providerUserinfo.phone && { phone: providerUserinfo.phone as string }),
    ...(providerUserinfo.timezone && {
        timezone: providerUserinfo.timezone as string,
    }),
});

export const authenticate: AppRouteHandler<AuthenticateRoute> = async (c) => {
    let clientId: string;
    let clientSecret: string;
    const form = await c.req.parseBody();
    const grantType = form["grant_type"] as string;
    const header = c.req.header("Authorization");
    c.var.logger.info(`authenticate: Grant type: ${grantType}`);
    if (header) {
        const basicToken = header.split(" ")[1];
        const decoded = Buffer.from(basicToken, "base64").toString("utf-8");
        const [client, secret] = decoded.split(":");
        clientId = client;
        clientSecret = secret;
    } else {
        clientId = form["client_id"] as string;
        clientSecret = form["client_secret"] as string;
    }
    if (grantType !== "client_credentials") {
        c.var.logger.info(
            `authenticate: Grant type is not supported.`,
            grantType,
        );
        c.header(
            "WWW-Authenticate",
            `Bearer realm="${env!.TOKEN_ISSUER}", error="unsupported_grant_type", error_description="The provided grant_type is not supported"`,
        );
        return c.json(
            {
                error: "unsupported_grant_type" as const,
                message: "The provided grant_type is not supported.",
                statusCode: 401,
            },
            HttpStatusCodes.UNAUTHORIZED,
        );
    }
    try {
        const result = await userRepository.findById(clientId);
        if (!result) {
            c.var.logger.info(
                `authenticate: Unable to find user successfully for client ${clientId}.`,
            );
            c.header(
                "WWW-Authenticate",
                `Bearer realm="${env!.TOKEN_ISSUER}", error="invalid_client", error_description="Credentials are not valid"`,
            );
            return c.json(
                {
                    error: "invalid_client" as const,
                    message: "Credentials are not valid.",
                    statusCode: 401,
                },
                HttpStatusCodes.UNAUTHORIZED,
            );
        }
        c.var.logger.info(`authenticate: Found user with client ${clientId}.`);
        if (result.password) {
            const isValid = await validatePassword(
                clientSecret,
                result.password,
            );
            if (!isValid) {
                c.var.logger.info(
                    `authenticate: Unable to validate password for client ${clientId}.`,
                );
                c.header(
                    "WWW-Authenticate",
                    `Bearer realm="${env!.TOKEN_ISSUER}", error="invalid_client", error_description="Credentials are not valid"`,
                );
                return c.json(
                    {
                        error: "invalid_client" as const,
                        message: "Credentials are not valid.",
                        statusCode: 401,
                    },
                    HttpStatusCodes.UNAUTHORIZED,
                );
            }
            c.var.logger.info(
                `authenticate: Password is valid for client ${clientId}.`,
            );
        }

        // Import the private key using jose.
        const privateKey = await importPKCS8(
            env!.JWT_PRIVATE_KEY,
            env!.TOKEN_ALGORITHM,
        );
        const testObject = {
            hasCorrectHeader: env!.JWT_PRIVATE_KEY.startsWith(
                "-----BEGIN PRIVATE KEY-----",
            ),
            hasCorrectFooter:
                env!.JWT_PRIVATE_KEY.endsWith("-----END PRIVATE KEY-----\n") ||
                env!.JWT_PRIVATE_KEY.endsWith("-----END PRIVATE KEY-----"),
            totalLength: env!.JWT_PRIVATE_KEY.length,
            firstFewChars: env!.JWT_PRIVATE_KEY.slice(0, 50),
        };
        c.var.logger.info(
            `Key format check: ${JSON.stringify(testObject, null, 2)}`,
        );

        // If credentials are valid, generate a JWT token.
        const now = Math.floor(Date.now() / 1000);
        const token = await jwt.create(
            {
                aud: env!.TOKEN_AUDIENCE,
                exp: now + env!.TOKEN_EXPIRATION_IN_SECONDS,
                iat: now,
                iss: env!.TOKEN_ISSUER,
                nbf: now,
                sub: result._id.toString(),
                email: result.email,
                locale: result?.locale,
                roles: result?.roles?.map((role) => role._id.toString()),
                timezone: result?.timezone,
                username: result.username,
            },
            env!.TOKEN_ALGORITHM,
            privateKey,
        );
        return c.json(
            {
                access_token: token,
                expires_in: env!.TOKEN_EXPIRATION_IN_SECONDS,
                token_type: "Bearer",
            },
            HttpStatusCodes.OK,
        );
    } catch (error) {
        console.error(
            `authenticate: Unable to query successfully with client ${clientId}.`,
            error,
        );
        c.header(
            "WWW-Authenticate",
            `Bearer realm="${env!.TOKEN_ISSUER}", error="invalid_request"`,
        );
        return c.json(
            {
                error: "invalid_request" as const,
                message: HttpStatusPhrases.INTERNAL_SERVER_ERROR,
                statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
            },
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
        );
    }
};

export const authorize: AppRouteHandler<AuthorizeRoute> = async (c) => {
    const header = c.req.header("Authorization");
    if (!header) {
        c.header(
            "WWW-Authenticate",
            `Bearer realm="${env!.TOKEN_ISSUER}", error="invalid_request", error_description="Authorization header is missing"`,
        );
        return c.json(
            {
                error: "invalid_request" as const,
                message: "Authorization header is missing.",
                statusCode: HttpStatusCodes.UNAUTHORIZED,
            },
            HttpStatusCodes.UNAUTHORIZED,
        );
    }
    const bearerToken = header.split(" ")[1];
    if (!bearerToken) {
        c.header(
            "WWW-Authenticate",
            `Bearer realm="${env!.TOKEN_ISSUER}", error="invalid_request", error_description="Bearer token is missing"`,
        );
        return c.json(
            {
                error: "invalid_request" as const,
                message: "Bearer token is missing.",
                statusCode: HttpStatusCodes.UNAUTHORIZED,
            },
            HttpStatusCodes.UNAUTHORIZED,
        );
    }
    try {
        // Import the public key using jose
        const publicKey = await importSPKI(
            env!.JWT_PUBLIC_KEY,
            env!.TOKEN_ALGORITHM,
        );

        // Verify the JWT token.
        const { payload } = await jwt.verify(
            bearerToken,
            publicKey,
            [env!.TOKEN_ALGORITHM],
            env!.TOKEN_ISSUER,
            env!.TOKEN_AUDIENCE,
        );
        c.var.logger.info(`authorize: Verified JWT token.`);
        const response = {
            active: true,
            aud: payload.aud,
            email: payload.email,
            exp: payload.exp,
            iat: payload.iat,
            iss: payload.iss,
            nbf: payload.nbf,
            roles: payload.roles,
            sub: payload.sub,
            token_type: "Bearer",
            username: payload.username,
        };
        return c.json(response, HttpStatusCodes.OK);
    } catch (error) {
        c.var.logger.error(
            `authorize: Unable to verify JWT token. Error: ${JSON.stringify(error)}`,
        );
        if (
            (error instanceof Error &&
                (error as any).code ===
                    "ERR_JWS_SIGNATURE_VERIFICATION_FAILED") ||
            (error as any).code === "ERR_JWT_EXPIRED" ||
            (error as any).code === "ERR_JWT_INVALID" ||
            (error as any).code === "ERR_JWT_UNSUPPORTED_ALGORITHM" ||
            (error as any).code === "ERR_JWT_INVALID_AUDIENCE" ||
            (error as any).code === "ERR_JWT_INVALID_ISSUER" ||
            (error as any).code === "ERR_JWS_INVALID"
        ) {
            c.header(
                "WWW-Authenticate",
                `Bearer realm="${env!.TOKEN_ISSUER}", error="invalid_request"`,
            );
            return c.json(
                {
                    error: "invalid_request" as const,
                    message: HttpStatusPhrases.UNAUTHORIZED,
                    statusCode: HttpStatusCodes.UNAUTHORIZED,
                },
                HttpStatusCodes.UNAUTHORIZED,
            );
        }
        c.header(
            "WWW-Authenticate",
            `Bearer realm="${env!.TOKEN_ISSUER}", error="invalid_request"`,
        );
        return c.json(
            {
                error: "invalid_request" as const,
                message: HttpStatusPhrases.INTERNAL_SERVER_ERROR,
                statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
            },
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
        );
    }
};

export const jwks: AppRouteHandler<JWKSRoute> = async (c) => {
    try {
        const publicKey = await importSPKI(
            env!.JWT_PUBLIC_KEY,
            env!.TOKEN_ALGORITHM,
        );
        const jwk = await exportJWK(publicKey);
        c.var.logger.info(`jwks: JWKS: ${JSON.stringify(jwk)}`);
        return c.json(
            {
                keys: [
                    {
                        kty: jwk.kty!,
                        kid: "sst",
                        alg: env!.TOKEN_ALGORITHM,
                        n: jwk.n!,
                        e: jwk.e!,
                    },
                ],
            },
            HttpStatusCodes.OK,
        );
    } catch (error) {
        c.var.logger.error(`jwks: Unable to export JWK.`, error);
        c.header(
            "WWW-Authenticate",
            `Bearer realm="${env!.TOKEN_ISSUER}", error="invalid_request"`,
        );
        return c.json(
            {
                error: "invalid_request" as const,
                message: HttpStatusPhrases.INTERNAL_SERVER_ERROR,
                statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
            },
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
        );
    }
};

export const metadata: AppRouteHandler<MetadataRoute> = async (c) => {
    return c.json(
        {
            issuer: env!.TOKEN_ISSUER,
            authorization_endpoint: `${env!.TOKEN_ISSUER}${env!.AUTHORIZATION_ENDPOINT_PATH}`,
            token_endpoint: `${env!.TOKEN_ISSUER}${env!.TOKEN_ENDPOINT_PATH}`,
            jwks_uri: `${env!.TOKEN_ISSUER}/well-known/jwks.json`,
            registration_endpoint: `${env!.TOKEN_ISSUER}${env!.REGISTRATION_ENDPOINT_PATH}`,
            grant_types_supported: ["client_credentials"],
            userinfo_endpoint: `${env!.TOKEN_ISSUER}${env!.USERINFO_ENDPOINT_PATH}`,
            token_endpoint_auth_methods_supported: [
                "client_secret_basic",
                "client_secret_post",
            ],
            token_endpoint_auth_signing_alg_values_supported: [
                "HS256",
                "RS256",
            ],
            service_documentation: `${env!.TOKEN_ISSUER}${env!.SERVICE_DOCUMENTATION_ENDPOINT_PATH}`,
            introspection_endpoint: `${env!.TOKEN_ISSUER}${env!.INTROSPECTION_ENDPOINT_PATH}`,
        },
        HttpStatusCodes.OK,
    );
};

export const ssoauthorize: AppRouteHandler<SsoAuthorizeRoute> = async (c) => {
    const header = c.req.header("Authorization");
    if (!header) {
        c.header(
            "WWW-Authenticate",
            `Bearer realm="${env!.TOKEN_ISSUER}", error="invalid_request", error_description="Authorization header is missing"`,
        );
        return c.json(
            {
                error: "invalid_request" as const,
                message: "Authorization header is missing.",
                statusCode: HttpStatusCodes.UNAUTHORIZED,
            },
            HttpStatusCodes.UNAUTHORIZED,
        );
    }
    const bearerToken = header.split(" ")[1];
    if (!bearerToken) {
        c.header(
            "WWW-Authenticate",
            `Bearer realm="${env!.TOKEN_ISSUER}", error="invalid_request", error_description="Bearer token is missing"`,
        );
        return c.json(
            {
                error: "invalid_request" as const,
                message: "Bearer token is missing.",
                statusCode: HttpStatusCodes.UNAUTHORIZED,
            },
            HttpStatusCodes.UNAUTHORIZED,
        );
    }
    const metadataUrl = c.req.valid("json") as unknown as string;
    let updatedUser: RedactedUserDocumentWithRoles | null = null;
    let subject: string;
    try {
        const { userId, providerUserinfo } = await getProviderUserinfo(
            bearerToken,
            metadataUrl,
        );
        subject = userId;
        c.var.logger.info(
            `ssoauthorize: Provider userinfo: ${JSON.stringify(providerUserinfo)}, ${JSON.stringify(userId)}`,
        );
        const updates = createUserUpdates(providerUserinfo, metadataUrl);
        updatedUser = await userRepository.update(userId, updates, {
            _id: "fakeid",
            username: "dummy",
            email: "dummy@gmail.com",
        });
        if (!updatedUser) {
            c.var.logger.error(
                `ssoauthorize: Unable to update user with provider userinfo.`,
            );
            throw new Error("Unable to update user.");
        } else {
            c.var.logger.info(
                `ssoauthorize: Updated user with identifier=${updatedUser._id}.`,
            );
        }
    } catch (error) {
        c.var.logger.error(
            `ssoauthorize: Unable to update user successfully with provider userinfo. ${JSON.stringify(error)}`,
        );
        c.header(
            "WWW-Authenticate",
            `Bearer realm="${env!.TOKEN_ISSUER}", error="invalid_request"`,
        );
        return c.json(
            {
                error: "invalid_request" as const,
                message: HttpStatusPhrases.INTERNAL_SERVER_ERROR,
                statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
            },
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
        );
    }

    try {
        // Import the private key using jose
        const privateKey = await importPKCS8(
            env!.JWT_PRIVATE_KEY,
            env!.TOKEN_ALGORITHM,
        );
        // Generate a JWT token.
        const now = Math.floor(Date.now() / 1000);
        const token = await jwt.create(
            {
                aud: env!.TOKEN_AUDIENCE,
                exp: now + env!.TOKEN_EXPIRATION_IN_SECONDS,
                iat: now,
                iss: env!.TOKEN_ISSUER,
                nbf: now,
                sub: subject,
                email: updatedUser?.email,
                locale: updatedUser?.locale,
                roles: updatedUser?.roles?.map((role) => role._id.toString()),
                timezone: updatedUser?.timezone,
                username: updatedUser?.username,
            },
            env!.TOKEN_ALGORITHM,
            privateKey,
        );
        return c.json(
            {
                access_token: token,
                expires_in: env!.TOKEN_EXPIRATION_IN_SECONDS,
                token_type: "Bearer",
            },
            HttpStatusCodes.OK,
        );
    } catch (error) {
        c.var.logger.error(`ssoauthorize: Error: ${JSON.stringify(error)}`);
        c.header(
            "WWW-Authenticate",
            `Bearer realm="${env!.TOKEN_ISSUER}", error="invalid_request"`,
        );
        return c.json(
            {
                error: "invalid_request" as const,
                message: HttpStatusPhrases.UNAUTHORIZED,
                statusCode: HttpStatusCodes.UNAUTHORIZED,
            },
            HttpStatusCodes.UNAUTHORIZED,
        );
    }
};

export const userinfo: AppRouteHandler<UserinfoRoute> = async (c) => {
    const payload = c.get("jwtPayload");
    const id = payload?.sub as string;
    try {
        const user = await userRepository.findById(id);
        if (!user) {
            c.var.logger.info(
                `userinfo: Could not find user with identifier=${id}.`,
            );
            return c.json(
                {
                    message: HttpStatusPhrases.NOT_FOUND,
                    statusCode: HttpStatusCodes.NOT_FOUND,
                },
                HttpStatusCodes.NOT_FOUND,
            );
        }
        const plainUser = user.toObject();
        c.var.logger.info(`userinfo: Found user with identifier=${id}.`);
        const redactedUser = {
            ...plainUser,
            password: undefined,
        };
        return c.json(redactedUser, HttpStatusCodes.OK);
    } catch (error) {
        c.var.logger.error(`userinfo: Unable to query successfully.`, error);
        c.header(
            "WWW-Authenticate",
            `Bearer realm="${env!.TOKEN_ISSUER}", error="invalid_request"`,
        );
        return c.json(
            {
                error: "invalid_request" as const,
                message: HttpStatusPhrases.INTERNAL_SERVER_ERROR,
                statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
            },
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
        );
    }
};
