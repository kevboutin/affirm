import { afterEach, describe, expect, it, vi } from "vitest";

function urlFromFetchInput(input: RequestInfo | URL): string {
    if (typeof input === "string") {
        return input;
    }
    if (input instanceof Request) {
        return input.url;
    }
    if (input instanceof URL) {
        return input.href;
    }
    return String(input);
}

function jwtWithKid(kid: string) {
    const header = Buffer.from(JSON.stringify({ alg: "RS256", kid })).toString(
        "base64url",
    );
    const payload = Buffer.from(JSON.stringify({ sub: "t" })).toString(
        "base64url",
    );
    return `${header}.${payload}.sig`;
}

describe("createApp (dynamic import & env branches)", { sequential: true }, () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.doUnmock("./env");
        vi.resetModules();
    });

    it("throws when loading the module if TOKEN_ALGORITHM is not RS256", async () => {
        vi.resetModules();
        vi.doMock("./env", async (importOriginal) => {
            const mod = await importOriginal<typeof import("./env")>();
            return {
                default: { ...mod.default, TOKEN_ALGORITHM: "HS256" },
            };
        });
        await expect(import("./createApp")).rejects.toThrow(
            /Unsupported TOKEN_ALGORITHM/,
        );
    });

    it("getJwks fetches JWKS once and reuses the cache", async () => {
        vi.resetModules();
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(
            async (input) => {
                const url = urlFromFetchInput(input);
                if (url.includes("/.well-known/jwks.json")) {
                    return new Response(JSON.stringify({ keys: [] }), {
                        status: 200,
                        headers: { "Content-Type": "application/json" },
                    });
                }
                return new Response("not found", { status: 404 });
            },
        );

        const { default: createAppFresh } = await import("./createApp");
        const app = createAppFresh();
        app.get("/userinfo", (c) => c.json({ ok: true }));

        const token = jwtWithKid("any");
        const url = `http://localhost/userinfo`;
        const req1 = new Request(url, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const req2 = new Request(url, {
            headers: { Authorization: `Bearer ${token}` },
        });

        await app.fetch(req1);
        await app.fetch(req2);

        const jwksFetches = fetchSpy.mock.calls.filter((call) =>
            urlFromFetchInput(call[0] as RequestInfo | URL).includes(
                "/.well-known/jwks.json",
            ),
        );
        expect(jwksFetches.length).toBe(1);
    });

    it("getJwks propagates when JWKS fetch is not ok", async () => {
        vi.resetModules();
        vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
            const url = urlFromFetchInput(input);
            if (url.includes("/.well-known/jwks.json")) {
                return new Response("unavailable", { status: 503 });
            }
            return new Response("not found", { status: 404 });
        });

        const { default: createAppFresh } = await import("./createApp");
        const app = createAppFresh();
        app.get("/userinfo", (c) => c.json({ ok: true }));

        const res = await app.fetch(
            new Request("http://localhost/userinfo", {
                headers: { Authorization: `Bearer ${jwtWithKid("k")}` },
            }),
        );
        expect(res.status).toBe(500);
        const json = await res.json();
        expect(json.message).toMatch(/Failed to fetch JWKS/);
    });

    it("skips CSRF for OAuth paths when NODE_ENV is not test", async () => {
        vi.resetModules();
        vi.doMock("./env", async (importOriginal) => {
            const mod = await importOriginal<typeof import("./env")>();
            return {
                default: { ...mod.default, NODE_ENV: "development" },
            };
        });
        vi.spyOn(globalThis, "fetch").mockResolvedValue(
            new Response(JSON.stringify({ keys: [] }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }),
        );

        const { default: createAppFresh } = await import("./createApp");
        const app = createAppFresh();
        app.post("/token", (c) => c.json({ path: "token" }));

        const res = await app.request("http://localhost/token", {
            method: "POST",
            headers: {
                "content-type": "application/x-www-form-urlencoded",
            },
            body: "grant_type=client_credentials",
        });

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ path: "token" });
    });

    it("applies CSRF to unsafe form posts when NODE_ENV is not test", async () => {
        vi.resetModules();
        vi.doMock("./env", async (importOriginal) => {
            const mod = await importOriginal<typeof import("./env")>();
            return {
                default: { ...mod.default, NODE_ENV: "development" },
            };
        });
        vi.spyOn(globalThis, "fetch").mockResolvedValue(
            new Response(JSON.stringify({ keys: [] }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }),
        );

        const { default: createAppFresh } = await import("./createApp");
        const app = createAppFresh();
        app.post("/mutate", (c) => c.json({ ok: true }));

        const res = await app.request("http://localhost/mutate", {
            method: "POST",
            headers: {
                "content-type": "application/x-www-form-urlencoded",
            },
            body: "a=1",
        });

        expect(res.status).toBe(403);
    });
});
