import type { Model } from "mongoose";
import MongooseQuery from "../mongooseQuery";
import AuditLogRepository from "./auditLogRepository";
import { AuditLog } from "../models/index";
import type {
    AutocompleteResult,
    CurrentUser,
    FindAndCountAllRolesResult,
} from "./types";
import type { RoleDocument } from "../models/role";

/**
 * @class RoleRepository
 */
class RoleRepository {
    model: Model<RoleDocument>;
    auditLogRepository: AuditLogRepository;

    /**
     * Creates a role repository.
     *
     * @constructor
     * @param {Model<RoleDocument>} model The database model.
     */
    constructor(model: Model<RoleDocument>) {
        this.model = model;
        this.auditLogRepository = new AuditLogRepository(AuditLog);
    }

    /**
     * Create a new role.
     *
     * @param {Partial<RoleDocument>} data The document.
     * @param {CurrentUser} currentUser The current user.
     * @returns {Promise<Object>} The newly created document.
     */
    async create(
        data: Partial<RoleDocument>,
        currentUser: CurrentUser,
    ): Promise<RoleDocument> {
        await this.model.createCollection();
        const [record] = await this.model.create([data]);
        await this.auditLogRepository.log(
            {
                action: AuditLogRepository.CREATE,
                entityId: record._id.toString(),
                entityName: "role",
                values: data,
            },
            currentUser,
        );
        return record;
    }

    /**
     * Update the document matching the identifer.
     *
     * @param {string} id The identifier.
     * @param {Object} data The updated attributes with their values.
     * @param {CurrentUser} currentUser The current user.
     * @returns {Promise<RoleDocument | null>} The updated document.
     */
    async update(
        id: string,
        data: Object,
        currentUser: CurrentUser,
    ): Promise<RoleDocument | null> {
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
                entityName: "role",
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
                entityName: "role",
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
     * @returns {Promise<Object>} A Promise to return a role document.
     */
    async findById(id: string): Promise<RoleDocument | null> {
        return await this.model.findById(id);
    }

    /**
     * Find documents matching by name.
     *
     * @param {string} name The name.
     * @returns {Promise<Array<RoleDocument>>} A Promise to return an array of matching documents.
     */
    async findByName(name: string): Promise<Array<RoleDocument>> {
        return await this.model.find({ name: name });
    }

    /**
     * Find documents matching by name and not by the identifier provided.
     *
     * @param {string} name The name.
     * @param {string} id The identifier.
     * @returns {Promise<Array<RoleDocument>>} A Promise to return an array of matching documents.
     */
    async findByNameAndNotId(
        name: string,
        id: string,
    ): Promise<Array<RoleDocument>> {
        return await this.model.find({ name: name, _id: { $ne: id } });
    }

    /**
     * Get a list of role documents.
     *
     * @param {Object} param
     * @param {Object} [param.filter] The filter values.
     * @param {number} [param.limit] The limit of returned documents.
     * @param {number} [param.offset] The offset to begin returning documents.
     * @param {string} [param.orderBy] The sort expression.
     * @returns {Promise<FindAndCountAllRolesResult>} The resulting count and documents.
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
    }): Promise<FindAndCountAllRolesResult> {
        const query = MongooseQuery.forList({
            limit,
            offset,
            orderBy: orderBy ?? "name",
        });

        if (filter) {
            if (filter.id) {
                query.appendId("_id", filter.id);
            }

            if (filter.name) {
                query.appendILike("name", filter.name);
            }

            if (filter.description) {
                query.appendILike("description", filter.description);
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

        return { count, rows };
    }

    /**
     * A role result for autocomplete.
     *
     * @typedef {Object} AutocompleteResult
     * @property {string} id The role identifier.
     * @property {string} name The role name.
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
            orderBy: "name_ASC",
        });

        if (search) {
            query.appendId("_id", search);
            query.appendILike("name", search);
            query.appendILike("description", search);
        }

        const records = await this.model
            .find(query.criteria as any)
            .limit(query.limit as any)
            .collation({ locale: "en" })
            .sort(query.sort as any)
            .exec();

        return records.map((record) => ({
            _id: record._id.toString(),
            name: record["name"],
        }));
    }
}

export default RoleRepository;
