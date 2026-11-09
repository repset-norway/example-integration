import express from "express";
import db from "./db.js";
import argon2 from "argon2"
import { rateLimit } from "express-rate-limit";


const router = express.Router();

/**
 * Info about authorized user
 */
router.get("/me", (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: "Not logged in" });
    }

    const user = db.prepare(`SELECT id, username, repsetUserId, repsetSelectedCompanyId FROM users WHERE id = ?`).get(req.session.userId);

    if (!user) {
        req.session.destroy(() => {});
        return res.sendStatus(401);
    }

    return res.json(user);
});

const regenerateSession = (req) =>
    new Promise((resolve, reject) => req.session.regenerate((err) => (err ? reject(err) : resolve())));

const loginLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    ipv6Subnet: 52,
    message: { error: "Too many login attempts, try again in a minute" },
    skipSuccessfulRequests: true,
});

/**
 * Log into example application
 * Create user if it doesn't exist for simplicity
 */
router.post("/login", loginLimiter, express.json(), async (req, res) => {
    // Simplified login system since this is a demo application.
    // A real production app should have a lot more security features.

    await regenerateSession(req);

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Missing username or password" });
    }

    if (typeof username !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: "username and password must be strings" });
    }

    let user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);

    // Create user if it doesn't exist
    if (!user) {
        const passwordHash = await argon2.hash(password);
        const result = db.prepare("INSERT INTO users (username, passwordHash) VALUES (?, ?)").run(username, passwordHash);

        const userId = result.lastInsertRowid;
        req.session.userId = userId;

        return res.json({
            id: userId,
            username: username,
            repsetUserId: null,
            repsetSelectedCompanyId: null,
        });
    }

    const isValidLogin = await argon2.verify(user.passwordHash, password);
    if (!isValidLogin) {
        return res.sendStatus(401);
    }

    // Create cookie with user session
    req.session.userId = user.id;

    return res.json({
        id: user.id,
        username: username,
        repsetUserId: user.repsetUserId,
        repsetSelectedCompanyId: user.repsetSelectedCompanyId,
    });
});

/**
 * Log user out of this example application
 */
router.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ error: "Failed to log out" });

        res.clearCookie("connect.sid");
        res.sendStatus(204);
    });
});

export default router;
