import { createRouter } from "../../createApp";

// Assuming the correct path for handlers and routes is different
import * as handlers from "./auth.handlers";
import * as routes from "./auth.routes";

const router = createRouter()
    .openapi(routes.authenticate, handlers.authenticate)
    .openapi(routes.authorize, handlers.authorize)
    .openapi(routes.jwks, handlers.jwks)
    .openapi(routes.metadata, handlers.metadata)
    .openapi(routes.ssoauthorize, handlers.ssoauthorize)
    .openapi(routes.userinfo, handlers.userinfo);

export default router;
