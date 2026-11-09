import express from "express";
import db from "./db.js";
import * as client from "openid-client";
import { RepsetApiClient } from "./repset-api-client.js";
import { authConfig } from "./oidc-client-config.js";

const router = express.Router();

router.use((req, res, next) => {
    if (!req.session?.userId) {
        return res.sendStatus(401);
    }

    next();
});

/**
 * Generates Authorization Code URL to link an example app user and a Repset User.
 * This is example code, adapt to your application.
 */
router.post("/init-link", async (req, res) => {
    // Generate code verifier, challange and state
    const code_verifier = client.randomPKCECodeVerifier();
    const code_challenge = await client.calculatePKCECodeChallenge(code_verifier);
    const state = client.randomState();

    // store verifier and state on user session
    req.session.oidcPkceCodeVerifier = code_verifier;
    req.session.oidcState = state;

    const parameters = {
        // Callback url to handle login
        redirect_uri: `${process.env.BACKEND_URL}/api/repset/accept-link`,

        // This is the only scope you need to ask for. The auth server applies the rest for you
        scope: "openid",

        code_challenge,
        code_challenge_method: "S256",
        state,
    };

    // Build the redirectUrl to auth the user and send it to the client
    const redirectUrl = client.buildAuthorizationUrl(authConfig, parameters);
    res.json({ redirectUrl });
});

/**
 * Accepts linking of user accounts with Repset
 * This is the callback for the Authorization Code Flow
 * This is example code, adapt to your application.
 */
router.get("/accept-link", async (req, res) => {
    const codeVerifier = req.session.oidcPkceCodeVerifier;
    if (!codeVerifier) return res.status(400).send("Missing PKCE verifier");

    const state = req.session.oidcState;
    if (!state) return res.status(400).send("Missing State");

    const currentUrl = new URL(`${req.protocol}://${req.get("host")}${req.originalUrl}`);

    const tokens = await client.authorizationCodeGrant(authConfig, currentUrl, {
        pkceCodeVerifier: codeVerifier,
        expectedState: state,
    });

    // Remove user metadata after use
    delete req.session.oidcPkceCodeVerifier;
    delete req.session.oidcState;

    const claims = tokens.claims();
    const repsetUserId = claims.sub;

    const userId = req.session.userId;

    const apires = await RepsetApiClient.fetch(`/api/v1/users/${repsetUserId}`);
    const repsetUserData = await apires.json();

    // Most users are connected to a single Repset company.
    // If a user has access to multiple companies, they must be able to choose which one to link.
    const repsetCompanyId = repsetUserData["companies"][0]["id"];

    // Link your user to the repset user
    db.prepare(`UPDATE users SET repsetUserId = ?, repsetSelectedCompanyId = ? WHERE id = ?`)
        .run(repsetUserId, repsetCompanyId, userId);

    res.redirect(process.env.FRONTEND_URL);
});

router.delete("/delete-link", async (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.sendStatus(401);

    db.prepare(`UPDATE users SET repsetUserId = ?, repsetSelectedCompanyId = ? WHERE id = ?`).run(null, null, userId);
    db.prepare(`UPDATE patients SET repsetCustomerId = NULL WHERE userId = ?`).run(userId);
    res.sendStatus(204);
});

router.post("/open", async (req, res) => {
    const repsetUser = getRepsetUser(req.session.userId);
    if (!repsetUser) return res.sendStatus(403);

    // Create a Repset web-app redirect
    const createRedirectRes = await RepsetApiClient.fetch(
        `/api/v1/companies/${repsetUser.companyId}/users/${repsetUser.id}/redirects/home`,
        "post"
    );

    if (!createRedirectRes.ok) throw new Error("redirect request failed");

    const redirectData = await createRedirectRes.json();
    return res.json(redirectData);
});


/**
 * Gets Repset user details
 *
 * Users in this application can have their Repset account connected
 * by storing the userId and companyId from Repset on the user record
 */
export function getRepsetUser(userId) {
    const sql = `
        SELECT id, repsetUserId, repsetSelectedCompanyId FROM users
        WHERE id = ?
    `;

    const user = db.prepare(sql).get(userId);
    if (!user.repsetSelectedCompanyId || !user.repsetUserId) return null;

    // In a real app you would want to check that the Repset user also exist in Repset and have access to that company (might have been deleted / moved)

    return {
        id: user.repsetUserId,
        companyId: user.repsetSelectedCompanyId,
    };
}

export default router;
