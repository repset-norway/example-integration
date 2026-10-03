import express from "express";
import db from "./db.js";
import crypto from "node:crypto";

const router = express.Router();

const createHash = (password) => crypto.createHash("sha256").update(password).digest("hex");

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

/**
 * Log into example application
 * Create user if it doesn't exist for simplicity
 */
router.post("/login", express.json(), (req, res) => {
    // Simplified login system since this is a demo application.
    // A real production app should have a lot more security features.

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Missing username or password" });
    }

    const passwordHash = createHash(password);

    let user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);

    // Create user if it doesn't exist
    if (!user) {
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

    if (user.passwordHash !== passwordHash) {
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
