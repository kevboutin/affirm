import type { AuditLogDocument } from "../models/auditLog";
import type { RoleDocument } from "../models/role";
import type { UserDocument } from "../models/user";

export interface AutocompleteResult {
    _id: string;
    username?: string;
    name?: string;
}

export interface CurrentUser {
    _id: string;
    username?: string;
    email?: string;
    roles?: Array<string>;
    locale?: string;
    timezone?: string;
    verifiedEmail?: boolean;
}

export interface FindAndCountAllAuditLogsResult {
    count: number;
    rows: Array<AuditLogDocument>;
}

export interface FindAndCountAllRolesResult {
    count: number;
    rows: Array<RoleDocument>;
}

export interface FindAndCountAllUsersResult {
    count: number;
    rows: Array<UserDocument>;
}

export interface LogParams {
    entityName: string;
    entityId: string;
    action: string;
    values: any;
}
