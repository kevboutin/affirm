import { AffirmTokenPayload } from "./jwt";

type RolePermissions = {
    [roleName: string]: string[];
};

type ResourcePermissions = {
    [resource: string]: RolePermissions;
};

type ProviderMetadata = {
    authorization_endpoint: string;
    token_endpoint: string;
    userinfo_endpoint: string;
    [key: string]: unknown;
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

export class ProviderMetadataError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ProviderMetadataError";
    }
}

export class ProviderUrlError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ProviderUrlError";
    }
}

export class ProviderFetchError extends Error {
    constructor(
        message: string,
        public status?: number,
        public statusText?: string,
    ) {
        super(message);
        this.name = "ProviderFetchError";
    }
}

export namespace authz {
    /**
     * Check if a user has permission to perform an action on a resource.
     * @param {AffirmTokenPayload} jwt The affirmJWT access token payload.
     * @param {string} action The action to check.
     * @param {string} resource The resource to check.
     * @returns {boolean} True if the user has permission, false otherwise.
     */
    export function checkPermission(
        jwt: AffirmTokenPayload,
        action: string,
        resource: string,
    ): boolean {
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

    /**
     * Get the provider metadata from the provider metadata URL.
     * @param {string} url The provider metadata URL.
     * @returns {Promise<ProviderMetadata>} The provider metadata.
     */
    export async function getProviderMetadata(
        url: string,
    ): Promise<ProviderMetadata> {
        if (!url) {
            throw new ProviderUrlError("Provider metadata URL is required");
        }

        try {
            const parsedUrl = new URL(url);
            if (!parsedUrl.protocol.startsWith("https")) {
                throw new ProviderUrlError(
                    "Provider metadata URL must use HTTPS protocol",
                );
            }
            if (!url.endsWith("/.well-known/openid-configuration")) {
                throw new ProviderUrlError(
                    "Provider metadata URL must end with /.well-known/openid-configuration",
                );
            }
        } catch (e) {
            throw new ProviderUrlError("Invalid provider metadata URL");
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new ProviderFetchError(
                "Failed to fetch provider metadata",
                response.status,
                response.statusText,
            );
        }

        const metadata = await response.json();
        if (!metadata.userinfo_endpoint) {
            throw new ProviderMetadataError(
                "Provider metadata missing required userinfo_endpoint",
            );
        }

        return metadata;
    }
}
