import "dotenv/config";

import express from "express";
import session from "express-session";
import userAuthRouter from "./auth-user.js";
import repsetAuthRouter from "./auth-repset.js";
import patientRouter from "./patients.js";
import { SessionStore, deleteAllDatabaseData } from "./db.js";
import cron from 'node-cron';

const app = express();
const port = 3000;

app.use(express.json());

// Cookie session store used for auth
app.use(
    session({
        store: new SessionStore(),
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
    })
);

// Serving frontend app. Used in production.
const publicDir = path.resolve('public');
app.use(express.static(publicDir));
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.get("/api", (req, res) => {
    res.send("api server running");
});

app.use("/api/users", userAuthRouter);
app.use("/api/repset", repsetAuthRouter);
app.use("/api/patients", patientRouter);

// Delete database every sunday at 23:30
cron.schedule('30 23 * * 0', () => {
    deleteAllDatabaseData();
    res.sendStatus(200);
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
