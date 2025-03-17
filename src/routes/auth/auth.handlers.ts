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
    UserinfoRoute,
} from "./auth.routes.js";
import { jwt } from "@/jwt";
import { importPKCS8, importSPKI, exportJWK } from "jose";
import bcrypt from "bcrypt";

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
const userRepository = new UserRepository(User);

const validatePassword = async (password: string, hashedPassword: string) => {
    return await bcrypt.compare(password, hashedPassword);
};

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
        return c.json(
            {
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
            return c.json(
                { message: "Credentials are not valid.", statusCode: 401 },
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
                return c.json(
                    { message: "Credentials are not valid.", statusCode: 401 },
                    HttpStatusCodes.UNAUTHORIZED,
                );
            }
            c.var.logger.info(
                `authenticate: Password is valid for client ${clientId}.`,
            );
        }

        // Import the private key using jose
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
        return c.json(
            {
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
        return c.json(
            {
                message: "Authorization header is missing.",
                statusCode: HttpStatusCodes.UNAUTHORIZED,
            },
            HttpStatusCodes.UNAUTHORIZED,
        );
    }
    const bearerToken = header.split(" ")[1];
    if (!bearerToken) {
        return c.json(
            {
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
        c.var.logger.error(`authorize: Unable to verify JWT token.`, error);
        return c.json(
            {
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
        return c.json(
            {
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
        return c.json(
            {
                message: HttpStatusPhrases.INTERNAL_SERVER_ERROR,
                statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
            },
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
        );
    }
};
