import { serve } from "@hono/node-server";
import env from "./env";
import app from "./app";

const port = env!.PORT;

app.get("/", (c) => {
    return c.text("Hello Hono!");
});

serve(
    {
        fetch: app.fetch,
        port,
    },
    (info) => {
        console.log(`Server is running on http://localhost:${info.port}`);
    },
);
