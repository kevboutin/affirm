import { testClient } from "hono/testing";
import * as HttpStatusPhrases from "../../httpStatusPhrases";
import {
    afterAll,
    beforeAll,
    describe,
    expect,
    expectTypeOf,
    it,
} from "vitest";
import { ZodIssueCode } from "zod";
import env from "../../env";
import { ZOD_ERROR_CODES, ZOD_ERROR_MESSAGES } from "../../constants";
import createApp from "../../createApp";
import router from "./auth.index";

if (env!.NODE_ENV !== "test") {
    throw new Error("NODE_ENV must be 'test'");
}

const client = testClient(createApp().route("/", router));

describe("auth routes", () => {
    beforeAll(async () => {});

    afterAll(async () => {});

    it("post /token validates the body when authenticating", async () => {
        const formData = new URLSearchParams({
            client_id: "507f1f77bcf86cd799439011",
            client_secret: "FakeGibberish!",
            grant_type: "badvalue",
        });
        const response = await createApp().request("/token", {
            method: "POST",
            body: formData,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
        console.log(`KEVIN: ${JSON.stringify(response)}`);
        expect(response.status).toBe(401);
        if (response.status === 401) {
            const json = await response.json();
            expect(json.message).toBe(
                "The provided grant_type is not supported.",
            );
            expect(json.statusCode).toBe(401);
        }
    });

    it("post /token successfully authenticates using form data", async () => {
        const formData = new URLSearchParams({
            client_id: "507f1f77bcf86cd799439011",
            client_secret: "FakeGibberish!",
            grant_type: "client_credentials",
        });
        const response = await createApp().request("/token", {
            method: "POST",
            body: formData,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
        console.log(`KEVIN: ${JSON.stringify(response)}`);
        expect(response.status).toBe(200);
        if (response.status === 200) {
            const json = await response.json();
            expect(json?.token_type).toBe("Bearer");
            expect(json?.access_token).toBeDefined();
            expect(json?.expires_in).toBeDefined();
        }
    });

    it("post /token successfully authenticates using basic auth", async () => {
        const token = Buffer.from(
            "507f1f77bcf86cd799439011:FakeGibberish!",
        ).toString("base64");
        const formData = new URLSearchParams({
            grant_type: "client_credentials",
        });
        const response = await createApp().request("/token", {
            method: "POST",
            body: formData,
            headers: {
                Authorization: "Basic " + token,
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
        console.log(`KEVIN: ${JSON.stringify(response)}`);
        expect(response.status).toBe(200);
        if (response.status === 200) {
            const json = await response.json();
            expect(json?.token_type).toBe("Bearer");
            expect(json?.access_token).toBeDefined();
            expect(json?.expires_in).toBeDefined();
        }
    });
    /*
    it("get /authorize validates the authorization header", async () => {
        const response = await client.authorize.$get({
            headers: {
                Authorization: "Bearer " + token,
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
        expect(response.status).toBe(401);
        if (response.status === 401) {
            const json = await response.json();
            expect(json.message).toBe(HttpStatusPhrases.UNAUTHORIZED);
        }
    });

    it("get /users/{id} returns 404 when user not found", async () => {
        const response = await client.users[":id"].$get({
            param: {
                id: "999999999999999999999999",
            },
        });
        expect(response.status).toBe(404);
        if (response.status === 404) {
            const json = await response.json();
            expect(json.message).toBe(HttpStatusPhrases.NOT_FOUND);
        }
    });

    it("get /users/{id} gets a single user", async () => {
        const response = await client.users[":id"].$get({
            param: {
                id: newId,
            },
        });
        expect(response.status).toBe(200);
        if (response.status === 200) {
            const json = await response.json();
            expect(json.username).toBe(username);
        }
    });*/
});
