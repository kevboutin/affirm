import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { testClient } from "hono/testing";
import { Hono } from "hono";
import onError from "./onError";
import {
    INTERNAL_SERVER_ERROR,
    OK,
    BAD_REQUEST,
    NOT_FOUND,
    UNAUTHORIZED,
} from "../httpStatusCodes";

describe("onError middleware", () => {
    let originalEnv: string | undefined;

    beforeEach(() => {
        originalEnv = process.env.NODE_ENV;
    });

    afterEach(() => {
        process.env.NODE_ENV = originalEnv;
        vi.restoreAllMocks();
    });

    it("should handle error with status property", async () => {
        const app = new Hono();
        app.onError(onError);
        app.get("/test", () => {
            const error = new Error("Test error");
            (error as any).status = BAD_REQUEST;
            throw error;
        });

        const client = testClient(app) as any;
        const response = await client.test.$get();
        const json = await response.json();

        expect(response.status).toBe(BAD_REQUEST);
        expect(json).toEqual({
            message: "Test error",
            statusCode: BAD_REQUEST,
            stack: expect.any(String),
        });
    });

    it("should handle error without status property", async () => {
        const app = new Hono();
        app.onError(onError);
        app.get("/test", () => {
            throw new Error("Test error");
        });

        const client = testClient(app) as any;
        const response = await client.test.$get();
        const json = await response.json();

        expect(response.status).toBe(INTERNAL_SERVER_ERROR);
        expect(json).toEqual({
            message: "Test error",
            statusCode: INTERNAL_SERVER_ERROR,
            stack: expect.any(String),
        });
    });

    it("should default to INTERNAL_SERVER_ERROR when status is OK", async () => {
        const app = new Hono();
        app.onError(onError);
        app.get("/test", () => {
            const error = new Error("Test error");
            (error as any).status = OK;
            throw error;
        });

        const client = testClient(app) as any;
        const response = await client.test.$get();
        const json = await response.json();

        expect(response.status).toBe(INTERNAL_SERVER_ERROR);
        expect(json).toEqual({
            message: "Test error",
            statusCode: INTERNAL_SERVER_ERROR,
            stack: expect.any(String),
        });
    });

    it("should handle different status codes", async () => {
        const app = new Hono();
        app.onError(onError);
        app.get("/test", () => {
            const error = new Error("Not found");
            (error as any).status = NOT_FOUND;
            throw error;
        });

        const client = testClient(app) as any;
        const response = await client.test.$get();
        const json = await response.json();

        expect(response.status).toBe(NOT_FOUND);
        expect(json.statusCode).toBe(NOT_FOUND);
        expect(json.message).toBe("Not found");
    });

    it("should handle UNAUTHORIZED status code", async () => {
        const app = new Hono();
        app.onError(onError);
        app.get("/test", () => {
            const error = new Error("Unauthorized");
            (error as any).status = UNAUTHORIZED;
            throw error;
        });

        const client = testClient(app) as any;
        const response = await client.test.$get();
        const json = await response.json();

        expect(response.status).toBe(UNAUTHORIZED);
        expect(json.statusCode).toBe(UNAUTHORIZED);
        expect(json.message).toBe("Unauthorized");
    });

    it("should exclude stack in production environment from c.env", async () => {
        const app = new Hono<{ Bindings: { NODE_ENV: string } }>();
        app.onError(onError);
        app.get("/test", (c) => {
            c.env = { NODE_ENV: "production" };
            const error = new Error("Test error");
            (error as any).status = BAD_REQUEST;
            throw error;
        });

        const client = testClient(app) as any;
        const response = await client.test.$get();
        const json = await response.json();

        expect(json.stack).toBeUndefined();
    });

    it("should exclude stack in production environment from process.env", async () => {
        process.env.NODE_ENV = "production";
        const app = new Hono();
        app.onError(onError);
        app.get("/test", () => {
            const error = new Error("Test error");
            (error as any).status = BAD_REQUEST;
            throw error;
        });

        const client = testClient(app) as any;
        const response = await client.test.$get();
        const json = await response.json();

        expect(json.stack).toBeUndefined();
    });

    it("should include stack in development environment", async () => {
        const app = new Hono<{ Bindings: { NODE_ENV: string } }>();
        app.onError(onError);
        app.get("/test", (c) => {
            c.env = { NODE_ENV: "development" };
            const error = new Error("Test error");
            (error as any).status = BAD_REQUEST;
            throw error;
        });

        const client = testClient(app) as any;
        const response = await client.test.$get();
        const json = await response.json();

        expect(json.stack).toBeDefined();
        expect(typeof json.stack).toBe("string");
    });

    it("should include stack in test environment", async () => {
        const app = new Hono<{ Bindings: { NODE_ENV: string } }>();
        app.onError(onError);
        app.get("/test", (c) => {
            c.env = { NODE_ENV: "test" };
            const error = new Error("Test error");
            (error as any).status = BAD_REQUEST;
            throw error;
        });

        const client = testClient(app) as any;
        const response = await client.test.$get();
        const json = await response.json();

        expect(json.stack).toBeDefined();
        expect(typeof json.stack).toBe("string");
    });

    it("should prefer c.env.NODE_ENV over process.env.NODE_ENV", async () => {
        process.env.NODE_ENV = "production";
        const app = new Hono<{ Bindings: { NODE_ENV: string } }>();
        app.onError(onError);
        app.get("/test", (c) => {
            c.env = { NODE_ENV: "development" };
            const error = new Error("Test error");
            (error as any).status = BAD_REQUEST;
            throw error;
        });

        const client = testClient(app) as any;
        const response = await client.test.$get();
        const json = await response.json();

        // Should use c.env (development), so stack should be included
        expect(json.stack).toBeDefined();
    });

    it("should fallback to process.env.NODE_ENV when c.env is undefined", async () => {
        process.env.NODE_ENV = "production";
        const app = new Hono();
        app.onError(onError);
        app.get("/test", () => {
            const error = new Error("Test error");
            (error as any).status = BAD_REQUEST;
            throw error;
        });

        const client = testClient(app) as any;
        const response = await client.test.$get();
        const json = await response.json();

        expect(json.stack).toBeUndefined();
    });

    it("should handle error without message", async () => {
        const app = new Hono();
        app.onError(onError);
        app.get("/test", () => {
            const error = new Error();
            (error as any).status = BAD_REQUEST;
            throw error;
        });

        const client = testClient(app) as any;
        const response = await client.test.$get();
        const json = await response.json();

        expect(json.message).toBe("");
    });

    it("should handle error without stack", async () => {
        const app = new Hono<{ Bindings: { NODE_ENV: string } }>();
        app.onError(onError);
        app.get("/test", (c) => {
            c.env = { NODE_ENV: "development" };
            const error = new Error("Test error");
            error.stack = undefined;
            (error as any).status = BAD_REQUEST;
            throw error;
        });

        const client = testClient(app) as any;
        const response = await client.test.$get();
        const json = await response.json();

        expect(json.stack).toBeUndefined();
    });

    it("should handle error with empty stack", async () => {
        const app = new Hono<{ Bindings: { NODE_ENV: string } }>();
        app.onError(onError);
        app.get("/test", (c) => {
            c.env = { NODE_ENV: "development" };
            const error = new Error("Test error");
            error.stack = "";
            (error as any).status = BAD_REQUEST;
            throw error;
        });

        const client = testClient(app) as any;
        const response = await client.test.$get();
        const json = await response.json();

        expect(json.stack).toBe("");
    });

    it("should handle error when NODE_ENV is not set", async () => {
        delete process.env.NODE_ENV;
        const app = new Hono();
        app.onError(onError);
        app.get("/test", () => {
            const error = new Error("Test error");
            (error as any).status = BAD_REQUEST;
            throw error;
        });

        const client = testClient(app) as any;
        const response = await client.test.$get();
        const json = await response.json();

        // When NODE_ENV is undefined, it's not "production", so stack should be included
        expect(json.stack).toBeDefined();
    });

    it("should handle error with custom error type", async () => {
        class CustomError extends Error {
            status: number;
            constructor(message: string, status: number) {
                super(message);
                this.status = status;
            }
        }

        const app = new Hono();
        app.onError(onError);
        app.get("/test", () => {
            throw new CustomError("Custom error", BAD_REQUEST);
        });

        const client = testClient(app) as any;
        const response = await client.test.$get();
        const json = await response.json();

        expect(response.status).toBe(BAD_REQUEST);
        expect(json.message).toBe("Custom error");
        expect(json.statusCode).toBe(BAD_REQUEST);
    });

    it("should return JSON response with correct content type", async () => {
        const app = new Hono();
        app.onError(onError);
        app.get("/test", () => {
            const error = new Error("Test error");
            (error as any).status = BAD_REQUEST;
            throw error;
        });

        const client = testClient(app) as any;
        const response = await client.test.$get();

        expect(response.headers.get("content-type")).toContain(
            "application/json",
        );
    });

    it("should handle multiple errors with different status codes", async () => {
        const app = new Hono();
        app.onError(onError);
        app.get("/bad-request", () => {
            const error = new Error("Bad request");
            (error as any).status = BAD_REQUEST;
            throw error;
        });
        app.get("/not-found", () => {
            const error = new Error("Not found");
            (error as any).status = NOT_FOUND;
            throw error;
        });
        app.get("/unauthorized", () => {
            const error = new Error("Unauthorized");
            (error as any).status = UNAUTHORIZED;
            throw error;
        });

        const client = testClient(app) as any;

        const badRequestResponse = await client["bad-request"].$get();
        const notFoundResponse = await client["not-found"].$get();
        const unauthorizedResponse = await client["unauthorized"].$get();

        expect((await badRequestResponse.json()).statusCode).toBe(BAD_REQUEST);
        expect((await notFoundResponse.json()).statusCode).toBe(NOT_FOUND);
        expect((await unauthorizedResponse.json()).statusCode).toBe(
            UNAUTHORIZED,
        );
    });
});
