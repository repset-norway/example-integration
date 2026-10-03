import express from "express";
import db from "./db.js";
import { RepsetApiClient } from "./repset-api-client.js";

const router = express.Router();

router.use((req, res, next) => {
    if (!req.session?.userId) {
        return res.sendStatus(401);
    }

    next();
});

/**
 * List patients on user
 * Includes Repset workout programs
 */
router.get("/", async (req, res) => {
    const allPatients = db.prepare("SELECT * FROM patients WHERE userId = ?").all(req.session.userId);

    let patients = [];
    for (const patient of allPatients) {
        // This is just an example. Avoid n+1 fetching in a real world scenario
        const programs = await getPatientPrograms(req.session.userId, patient);
        patients.push(toPatientResponse(patient, programs));
    }

    res.json(patients);
});

/**
 * Get patient by ID
 * Includes Repset workout programs
 */
router.get("/:id", async (req, res) => {
    const patient = getPatientForUser(req.params.id, req.session.userId);
    if (!patient) return res.sendStatus(404);

    const programs = await getPatientPrograms(req.session.userId, patient);
    res.json(toPatientResponse(patient, programs));
});

/**
 * Create patient
 * Also creates customer in Repset
 */
router.post("/", async (req, res) => {
    const { name, email } = req.body;

    // Create Repset Customer if user has connected their Repset account
    const repsetUser = getRepsetUser(req.session.userId);
    let repsetCustomerId = null;

    if (repsetUser) {
        const body = JSON.stringify({ name, email: email ? email : null });
        const res = await RepsetApiClient.fetch(`/api/v1/companies/${repsetUser.companyId}/users/${repsetUser.id}/customers`, "post", body);

        if (res.ok) {
            const resobj = await res.json();
            repsetCustomerId = resobj.id;
        }
    }

    const sql = `
        INSERT INTO patients (userId, name, email, repsetCustomerId)
        VALUES (?, ?, ?, ?)
    `;

    const result = db.prepare(sql).run(req.session.userId, name ?? null, email ?? null, repsetCustomerId);

    const patient = getPatientForUser(result.lastInsertRowid, req.session.userId);

    res.status(201).json(toPatientResponse(patient, []));
});

/**
 * Create program on patient
 * using the Repset Program Editor
 */
router.post("/:id/program", async (req, res) => {
    const patient = getPatientForUser(req.params.id, req.session.userId);
    if (!patient) return res.sendStatus(404);

    const repsetUser = getRepsetUser(req.session.userId);
    if (!repsetUser) return res.sendStatus(403);

    // Create Repset customer if not exist
    let repsetCustomerId = patient.repsetCustomerId;
    if (!repsetCustomerId) {
        const body = JSON.stringify({ name: patient.name, email: patient.email ?? null });
        const createCustomerRes = await RepsetApiClient.fetch(
            `/api/v1/companies/${repsetUser.companyId}/users/${repsetUser.id}/customers`,
            "post",
            body
        );
        if (!createCustomerRes.ok) throw new Error("Failed to create repset customer");

        const customerData = await createCustomerRes.json();
        repsetCustomerId = customerData.id;
    }

    // Create a Repset web-app redirect
    const body = JSON.stringify({ target: "program.new", params: { customerId: repsetCustomerId }, appearance: { theme: "light" } });
    const createRedirectRes = await RepsetApiClient.fetch(
        `/api/v1/companies/${repsetUser.companyId}/users/${repsetUser.id}/redirects/web-app`,
        "post",
        body
    );
    if (!createRedirectRes.ok) throw new Error("redirect request failed");

    const redirectData = await createRedirectRes.json();
    return res.json(redirectData);
});

/**
 * Edits program on patient
 * using the Repset Program Editor
 */
router.put("/:id/program/:programId", async (req, res) => {
    const patient = getPatientForUser(req.params.id, req.session.userId);
    if (!patient) return res.sendStatus(404);

    const repsetUser = getRepsetUser(req.session.userId);
    if (!repsetUser) return res.sendStatus(403);

    // create a Repset web-app redirect
    const body = JSON.stringify({ target: "program.edit", params: { programId: req.params.programId }, appearance: { theme: "light" } });
    const repsetRes = await RepsetApiClient.fetch(
        `/api/v1/companies/${repsetUser.companyId}/users/${repsetUser.id}/redirects/web-app`,
        "post",
        body
    );

    if (!repsetRes.ok) throw new Error("redirect request failed");

    const redirectData = await repsetRes.json();
    return res.json(redirectData);
});

/**
 * Sends program by email
 * using Repset email service
 */
router.post("/:id/program/:programId/email", async (req, res) => {
    const patient = getPatientForUser(req.params.id, req.session.userId);
    if (!patient) res.sendStatus(404);

    const repsetUser = getRepsetUser(req.session.userId);
    if (!repsetUser) return res.sendStatus(403);

    const body = JSON.stringify({
        recipientName: patient.name,
        recipientEmailAddress: req.body.recipientEmailAddress,
    });

    const repsetReq = await RepsetApiClient.fetch(
        `/api/v1/companies/${repsetUser.companyId}/users/${repsetUser.id}/programs/${req.params.programId}/email`,
        "post",
        body
    );

    if (!repsetReq.ok) return res.sendStatus(500);

    res.sendStatus(204);
});

/**
 * Create link to a program PDF
 *
 * using the Repset PDF service
 * Can take a few seconds since the PDF is generated server-side
 */
router.post("/:id/program/:programId/print", async (req, res) => {
    const userId = req.session.userId;
    const patient = getPatientForUser(req.params.id, userId);
    if (!patient) res.sendStatus(404);

    const repsetUser = getRepsetUser(userId);
    if (!repsetUser) return res.sendStatus(403);

    const repsetReq = await RepsetApiClient.fetch(
        `/api/v1/companies/${repsetUser.companyId}/users/${repsetUser.id}/programs/${req.params.programId}/print`,
        "post",
        JSON.stringify({ exerciseSize: "medium" })
    );

    if (!repsetReq.ok) return res.sendStatus(500);

    const redirect = await repsetReq.json();
    res.json({
        redirectUrl: redirect.redirectUrl,
    });
});

/**
 * Delete program on patient
 */
router.delete("/:id/program/:programId", async (req, res) => {
    const userId = req.session.userId;

    const patient = getPatientForUser(req.params.id, userId);
    if (!patient) res.sendStatus(404);

    const repsetUser = getRepsetUser(userId);
    if (!repsetUser) return res.sendStatus(403);

    const repsetReq = await RepsetApiClient.fetch(
        `/api/v1/companies/${repsetUser.companyId}/users/${repsetUser.id}/programs/${req.params.programId}`,
        "delete"
    );

    if (!repsetReq.ok) return res.sendStatus(500);

    res.sendStatus(204);
});

/**
 * Updates patient name/email
 * Updates customer in Repset if connected to patient
 */
router.put("/:id", async (req, res) => {
    const userId = req.session.userId;
    const existing = getPatientForUser(req.params.id, userId);
    if (!existing) res.sendStatus(404);

    const { name, email } = req.body;

    const sql = `
        UPDATE patients
        SET name = ?, email = ?
        WHERE id = ?
    `;

    db.prepare(sql).run(name ?? null, email ?? null, req.params.id);

    const patient = getPatientForUser(req.params.id, userId);

    // Update Repset customer if patient is linked
    const repsetUser = getRepsetUser(req.session.userId);
    if (repsetUser && patient.repsetCustomerId) {
        const body = JSON.stringify({ name, email: email ?? null });
        const res = await RepsetApiClient.fetch(
            `/api/v1/companies/${repsetUser.companyId}/users/${repsetUser.id}/customers/${patient.repsetCustomerId}`,
            "put",
            body
        );
    }

    const programs = await getPatientPrograms(userId, patient);
    res.json(toPatientResponse(patient, programs));
});

/**
 * Deletes patient
 * Deletes customer in Repset if connected to patient
 */
router.delete("/:id", async (req, res) => {
    const userId = req.session.userId;
    const patient = getPatientForUser(req.params.id, userId);

    const sql = `
        DELETE FROM patients
        WHERE id = ? AND userId = ?
    `;

    const result = db.prepare(sql).run(req.params.id, userId);

    const repsetUser = getRepsetUser(userId);
    if (repsetUser && patient.repsetCustomerId) {
        await RepsetApiClient.fetch(
            `/api/v1/companies/${repsetUser.companyId}/users/${repsetUser.id}/customers/${patient.repsetCustomerId}`,
            "delete"
        );
    }

    res.sendStatus(204);
});

/**
 * Lists Repset programs on patient
 */
async function getPatientPrograms(userId, patient) {
    const repsetUser = getRepsetUser(userId);
    if (!repsetUser || !patient.repsetCustomerId) return [];

    const res = await RepsetApiClient.fetch(
        `/api/v1/companies/${repsetUser.companyId}/users/${repsetUser.id}/customers/${patient.repsetCustomerId}`,
        "get"
    );
    if (!res.ok) throw new Error("Fetching programs from Repset failed on patient");

    const customer = await res.json();
    return customer.programs.map((p) => ({
        id: p.id,
        name: p.name,
        exerciseCount: p.exerciseCount,
        createdAt: p.createdAt,
        modifiedAt: p.modifiedAt,
    }));
}

/**
 * Gets a patient a user has access to
 */
function getPatientForUser(id, userId) {
    const sql = `
      SELECT * FROM patients
      WHERE id = ? AND userId = ?
    `;

    return db.prepare(sql).get(id, userId);
}

function toPatientResponse(patient, programs) {
    return {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        repsetCustomerId: patient.repsetCustomerId,
        programs: programs,
    };
}

/**
 * Gets Repset user details
 *
 * Users in this application can have their Repset account connected
 * by storing the userId and companyId from Repset on the user record
 */
function getRepsetUser(userId) {
    const sql = `
        SELECT id, repsetUserId, repsetSelectedCompanyId FROM users
        WHERE id = ?
    `;

    const user = db.prepare(sql).get(userId);
    if (!user.repsetSelectedCompanyId || !user.repsetUserId) return null;

    return {
        id: user.repsetUserId,
        companyId: user.repsetSelectedCompanyId,
    };
}

export default router;
