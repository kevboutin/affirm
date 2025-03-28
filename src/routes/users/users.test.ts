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
import router from "./users.index";

if (env!.NODE_ENV !== "test") {
    throw new Error("NODE_ENV must be 'test'");
}

const client = testClient(createApp().route("/", router));

describe("users routes", () => {
    beforeAll(async () => {});

    afterAll(async () => {});

    it("post /users validates the body when creating", async () => {
        const response = await client.users.$post({
            json: {
                email: "someuser@github.com",
            } as any,
        });
        expect(response.status).toBe(422);
        if (response.status === 422) {
            const json = await response.json();
            expect(json?.error.issues[0].path[0]).toBe("username");
            expect(json?.error.issues[0].message).toBe(
                ZOD_ERROR_MESSAGES.REQUIRED,
            );
        }
    });

    const username = "someuser";
    let newId = "";

    it("post /users creates a user", async () => {
        const response = await client.users.$post({
            json: {
                username,
                password: "someTestPassword!",
                email: "someuser@github.com",
                locale: "en_us",
                timezone: "America/New_York",
                roles: [],
            },
        });
        expect(response.status).toBe(201);
        if (response.status === 201) {
            const json = await response.json();
            expect(json?.username).toBe(username);
            newId = json?._id;
        }
    });

    it("get /users lists all users", async () => {
        const response = await client.users.$get();
        expect(response.status).toBe(200);
        if (response.status === 200) {
            const json = await response.json();
            expectTypeOf(json).toBeObject();
            expect(Array.isArray(json?.rows)).toBe(true);
            expect(json?.rows?.length).toBe(1);
        }
    });

    it("get /users/{id} validates the id param", async () => {
        const response = await client.users[":id"].$get({
            param: {
                id: "wat",
            },
        });
        expect(response.status).toBe(400);
        if (response.status === 400) {
            const json = await response.json();
            expect(json.message).toBe(HttpStatusPhrases.BAD_REQUEST);
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
            expect(json?._id).toBe(newId);
        }
    });

    it("patch /users/{id} validates the body when updating", async () => {
        const response = await client.users[":id"].$patch({
            param: {
                id: newId,
            },
            json: {
                email: "intentional",
            },
        });
        expect(response.status).toBe(422);
        if (response.status === 422) {
            const json = await response.json();
            expect(json.error.issues[0].path[0]).toBe("email");
            expect(json.error.issues[0].code).toBe(ZodIssueCode.invalid_string);
        }
    });

    it("patch /users/{id} validates the id param", async () => {
        const response = await client.users[":id"].$patch({
            param: {
                id: "wat",
            },
            json: {},
        });
        expect(response.status).toBe(400);
        if (response.status === 400) {
            const json = await response.json();
            expect(json.message).toBe(HttpStatusPhrases.BAD_REQUEST);
        }
    });

    it("patch /users/{id} validates empty body", async () => {
        const response = await client.users[":id"].$patch({
            param: {
                id: newId,
            },
            json: {},
        });
        expect(response.status).toBe(422);
        if (response.status === 422) {
            const json = await response.json();
            expect(json.error.issues[0].code).toBe(
                ZOD_ERROR_CODES.INVALID_UPDATES,
            );
            expect(json.error.issues[0].message).toBe(
                ZOD_ERROR_MESSAGES.NO_UPDATES,
            );
        }
    });

    it("patch /users/{id} updates a single property of a user", async () => {
        const response = await client.users[":id"].$patch({
            param: {
                id: newId,
            },
            json: {
                locale: "en_us",
            },
        });
        expect(response.status).toBe(200);
        if (response.status === 200) {
            const json = await response.json();
            expect(json.locale).toBe("en_us");
        }
    });

    it("delete /users/{id} validates the id when deleting", async () => {
        const response = await client.users[":id"].$delete({
            param: {
                id: "wat",
            },
        });
        expect(response.status).toBe(400);
        if (response.status === 400) {
            const json = await response.json();
            expect(json.message).toBe(HttpStatusPhrases.BAD_REQUEST);
        }
    });

    it("delete /users/{id} removes a user", async () => {
        const response = await client.users[":id"].$delete({
            param: {
                id: newId,
            },
        });
        expect(response.status).toBe(204);
    });
});
