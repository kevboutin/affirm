import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as HttpStatusPhrases from "../../httpStatusPhrases";
import env from "../../env";
import { createTestApp } from "../../createApp";
import router from "./auth.index";
import { authz } from "@/authz";

if (env!.NODE_ENV !== "test") {
    throw new Error("NODE_ENV must be 'test'");
}

let accessToken: string;
let expiredToken: string =
    "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InNzdCJ9.eyJhdWQiOiJhZmZpcm0iLCJleHAiOjE3NDI2OTUxMjgsImlhdCI6MTc0MjY5MTUyOCwiaXNzIjoiaHR0cHM6Ly9hdXRoLmFmZmlybS5jb20iLCJuYmYiOjE3NDI2OTE1MjgsInN1YiI6IjY3ZDNjYzcxNGNlMTM2YTc4MzE0ODNjNyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGVzIjpbXSwidXNlcm5hbWUiOiJ0ZXN0dXNlciJ9.g9v36exme0cbWo0ccFQLq1FceiGo6GQ0IDkc8Zkl91ObsNAUtoWI0zcgcAqtGulYlT7UjXElTDLY90dP1-W6Z0RVoMJ4PksK3yVXs82DOVpt6pHIDnBaTL0xQSsI-5ONP_tQLG3YGXNZXXamGOqluyz5p-BGjv-Sd6djvV_wN_YYK2MEQ-QIGFdOjdxzsbPKiA91Sl5rBtBDoQjnU7XkA4_-428URGm0k07g_oH8WR9W_qyeznAsya6z9gKllmNUdFVy7WQr1QtIGwskywSKDYtY1A-5iWEBou_0OH63VaolqTzC_StMaS4nCA5wJWo9RU5HjHhtwkPl2f6nUrQCHA";

// Mock the UserRepository
vi.mock("../../db/repositories/userRepository", () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            findById: vi.fn().mockImplementation((id: string) => {
                if (id === "507f1f77bcf86cd799439011") {
                    return null; // User not found case
                }
                if (id === "67d3cc714ce136a7831483c7") {
                    return {
                        _id: id,
                        username: "testuser",
                        password: "$2b$10$abcdefghijklmnopqrstuv", // Mock hashed password
                        email: "test@example.com",
                        roles: [],
                    };
                }
                return null;
            }),
            findByIdpSub: vi.fn().mockImplementation((idpSub: string) => {
                if (idpSub === "nonexistent-user") {
                    return null; // User not found case
                }
                if (
                    idpSub === "existing-user" ||
                    idpSub === "67d3cc714ce136a7831483c7"
                ) {
                    return {
                        _id: "67d3cc714ce136a7831483c7",
                        username: "testuser",
                        email: "test@example.com",
                        roles: [],
                        idpSub: idpSub,
                        idpMetadataUrl:
                            "https://example.com/.well-known/openid-configuration",
                    };
                }
                return null;
            }),
            update: vi.fn().mockImplementation((id: string, updates: any) => {
                if (
                    id === "existing-user" ||
                    id === "67d3cc714ce136a7831483c7"
                ) {
                    return {
                        _id: id,
                        ...updates,
                    };
                }
                return null;
            }),
        })),
    };
});

// Mock bcrypt
vi.mock("bcrypt", () => ({
    default: {
        compare: vi.fn().mockImplementation((password, hash) => {
            return password === "testPassword!"; // Only return true for this specific password
        }),
    },
}));

// Mock @/authz
vi.mock("@/authz", () => ({
    authz: {
        getProviderMetadata: vi.fn().mockResolvedValue({
            userinfo_endpoint: "https://example.com/userinfo",
        }),
        getProviderUserinfo: vi.fn().mockResolvedValue({
            sub: "67d3cc714ce136a7831483c7",
            email: "test@example.com",
            username: "testuser",
        }),
    },
}));

describe("auth routes", () => {
    beforeAll(async () => {});

    afterAll(async () => {});

    it("post /token validates the body when authenticating", async () => {
        const formData = new URLSearchParams({
            client_id: "507f1f77bcf86cd799439011",
            client_secret: "FakeGibberish!",
            grant_type: "client_credentials",
        });
        const response = await createTestApp(router).request("/token", {
            method: "POST",
            body: formData,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
        expect(response.status).toBe(401);
        if (response.status === 401) {
            const json = await response.json();
            expect(json.error).toBe("invalid_client");
            expect(json.message).toBe("Credentials are not valid.");
            expect(json.statusCode).toBe(401);
        }
    });

    it("post /token using bad grant_type when authenticating", async () => {
        const formData = new URLSearchParams({
            client_id: "67d3cc714ce136a7831483c7",
            client_secret: "testPassword!",
            grant_type: "badvalue",
        });
        const response = await createTestApp(router).request("/token", {
            method: "POST",
            body: formData,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
        expect(response.status).toBe(401);
        if (response.status === 401) {
            const json = await response.json();
            expect(json.error).toBe("unsupported_grant_type");
            expect(json.message).toBe(
                "The provided grant_type is not supported.",
            );
            expect(json.statusCode).toBe(401);
        }
    });

    it("post /token validates the body when authenticating", async () => {
        const formData = new URLSearchParams({
            client_id: "507f1f77bcf86cd799439011",
            client_secret: "FakeGibberish!",
            grant_type: "client_credentials",
        });
        const response = await createTestApp(router).request("/token", {
            method: "POST",
            body: formData,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
        expect(response.status).toBe(401);
        if (response.status === 401) {
            const json = await response.json();
            expect(json.error).toBe("invalid_client");
            expect(json.message).toBe("Credentials are not valid.");
            expect(json.statusCode).toBe(401);
        }
    });

    it("post /token successfully authenticates using form data", async () => {
        const formData = new URLSearchParams({
            client_id: "67d3cc714ce136a7831483c7",
            client_secret: "testPassword!",
            grant_type: "client_credentials",
        });
        const response = await createTestApp(router).request("/token", {
            method: "POST",
            body: formData,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
        expect(response.status).toBe(200);
        if (response.status === 200) {
            const json = await response.json();
            expect(json?.token_type).toBe("Bearer");
            expect(json?.access_token).toBeDefined();
            expect(json?.expires_in).toBeDefined();
            accessToken = json.access_token;
        }
    });

    it("post /token successfully authenticates using basic auth", async () => {
        const token = Buffer.from(
            "67d3cc714ce136a7831483c7:testPassword!",
        ).toString("base64");
        const formData = new URLSearchParams({
            grant_type: "client_credentials",
        });
        const response = await createTestApp(router).request("/token", {
            method: "POST",
            body: formData,
            headers: {
                Authorization: "Basic " + token,
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
        expect(response.status).toBe(200);
        if (response.status === 200) {
            const json = await response.json();
            expect(json?.token_type).toBe("Bearer");
            expect(json?.access_token).toBeDefined();
            expect(json?.expires_in).toBeDefined();
        }
    });

    it("get /authorize validates the authorization header", async () => {
        const response = await createTestApp(router).request("/authorize", {
            method: "GET",
            headers: {
                Authorization: "Bearer ",
                "Content-Type": "application/json",
            },
        });
        expect(response.status).toBe(401);
        if (response.status === 401) {
            const json = await response.json();
            expect(json.error).toBe("invalid_request");
            expect(json.message).toBe("Bearer token is missing.");
            expect(json.statusCode).toBe(401);
        }
    });

    it("get /authorize validates the authorization header", async () => {
        const response = await createTestApp(router).request("/authorize", {
            method: "GET",
            headers: {
                Authorization: "Bearer " + accessToken,
                "Content-Type": "application/json",
            },
        });
        expect(response.status).toBe(200);
        if (response.status === 200) {
            const json = await response.json();
            expect(json?.email).toBeDefined();
        }
    });

    it("get /authorize expects JWT token to be expired", async () => {
        const response = await createTestApp(router).request("/authorize", {
            method: "GET",
            headers: {
                Authorization: "Bearer " + expiredToken,
                "Content-Type": "application/json",
            },
        });
        expect(response.status).toBe(401);
        const json = await response.json();
        expect(json.error).toBe("invalid_request");
        expect(json.message).toBe(HttpStatusPhrases.UNAUTHORIZED);
    });

    it("get /authorize expects JWS signature to not be valid", async () => {
        const response = await createTestApp(router).request("/authorize", {
            method: "GET",
            headers: {
                Authorization: "Bearer e" + accessToken,
                "Content-Type": "application/json",
            },
        });
        expect(response.status).toBe(401);
        const json = await response.json();
        expect(json.error).toBe("invalid_request");
        expect(json.message).toBe(HttpStatusPhrases.UNAUTHORIZED);
    });

    it("post /introspect validates the body when doing an introspection", async () => {
        const formData = new URLSearchParams({});
        const response = await createTestApp(router).request("/introspect", {
            method: "POST",
            body: formData,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
        expect(response.status).toBe(400);
        if (response.status === 400) {
            const json = await response.json();
            expect(json.error).toBe("invalid_request");
            expect(json.message).toBe("Token is missing.");
            expect(json.statusCode).toBe(400);
        }
    });

    it("post /introspect returns 200 when doing an introspection", async () => {
        const formData = new URLSearchParams({
            token: accessToken,
        });
        const response = await createTestApp(router).request("/introspect", {
            method: "POST",
            body: formData,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
        expect(response.status).toBe(200);
    });

    it("post /revoke validates the body when revoking a token", async () => {
        const formData = new URLSearchParams({});
        const response = await createTestApp(router).request("/revoke", {
            method: "POST",
            body: formData,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
        expect(response.status).toBe(400);
        if (response.status === 400) {
            const json = await response.json();
            expect(json.error).toBe("invalid_request");
            expect(json.message).toBe("Token is missing.");
            expect(json.statusCode).toBe(400);
        }
    });

    it("post /revoke returns 200 when revoking a token", async () => {
        const formData = new URLSearchParams({
            token: accessToken,
        });
        const response = await createTestApp(router).request("/revoke", {
            method: "POST",
            body: formData,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
        expect(response.status).toBe(200);
    });

    it("get /.well-known/jwks.json", async () => {
        const response = await createTestApp(router).request(
            "/.well-known/jwks.json",
            {
                method: "GET",
            },
        );
        expect(response.status).toBe(200);
        if (response.status === 200) {
            const json = await response.json();
            expect(json?.keys[0]?.kty).toBeDefined();
            expect(json?.keys[0]?.n).toBeDefined();
            expect(json?.keys[0]?.e).toBeDefined();
        }
    });

    it("get /.well-known/oauth-authorization-server", async () => {
        const response = await createTestApp(router).request(
            "/.well-known/oauth-authorization-server",
            {
                method: "GET",
            },
        );
        expect(response.status).toBe(200);
        if (response.status === 200) {
            const json = await response.json();
            expect(json?.userinfo_endpoint).toBeDefined();
            expect(json?.token_endpoint).toBeDefined();
            expect(json?.authorization_endpoint).toBeDefined();
            expect(json?.jwks_uri).toBeDefined();
        }
    });

    it("post /sso/authorize validates the authorization header", async () => {
        const response = await createTestApp(router).request("/sso/authorize", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                metadataUrl:
                    "https://example.com/.well-known/openid-configuration",
            }),
        });
        const json = await response.json();
        expect(response.status).toBe(401);
        expect(json.error).toBe("invalid_request");
        expect(json.message).toBe("Authorization header is missing.");
        expect(json.statusCode).toBe(401);
    });

    it("post /sso/authorize validates the bearer token", async () => {
        const response = await createTestApp(router).request("/sso/authorize", {
            method: "POST",
            headers: {
                Authorization: "Bearer ",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                metadataUrl:
                    "https://example.com/.well-known/openid-configuration",
            }),
        });
        const json = await response.json();
        expect(response.status).toBe(401);
        expect(json.error).toBe("invalid_request");
        expect(json.message).toBe("Bearer token is missing.");
        expect(json.statusCode).toBe(401);
    });

    it("post /sso/authorize successfully authorizes with valid token", async () => {
        // Ensure provider metadata and userinfo are mocked for this specific test
        vi.spyOn(authz, "getProviderMetadata").mockResolvedValueOnce({
            userinfo_endpoint: "https://example.com/userinfo",
        } as any);
        // Override the default mock for this specific test
        vi.spyOn(authz, "getProviderUserinfo").mockResolvedValueOnce({
            sub: "existing-user", // Use "existing-user" which we know exists in our mock repository
            email: "test@example.com",
            username: "testuser",
        });

        const response = await createTestApp(router).request("/sso/authorize", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                metadataUrl:
                    "https://example.com/.well-known/openid-configuration",
            }),
        });

        const json = await response.json();
        expect(response.status).toBe(200);
        expect(json.token_type).toBe("Bearer");
        expect(json.access_token).toBeDefined();
        expect(json.expires_in).toBeDefined();
    });

    it("post /sso/authorize returns 500 when provider userinfo fails", async () => {
        vi.mock("@/authz", () => ({
            authz: {
                getProviderMetadata: vi
                    .fn()
                    .mockRejectedValue(new Error("Provider error")),
            },
        }));

        const response = await createTestApp(router).request("/sso/authorize", {
            method: "POST",
            headers: {
                Authorization: "Bearer valid-token",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                metadataUrl:
                    "https://example.com/.well-known/openid-configuration",
            }),
        });

        expect(response.status).toBe(500);
        const json = await response.json();
        expect(json.error).toBe("invalid_request");
        expect(json.message).toBe(HttpStatusPhrases.INTERNAL_SERVER_ERROR);
        expect(json.statusCode).toBe(500);
    });

    it("post /sso/authorize returns 500 when user update fails", async () => {
        vi.mock("@/authz", () => ({
            authz: {
                getProviderMetadata: vi.fn().mockResolvedValue({
                    userinfo_endpoint: "https://example.com/userinfo",
                }),
                getProviderUserinfo: vi.fn().mockResolvedValue({
                    sub: "nonexistent-user",
                    email: "test@example.com",
                }),
            },
        }));

        const response = await createTestApp(router).request("/sso/authorize", {
            method: "POST",
            headers: {
                Authorization: "Bearer valid-token",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                metadataUrl:
                    "https://example.com/.well-known/openid-configuration",
            }),
        });

        const json = await response.json();
        expect(response.status).toBe(500);
        expect(json.error).toBe("invalid_request");
        expect(json.message).toBe(HttpStatusPhrases.INTERNAL_SERVER_ERROR);
        expect(json.statusCode).toBe(500);
    });
});
