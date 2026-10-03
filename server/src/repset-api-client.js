import { authConfig } from "./oidc-client-config.js";
import * as client from "openid-client";

/**
 * wrapper around fetch that adds auth etc, for the Repset Integration Api
 */
export class RepsetApiClient {
    static baseUrl = process.env.INTEGRATION_API_URL;

    static async fetch(url, method, body) {
        const tokens = await client.clientCredentialsGrant(authConfig)

        const headers = {
            "Authorization": `Bearer ${tokens.access_token}`,
        };

        if (body) {
            headers["Accept"] = "application/json";
            headers["Content-Type"] = "application/json";
        }

        const options = {
            headers,
            method: method,
        };

        if (body) {
            options["body"] = body;
        }

        const response = await fetch(this.baseUrl + url, options);
        return response;
    }
}
