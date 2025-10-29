import { Types } from "mongoose";
import * as HttpStatusCodes from "../../httpStatusCodes";
import * as HttpStatusPhrases from "../../httpStatusPhrases";
import DatabaseService from "../../db/index";
import env from "../../env";
import type { AppRouteHandler } from "../../types";
import { User } from "../../db/models/index";
import UserRepository from "../../db/repositories/userRepository";
import { ZOD_ERROR_CODES, ZOD_ERROR_MESSAGES } from "../../constants";
import type {
    CreateRoute,
    GetOneRoute,
    ListRoute,
    PatchRoute,
    RemoveRoute,
} from "./users.routes.js";
import type { RedactedUserPlainObject } from "src/db/models/user";
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

const isValidObjectId = (id: string) => {
    if (Types.ObjectId.isValid(id)) {
        if (String(new Types.ObjectId(id)) === id) return true;
        return false;
    }
    return false;
};

export const list: AppRouteHandler<ListRoute> = async (c) => {
    try {
        const params: {
            limit?: number;
            offset?: number;
            orderBy?: string | null;
            filter?: any;
        } = {};

        const limit = parseInt(c.req.query("limit") ?? "0");
        const offset = parseInt(c.req.query("offset") ?? "0");
        const orderBy = c.req.query("orderBy") ?? null;
        const filter = {
            id: c.req.query("id"),
            username: c.req.query("username"),
            email: c.req.query("email"),
        };

        if (limit > 0) params.limit = limit;
        if (offset > 0) params.offset = offset;
        if (orderBy) params.orderBy = orderBy;
        params.filter = filter;
        c.var.logger.info(
            `list: Using params=${JSON.stringify(params, null, 2)}`,
        );

        const result: { count: number; rows: RedactedUserPlainObject[] } =
            await Promise.resolve(userRepository.findAndCountAll(params));
        const { count, rows } = result;
        c.var.logger.info(`list: Found ${count} users.`);
        return c.json({ count, rows }, HttpStatusCodes.OK);
    } catch (error) {
        c.var.logger.error(
            `list: Unable to query successfully. ${JSON.stringify(error, null, 2)}`,
        );
        console.error(`list: Unable to query successfully.`, error);
        return c.json(
            {
                message: HttpStatusPhrases.INTERNAL_SERVER_ERROR,
                statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
            },
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
        );
    }
};

export const create: AppRouteHandler<CreateRoute> = async (c) => {
    const user = c.req.valid("json") as Partial<User> & {
        authType?: "oidc" | "oauth";
    };
    try {
        if (user.roles) {
            user.roles = user.roles
                .filter((id) => isValidObjectId(id as unknown as string))
                .map(
                    (id) => new Types.ObjectId(id as unknown as string),
                ) as unknown as any;
        }
        if (user.password) {
            const saltRounds = 10;
            user.password = await bcrypt.hash(user.password, saltRounds);
        }
        const inserted = await userRepository.create(user, {
            _id: "fakeid",
            username: "dummy",
            email: "dummy@gmail.com",
        });
        c.var.logger.info(
            `create: Created user with username=${user.username}.`,
        );
        const redactedUser = {
            _id: inserted._id,
            username: inserted.username,
            email: inserted.email,
            authType: inserted.authType,
            verifiedEmail: inserted.verifiedEmail,
            verifiedPhone: inserted.verifiedPhone,
            roles: inserted.roles ?? undefined,
            locale: inserted.locale ?? undefined,
            timezone: inserted.timezone ?? undefined,
            idpClient: inserted.idpClient ?? undefined,
            idpMetadata: inserted.idpMetadata ?? undefined,
            idpSub: inserted.idpSub ?? undefined,
        };
        return c.json(redactedUser, HttpStatusCodes.CREATED);
    } catch (error) {
        console.error(`create: Unable to create user.`, error);
        return c.json(
            {
                message: HttpStatusPhrases.INTERNAL_SERVER_ERROR,
                statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
            },
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
        );
    }
};

export const getOne: AppRouteHandler<GetOneRoute> = async (c) => {
    const { id } = c.req.valid("param");
    if (!isValidObjectId(id)) {
        c.var.logger.info(`getOne: Identifier ${id} is not a valid value.`);
        return c.json(
            {
                message: HttpStatusPhrases.BAD_REQUEST,
                statusCode: HttpStatusCodes.BAD_REQUEST,
            },
            HttpStatusCodes.BAD_REQUEST,
        );
    }
    try {
        const user = await userRepository.findById(id);
        if (!user) {
            c.var.logger.info(
                `getOne: Could not find user with identifier=${id}.`,
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
        c.var.logger.info(`getOne: Found user with identifier=${id}.`);
        const redactedUser = {
            ...plainUser,
            password: undefined,
        };
        return c.json(redactedUser, HttpStatusCodes.OK);
    } catch (error) {
        c.var.logger.error(
            { err: error },
            `getOne: Unable to query successfully.`,
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

export const patch: AppRouteHandler<PatchRoute> = async (c) => {
    const { id } = c.req.valid("param");
    if (!isValidObjectId(id)) {
        c.var.logger.info(`patch: Identifier ${id} is not a valid value.`);
        return c.json(
            {
                message: HttpStatusPhrases.BAD_REQUEST,
                statusCode: HttpStatusCodes.BAD_REQUEST,
            },
            HttpStatusCodes.BAD_REQUEST,
        );
    }
    const updates = c.req.valid("json") as Partial<User> & {
        authType?: "oidc" | "oauth";
    };
    if (Object.keys(updates).length === 0) {
        return c.json(
            {
                success: false,
                error: {
                    issues: [
                        {
                            code: ZOD_ERROR_CODES.INVALID_UPDATES,
                            path: [],
                            message: ZOD_ERROR_MESSAGES.NO_UPDATES,
                        },
                    ],
                    name: "ZodError",
                },
                statusCode: HttpStatusCodes.UNPROCESSABLE_ENTITY,
            },
            HttpStatusCodes.UNPROCESSABLE_ENTITY,
        );
    }
    try {
        const user = await userRepository.update(id, updates, {
            _id: "fakeid",
            username: "dummy",
            email: "dummy@gmail.com",
        });
        if (!user) {
            c.var.logger.info(
                `patch: Could not find user with identifier=${id}.`,
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
        c.var.logger.info(`patch: Updated user with identifier=${id}.`);
        const redactedUser = {
            ...plainUser,
            password: undefined,
        };
        return c.json(redactedUser, HttpStatusCodes.OK);
    } catch (error) {
        c.var.logger.error(
            { err: error },
            `patch: Unable to update successfully.`,
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

export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
    const { id } = c.req.valid("param");
    if (!isValidObjectId(id)) {
        c.var.logger.info(`remove: Identifier ${id} is not a valid value.`);
        return c.json(
            {
                message: HttpStatusPhrases.BAD_REQUEST,
                statusCode: HttpStatusCodes.BAD_REQUEST,
            },
            HttpStatusCodes.BAD_REQUEST,
        );
    }
    try {
        const user = await userRepository.findById(id);
        if (!user) {
            c.var.logger.info(
                `remove: Could not find user with identifier=${id}.`,
            );
            return c.json(
                {
                    message: HttpStatusPhrases.NOT_FOUND,
                    statusCode: HttpStatusCodes.NOT_FOUND,
                },
                HttpStatusCodes.NOT_FOUND,
            );
        }
        await userRepository.destroy(id, {
            _id: "fakeid",
            username: "dummy",
            email: "dummy@gmail.com",
        });
        c.var.logger.info(`remove: Removed user with identifier=${id}.`);
        return c.body(null, HttpStatusCodes.NO_CONTENT);
    } catch (error) {
        c.var.logger.error(
            { err: error },
            `remove: Unable to remove successfully.`,
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
