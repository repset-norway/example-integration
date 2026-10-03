import * as client from "openid-client";

// OIDC client setup. This uses the 'openid-client' node library.
// Many OIDC client libraries exist for different languages
// IMPORTANT: this process must happen serverside due to the client_secret
export const authConfig = await client.discovery(
    new URL(process.env.OIDC_ISSUER_URL),
    process.env.REPSET_CLIENT_ID,
    process.env.REPSET_CLIENT_SECRET,
    undefined,
    {
        // Only allow insecure requests in development
        execute: process.env.NODE_ENV == "development" ? [client.allowInsecureRequests] : [],
    }
);
