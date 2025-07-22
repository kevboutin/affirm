import { UserManager, WebStorageStateStore } from 'oidc-client-ts';

const authConfig = {
    authority: 'https://dev-cb8ia1vk3gldjhq0.us.auth0.com',
    client_id: 'hhhsi3DkucpNwa3a02XaiVvyzxyH8n8F', // Replace with your actual client ID
    redirect_uri: `${window.location.origin}/callback`,
    post_logout_redirect_uri: `${window.location.origin}`,
    response_type: 'code',
    scope: 'openid profile email',
    loadUserInfo: true,
    userStore: new WebStorageStateStore({ store: window.localStorage })
};

export const userManager = new UserManager(authConfig);

export const login = () => userManager.signinRedirect();
export const logout = () => userManager.signoutRedirect();
export const getUser = () => userManager.getUser();
export const renewToken = () => userManager.signinSilent();
