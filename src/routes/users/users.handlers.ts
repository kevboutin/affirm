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
import type { RedactedUserDocument } from "src/db/models/user";
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

export const list: AppRouteHandler<ListRoute> = async (c) => {
    try {
        const result: { count: number; rows: RedactedUserDocument[] } =
            await Promise.resolve(userRepository.findAndCountAll({}));
        const { count, rows } = result;
        c.var.logger.info(`list: Found ${count} users.`);
        return c.json({ count, rows }, HttpStatusCodes.OK);
    } catch (error) {
        c.var.logger.error(`list: Unable to query successfully.`, error);
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
    const user = c.req.valid("json") as {
        username: string;
        email: string;
        password?: string;
        locale?: string;
        timezone?: string;
        idpClient?: string;
        idpMetadata?: string;
        idpSub?: string;
        roles?: string[];
        verifiedEmail?: boolean;
        verifiedPhone?: boolean;
        authType?: string;
    };
    try {
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
            ...inserted,
            password: undefined,
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
    if (id.length !== 24) {
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
        c.var.logger.error(`getOne: Unable to query successfully.`, error);
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
    if (id.length !== 24) {
        c.var.logger.info(`patch: Identifier ${id} is not a valid value.`);
        return c.json(
            {
                message: HttpStatusPhrases.BAD_REQUEST,
                statusCode: HttpStatusCodes.BAD_REQUEST,
            },
            HttpStatusCodes.BAD_REQUEST,
        );
    }
    const updates = c.req.valid("json");
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
        c.var.logger.info(`patch: Updated user with identifier=${id}.`);
        const redactedUser = {
            ...user,
            password: undefined,
        };
        return c.json(redactedUser, HttpStatusCodes.OK);
    } catch (error) {
        c.var.logger.error(`patch: Unable to update successfully.`, error);
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
    if (id.length !== 24) {
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
        c.var.logger.error(`remove: Unable to remove successfully.`, error);
        return c.json(
            {
                message: HttpStatusPhrases.INTERNAL_SERVER_ERROR,
                statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
            },
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
        );
    }
};
