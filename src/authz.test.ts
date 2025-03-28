import { describe, test, expect, beforeEach, vi } from "vitest";
import {
    authz,
    ProviderUrlError,
    ProviderFetchError,
    ProviderMetadataError,
    ProviderUserinfoError,
} from "./authz";
import { AffirmTokenPayload } from "./jwt";
import { RoleDocument } from "./db/models/role";

describe("authz.checkPermission", () => {
    const mockRole = {
        name: "editor",
        _id: "507f1f77bcf86cd799439011",
        description: "Editor role",
        createdAt: new Date(),
        updatedAt: new Date(),
    } as unknown as RoleDocument;

    const mockJwt: AffirmTokenPayload = {
        roles: [mockRole],
        sub: "user123",
        iat: 123456789,
        email: "user@example.com",
        aud: "test",
        exp: 123456789,
        nbf: 123456789,
        iss: "https://example.com",
        email_verified: true,
        locale: "en_gb",
        timezone: "America/New_York",
        username: "jdoe",
    };

    test("should return true when user has permission", () => {
        expect(authz.checkPermission(mockJwt, "view", "logs")).toBe(true);
        expect(authz.checkPermission(mockJwt, "create", "logs")).toBe(true);
    });

    test("should return false when user does not have permission", () => {
        expect(authz.checkPermission(mockJwt, "delete", "logs")).toBe(false);
    });

    test("should return false when resource does not exist", () => {
        expect(authz.checkPermission(mockJwt, "view", "nonexistent")).toBe(
            false,
        );
    });

    test("should return false when jwt has no roles", () => {
        const jwtNoRoles: AffirmTokenPayload = {
            sub: "user123",
            iat: 123456789,
            email: "user@example.com",
            aud: "test",
            exp: 123456789,
            iss: "https://example.com",
            email_verified: true,
            username: "jdoe",
            nbf: 123456789,
        };
        expect(authz.checkPermission(jwtNoRoles, "view", "logs")).toBe(false);
    });
});

describe("authz.getProviderMetadata", () => {
    const validUrl = "https://example.com/.well-known/openid-configuration";
    const mockMetadata = {
        authorization_endpoint: "https://example.com/auth",
        token_endpoint: "https://example.com/token",
        userinfo_endpoint: "https://example.com/userinfo",
    };

    beforeEach(() => {
        // Reset fetch mock before each test
        vi.stubGlobal("fetch", vi.fn());
    });

    test("should fetch and return valid metadata", async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => mockMetadata,
        } as Response);

        const result = await authz.getProviderMetadata(validUrl);
        expect(result).toEqual(mockMetadata);
        expect(fetch).toHaveBeenCalledWith(validUrl);
    });

    test("should throw ProviderUrlError for empty URL", async () => {
        await expect(authz.getProviderMetadata("")).rejects.toThrowError(
            ProviderUrlError,
        );
    });

    test("should throw ProviderUrlError for non-HTTPS URL", async () => {
        await expect(
            authz.getProviderMetadata(
                "http://example.com/.well-known/openid-configuration",
            ),
        ).rejects.toThrowError(ProviderUrlError);
    });

    test("should throw ProviderUrlError for invalid well-known endpoint", async () => {
        await expect(
            authz.getProviderMetadata("https://example.com/wrong-endpoint"),
        ).rejects.toThrowError(ProviderUrlError);
    });

    test("should throw ProviderFetchError for non-200 response", async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: false,
            status: 404,
            statusText: "Not Found",
        } as Response);

        await expect(authz.getProviderMetadata(validUrl)).rejects.toThrowError(
            ProviderFetchError,
        );
    });

    test("should throw ProviderMetadataError for missing userinfo_endpoint", async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                authorization_endpoint: "https://example.com/auth",
                token_endpoint: "https://example.com/token",
                // userinfo_endpoint is missing
            }),
        } as Response);

        await expect(authz.getProviderMetadata(validUrl)).rejects.toThrowError(
            ProviderMetadataError,
        );
    });
});

describe("authz.getProviderUserinfo", () => {
    const validUrl = "https://example.com/userinfo";
    const providerToken = "provider-token-dummy-value";
    const mockUserinfoWithSub = {
        sub: "user123",
        email: "user@example.com",
        name: "John Doe",
    };

    const mockUserinfoWithOid = {
        oid: "user123",
        email: "user@example.com",
        name: "John Doe",
    };

    beforeEach(() => {
        vi.stubGlobal("fetch", vi.fn());
    });

    test("should fetch and return valid userinfo with sub", async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => mockUserinfoWithSub,
        } as Response);

        const result = await authz.getProviderUserinfo(validUrl, providerToken);
        expect(result).toEqual(mockUserinfoWithSub);
        expect(fetch).toHaveBeenCalledWith(validUrl, {
            headers: {
                Authorization: `Bearer ${providerToken}`,
            },
        });
    });

    test("should fetch and return valid userinfo with oid", async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => mockUserinfoWithOid,
        } as Response);

        const result = await authz.getProviderUserinfo(validUrl, providerToken);
        expect(result).toEqual(mockUserinfoWithOid);
        expect(fetch).toHaveBeenCalledWith(validUrl, {
            headers: {
                Authorization: `Bearer ${providerToken}`,
            },
        });
    });

    test("should throw ProviderUrlError for empty URL", async () => {
        await expect(
            authz.getProviderUserinfo("", providerToken),
        ).rejects.toThrowError(ProviderUrlError);
    });

    test("should throw ProviderUrlError for non-HTTPS URL", async () => {
        await expect(
            authz.getProviderUserinfo(
                "http://example.com/userinfo",
                providerToken,
            ),
        ).rejects.toThrowError(ProviderUrlError);
    });

    test("should throw ProviderFetchError for non-200 response", async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: false,
            status: 404,
            statusText: "Not Found",
        } as Response);

        await expect(
            authz.getProviderUserinfo(validUrl, providerToken),
        ).rejects.toThrowError(ProviderFetchError);
    });

    test("should throw ProviderUserinfoError for missing sub and oid", async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                email: "user@example.com",
                name: "John Doe",
                // sub and oid are missing
            }),
        } as Response);

        await expect(
            authz.getProviderUserinfo(validUrl, providerToken),
        ).rejects.toThrowError(ProviderUserinfoError);
    });
});
