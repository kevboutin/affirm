import { AffirmTokenPayload } from "./jwt";

type RolePermissions = {
    [roleName: string]: string[];
};

type ResourcePermissions = {
    [resource: string]: RolePermissions;
};

const PERMISSIONS: ResourcePermissions = {
    logs: {
        viewer: ["view:logs"],
        editor: ["view:logs", "create:logs", "update:logs"],
        admin: ["view:logs", "create:logs", "update:logs", "delete:logs"],
    },
    roles: {
        viewer: ["view:roles"],
        editor: ["view:roles", "create:roles", "update:roles"],
        admin: ["view:roles", "create:roles", "update:roles", "delete:roles"],
    },
    users: {
        viewer: ["view:users"],
        editor: ["view:users", "create:users", "update:users"],
        admin: ["view:users", "create:users", "update:users", "delete:users"],
    },
};

export namespace authz {
    export function checkPermission(
        jwt: AffirmTokenPayload,
        action: string,
        resource: string,
    ) {
        if (!jwt.roles) return false;
        for (const role of jwt.roles) {
            const roleName = role.name;
            if (
                PERMISSIONS[resource]?.[roleName]?.includes(
                    `${action}:${resource}`,
                )
            ) {
                return true;
            }
        }
        return false;
    }
}
