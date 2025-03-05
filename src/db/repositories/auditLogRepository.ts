import MongooseQuery from "../mongooseQuery";
import type { Model } from "mongoose";
import type {
    CurrentUser,
    FindAndCountAllAuditLogsResult,
    LogParams,
} from "./types";
import type { AuditLogDocument } from "../models/auditLog";

/**
 * @class AuditLogRepository
 */
class AuditLogRepository {
    model: Model<AuditLogDocument>;

    /**
     * Creates the repository for auditLog.
     *
     * @param {Model<AuditLogDocument>} model The database model.
     */
    constructor(model: Model<AuditLogDocument>) {
        this.model = model;
    }

    static get CREATE() {
        return "create";
    }

    static get UPDATE() {
        return "update";
    }

    static get DELETE() {
        return "delete";
    }

    /**
     * Create a new audit log entry.
     *
     * @param {Object} param
     * @param {string} param.entityName The entity name.
     * @param {string} param.entityId The entity identifier.
     * @param {string} param.action The action preformed on the entity.
     * @param {Object} param.values The updated document.
     * @param {CurrentUser} currentUser The user document of the user that requested the update.
     * @returns {Promise<AuditLogDocument>} The created audit log document.
     */
    async log(
        { entityName, entityId, action, values }: LogParams,
        currentUser: CurrentUser,
    ) {
        const [log] = await this.model.create([
            {
                entityName,
                entityId,
                action,
                values,
                timestamp: new Date(),
                createdById: currentUser ? currentUser._id : null,
                createdByEmail: currentUser ? currentUser.email : null,
            },
        ]);

        return log;
    }

    /**
     * Get a list of audit log documents.
     *
     * @param {Object} param
     * @param {Object} [param.filter] The filter values.
     * @param {number} [param.limit] The limit of returned documents.
     * @param {number} [param.offset] The offset to begin returning doucuments.
     * @param {string} [param.orderBy] The sort expression.
     * @returns {Promise<FindAndCountAllAuditLogsResult>} The count and the resulting documents.
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
    }): Promise<FindAndCountAllAuditLogsResult> {
        const query = MongooseQuery.forList({
            limit,
            offset,
            orderBy: orderBy ?? "createdAt_DESC",
        });

        if (filter) {
            if (filter.timestampRange) {
                const { start, end } = filter.timestampRange;
                if (start || end) {
                    query.appendRange("timestamp", filter.timestampRange);
                }
            }
            if (filter.action) {
                query.appendEqual("action", filter.action);
            }
            if (filter.entityId) {
                query.appendEqual("entityId", filter.entityId);
            }
            if (filter.createdByEmail) {
                query.appendILike("createdByEmail", filter.createdByEmail);
            }
            if (filter?.entityNames?.length) {
                query.appendIn("entityName", filter.entityNames);
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
}

export default AuditLogRepository;
