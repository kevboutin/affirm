import { Model } from "mongoose";
import MongooseQuery from "../mongooseQuery";
import AuditLogRepository from "./auditLogRepository";
import { AuditLog, User } from "../models/index";
import type {
    AutocompleteResult,
    CurrentUser,
    FindAndCountAllUsersResult,
} from "./types";
import type {
    RedactedUserDocument,
    RedactedUserDocumentWithRoles,
    UserDocument,
    UserDocumentWithRoles,
} from "../models/user";

/**
 * @class UserRepository
 */
class UserRepository {
    model: Model<User>;
    auditLogRepository: AuditLogRepository;

    /**
     * Creates a user repository.
     *
     * @constructor
     * @param {Model<User>} model The database model.
     */
    constructor(model: Model<User>) {
        this.model = model;
        this.auditLogRepository = new AuditLogRepository(AuditLog);
    }

    /**
     * Create a new user.
     *
     * @param {Partial<User>} data The document.
     * @param {CurrentUser} currentUser The current user.
     * @returns {Promise<RedactedUserDocument>} The newly created document.
     */
    async create(
        data: Partial<User>,
        currentUser: CurrentUser,
    ): Promise<RedactedUserDocument> {
        await this.model.createCollection();
        const [record] = await this.model.create([
            {
                ...data,
            },
        ]);

        await this.auditLogRepository.log(
            {
                action: AuditLogRepository.CREATE,
                entityId: record._id.toString(),
                entityName: "user",
                values: data,
            },
            currentUser,
        );

        return record as RedactedUserDocument;
    }

    /**
     * Update the document matching the identifer.
     *
     * @param {string} id The identifier.
     * @param {Partial<User>} data The updated attributes with their values.
     * @param {CurrentUser} currentUser The current user.
     * @returns {Promise<RedactedUserDocumentWithRoles | null>} The updated document.
     */
    async update(
        id: string,
        data: Partial<User>,
        currentUser: CurrentUser,
    ): Promise<RedactedUserDocumentWithRoles | null> {
        await this.model
            .updateOne(
                { _id: id },
                {
                    ...data,
                },
            )
            .exec();

        const record = await this.findById(id);
        await this.auditLogRepository.log(
            {
                action: AuditLogRepository.UPDATE,
                entityId: id,
                entityName: "user",
                values: data,
            },
            currentUser,
        );
        return record;
    }

    /**
     * Delete the document matching the identifier.
     *
     * @param {string} id The identifier.
     * @param {CurrentUser} currentUser The current user.
     */
    async destroy(id: string, currentUser: CurrentUser): Promise<void> {
        await this.model.deleteOne({ _id: id }).exec();
        await this.auditLogRepository.log(
            {
                action: AuditLogRepository.DELETE,
                entityId: id,
                entityName: "user",
                values: null,
            },
            currentUser,
        );
    }

    /**
     * Count the documents matching the filter given.
     *
     * @param {Object} filter The filter to use in the query.
     * @returns {Promise<number>} A Promise to return the count.
     */
    async count(filter: Object): Promise<number> {
        return await this.model.countDocuments(filter).exec();
    }

    /**
     * Find a specific document.
     *
     * @param {string} id The identifier.
     * @returns {Promise<UserDocumentWithRoles>} A Promise to return a user document.
     */
    async findById(id: string): Promise<UserDocumentWithRoles | null> {
        const user = await this.model.findById(id).populate("roles");
        return user as unknown as UserDocumentWithRoles | null;
    }

    /**
     * Find documents matching by username.
     *
     * @param {string} username The username.
     * @returns {Promise<Array<User>>} A Promise to return an array of matching documents.
     */
    async findByUsername(username: string): Promise<Array<User>> {
        return await this.model.find({ username: username });
    }

    /**
     * Find documents matching by name and not by the identifier provided.
     *
     * @param {string} username The username.
     * @param {string} id The identifier.
     * @returns {Promise<Array<UserDocument>>} A Promise to return an array of matching documents.
     */
    async findByUsernameAndNotId(
        username: string,
        id: string,
    ): Promise<Array<UserDocument>> {
        return await this.model.find({ username: username, _id: { $ne: id } });
    }

    /**
     * Get a list of user documents.
     *
     * @param {Object} param
     * @param {Object} [param.filter] The filter values.
     * @param {number} [param.limit] The limit of returned documents.
     * @param {number} [param.offset] The offset to begin returning documents.
     * @param {string} [param.orderBy] The sort expression.
     * @returns {Promise<FindAndCountAllUsersResult>} The resulting count and documents.
     */
    async findAndCountAll({
        filter,
        limit = 0,
        offset = 0,
        orderBy = null,
    }: {
        filter?: any;
        limit?: number;
        offset?: number;
        orderBy?: string | null;
    }): Promise<FindAndCountAllUsersResult> {
        const query = MongooseQuery.forList({
            limit,
            offset,
            orderBy: orderBy ?? "username",
        });

        if (filter) {
            if (filter.id) {
                query.appendId("_id", filter.id);
            }

            if (filter.username) {
                query.appendILike("username", filter.username);
            }

            if (filter.email) {
                query.appendILike("email", filter.email);
            }
        }

        const [rows, count] = await Promise.all([
            this.model
                .find(query.criteria as any)
                .skip(query.skip as any)
                .limit(query.limit as any)
                .collation({ locale: "en" })
                .sort(query.sort as any)
                .exec(),
            this.model.countDocuments(query.criteria).exec(),
        ]);

        const redactedRows = rows.map((row) => ({
            ...row,
            password: undefined,
        })) as unknown as RedactedUserDocument[];

        return { count, rows: redactedRows };
    }

    /**
     * A role result for autocomplete.
     *
     * @typedef {Object} AutocompleteResult
     * @property {string} id The user identifier.
     * @property {string} name The username.
     */

    /**
     * Find a list of documents based on the provided search term.
     *
     * @param {string} search The search term.
     * @param {number} limit The limit on the results.
     * @returns {Promise<Array<AutocompleteResult>>} A Promise to an array of AutocompleteResult.
     */
    async findAllAutocomplete(
        search: string,
        limit: number,
    ): Promise<Array<AutocompleteResult>> {
        const query = MongooseQuery.forAutocomplete({
            limit,
            orderBy: "username_ASC",
        });

        if (search) {
            query.appendId("_id", search);
            query.appendILike("username", search);
            query.appendILike("email", search);
        }

        const records = await this.model
            .find(query.criteria as any)
            .limit(query.limit as any)
            .collation({ locale: "en" })
            .sort(query.sort as any)
            .exec();

        return records.map((record) => ({
            _id: record._id.toString(),
            username: record["username"],
        }));
    }
}

export default UserRepository;
