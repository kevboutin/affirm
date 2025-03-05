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
import router from "./roles.index";

if (env!.NODE_ENV !== "test") {
    throw new Error("NODE_ENV must be 'test'");
}

const client = testClient(createApp().route("/", router));

describe("roles routes", () => {
    beforeAll(async () => {});

    afterAll(async () => {});

    it("post /roles validates the body when creating", async () => {
        const response = await client.roles.$post({
            json: {
                description: "some description",
            } as any,
        });
        expect(response.status).toBe(422);
        if (response.status === 422) {
            const json = await response.json();
            expect(json?.error?.issues[0]?.path[0]).toBe("name");
            expect(json?.error?.issues[0]?.message).toBe(
                ZOD_ERROR_MESSAGES.REQUIRED,
            );
        }
    });

    const name = "administrator";
    let newId = "";

    it("post /roles creates a role", async () => {
        const response = await client.roles.$post({
            json: {
                name,
                description: "some description",
            },
        });
        expect(response.status).toBe(201);
        if (response.status === 201) {
            const json = await response.json();
            expect(json?.name).toBe(name);
            newId = json?._id;
        }
    });

    it("get /roles lists all roles", async () => {
        const response = await client.roles.$get();
        expect(response.status).toBe(200);
        if (response.status === 200) {
            const json = await response.json();
            expectTypeOf(json).toBeObject();
            expect(Array.isArray(json?.rows)).toBe(true);
            expect(json?.rows?.length).toBe(1);
        }
    });

    it("get /roles/{id} validates the id param", async () => {
        const response = await client.roles[":id"].$get({
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

    it("get /roles/{id} returns 404 when role not found", async () => {
        const response = await client.roles[":id"].$get({
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

    it("get /roles/{id} gets a single role", async () => {
        const response = await client.roles[":id"].$get({
            param: {
                id: newId,
            },
        });
        expect(response.status).toBe(200);
        if (response.status === 200) {
            const json = await response.json();
            expect(json.name).toBe(name);
        }
    });

    it("patch /roles/{id} validates the body when updating", async () => {
        const response = await client.roles[":id"].$patch({
            param: {
                id: newId,
            },
            json: {
                name: "",
            },
        });
        expect(response.status).toBe(422);
        if (response.status === 422) {
            const json = await response.json();
            expect(json.error.issues[0].path[0]).toBe("name");
            expect(json.error.issues[0].code).toBe(ZodIssueCode.too_small);
        }
    });

    it("patch /roles/{id} validates the id param", async () => {
        const response = await client.roles[":id"].$patch({
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

    it("patch /roles/{id} validates empty body", async () => {
        const response = await client.roles[":id"].$patch({
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

    it("patch /roles/{id} updates a single property of a role", async () => {
        const response = await client.roles[":id"].$patch({
            param: {
                id: newId,
            },
            json: {
                description: "updated description",
            },
        });
        expect(response.status).toBe(200);
        if (response.status === 200) {
            const json = await response.json();
            expect(json.description).toBe("updated description");
        }
    });

    it("delete /roles/{id} validates the id when deleting", async () => {
        const response = await client.roles[":id"].$delete({
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

    it("delete /roles/{id} removes a role", async () => {
        const response = await client.roles[":id"].$delete({
            param: {
                id: newId,
            },
        });
        expect(response.status).toBe(204);
    });
});
