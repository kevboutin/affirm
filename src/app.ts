import configureOpenAPI from "./configureOpenApi";
import createApp from "./createApp";
import index from "./routes/index.route";
import roles from "./routes/roles/roles.index";
import users from "./routes/users/users.index";

const app = createApp();

configureOpenAPI(app);

const routes = [index, roles, users] as const;

routes.forEach((route) => {
    app.route("/", route);
});

export type AppType = (typeof routes)[number];

export default app;
