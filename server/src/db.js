import { DatabaseSync } from "node:sqlite";
import session from "express-session";
import { mkdirSync } from "node:fs";
import path from "node:path";


const dbPath = process.env.DB_PATH ?? path.join(import.meta.dirname, "..", "data", "database.db");
mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);

// keep db tables in order of least -> most relationships to make sure deletion works
export const dbTables = ["sessions", "patients", "users"];

export const deleteAllDatabaseData = () => {
    const delSql = dbTables.map((tableName) => `DELETE FROM ${tableName}`).join("; ");
    db.exec(delSql);
};

// Create tables if they don't exist so this can be spun up anytime, anywhere
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT,
        passwordHash TEXT,

        repsetUserId TEXT,
        repsetSelectedCompanyId TEXT
    );
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        name TEXT,
        email TEXT,
        repsetCustomerId TEXT
    );
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
        sid TEXT PRIMARY KEY,
        sess TEXT NOT NULL,
        expires INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_expires
      ON sessions(expires);
`);

export default db;

/**
 * Persistence for express-session (cookie sessions)
 */
export class SessionStore extends session.Store {
    constructor() {
        super();

        this.db = db;

        this.getStmt = this.db.prepare(`
          SELECT sess, expires
          FROM sessions
          WHERE sid = ?
        `);

        this.setStmt = this.db.prepare(`
          INSERT INTO sessions (sid, sess, expires)
          VALUES (?, ?, ?)
          ON CONFLICT(sid) DO UPDATE SET
            sess = excluded.sess,
            expires = excluded.expires
        `);

        this.destroyStmt = this.db.prepare(`
          DELETE FROM sessions
          WHERE sid = ?
        `);

        this.touchStmt = this.db.prepare(`
          UPDATE sessions
          SET expires = ?
          WHERE sid = ?
        `);

        this.clearStmt = this.db.prepare(`
          DELETE FROM sessions
        `);

        this.lengthStmt = this.db.prepare(`
          SELECT COUNT(*) AS count
          FROM sessions
          WHERE expires > ?
        `);

        this.cleanupStmt = this.db.prepare(`
          DELETE FROM sessions
          WHERE expires <= ?
        `);
    }

    cleanup() {
        this.cleanupStmt.run(Date.now());
    }

    get(sid, callback) {
        try {
            this.cleanup();

            const row = this.getStmt.get(sid);

            if (!row) {
                return callback(null, null);
            }

            if (row.expires <= Date.now()) {
                this.destroyStmt.run(sid);
                return callback(null, null);
            }

            callback(null, JSON.parse(row.sess));
        } catch (err) {
            callback(err);
        }
    }

    set(sid, sess, callback = () => {}) {
        try {
            const expires = sess.cookie?.expires ? new Date(sess.cookie.expires).getTime() : Date.now() + 86400000; // 1 day default

            this.setStmt.run(sid, JSON.stringify(sess), expires);

            callback(null);
        } catch (err) {
            callback(err);
        }
    }

    destroy(sid, callback = () => {}) {
        try {
            this.destroyStmt.run(sid);
            callback(null);
        } catch (err) {
            callback(err);
        }
    }

    touch(sid, sess, callback = () => {}) {
        try {
            const expires = sess.cookie?.expires ? new Date(sess.cookie.expires).getTime() : Date.now() + 86400000;

            this.touchStmt.run(expires, sid);
            callback(null);
        } catch (err) {
            callback(err);
        }
    }

    clear(callback = () => {}) {
        try {
            this.clearStmt.run();
            callback(null);
        } catch (err) {
            callback(err);
        }
    }

    length(callback) {
        try {
            const { count } = this.lengthStmt.get(Date.now());
            callback(null, count);
        } catch (err) {
            callback(err);
        }
    }
}
