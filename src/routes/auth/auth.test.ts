import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as HttpStatusPhrases from "../../httpStatusPhrases";
import env from "../../env";
import { createTestApp } from "../../createApp";
import router from "./auth.index";

if (env!.NODE_ENV !== "test") {
    throw new Error("NODE_ENV must be 'test'");
}

let accessToken: string;

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

describe("auth routes", () => {
    beforeAll(async () => {});

    afterAll(async () => {});

    it("post /token validates the body when authenticating", async () => {
        const formData = new URLSearchParams({
            client_id: "507f1f77bcf86cd799439011",
            client_secret: "FakeGibberish!",
            grant_type: "badvalue",
        });
        const response = await createTestApp(router).request("/token", {
            method: "POST",
            body: formData,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
        expect(response.status).toBe(422);
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

    it("get /authorize expects JWT token to not be valid", async () => {
        const response = await createTestApp(router).request("/authorize", {
            method: "GET",
            headers: {
                Authorization: "Bearer e" + accessToken,
                "Content-Type": "application/json",
            },
        });
        expect(response.status).toBe(401);
        const json = await response.json();
        expect(json.message).toBe(HttpStatusPhrases.UNAUTHORIZED);
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
});
