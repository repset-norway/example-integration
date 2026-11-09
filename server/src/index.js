import "dotenv/config";

import express from "express";
import session from "express-session";
import userAuthRouter from "./auth-user.js";
import repsetAuthRouter from "./auth-repset.js";
import patientRouter from "./patients.js";
import { SessionStore, deleteAllDatabaseData } from "./db.js";
import cron from "node-cron";
import path from "node:path";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";

// app is made with express 5.x
const app = express();
const port = 3000;

app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                frameSrc: ["'self'", process.env.NODE_ENV === "production" ? "https://*.repset.io" : "http://localhost:*"],
            },
        },
    })
);

const limiter = rateLimit({
    windowMs: 2 * 60 * 1000, // 1 minutes window
    limit: 70, // Limit each IP to x requests per `window`
    standardHeaders: "draft-8", // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    ipv6Subnet: 52, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
});

app.use(limiter);

app.use(express.json());

// Cookie session store used for auth
app.use(
    session({
        store: new SessionStore(),
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        },
    })
);

// trusting caddy proxy in production
if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

// Serving frontend app. Used in production.
const publicDir = path.resolve("public");
app.use(express.static(publicDir));
app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) return next();
    res.sendFile(path.join(publicDir, "index.html"));
});

app.get("/api", (req, res) => {
    res.send("api server running");
});

app.use("/api/users", userAuthRouter);
app.use("/api/repset", repsetAuthRouter);
app.use("/api/patients", patientRouter);

// Delete database every sunday at 23:30
cron.schedule("30 23 * * 0", () => {
    deleteAllDatabaseData();
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
