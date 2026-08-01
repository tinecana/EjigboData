/**
 * PWMS ENTERPRISE REFACTOR — SPRINT 2: API ROUTER INDEX
 * =====================================================================
 * This file is the single integration point for Sprint 2. It does NOT
 * start its own server or listen on any port — it exports a mountable
 * Express router so it can be wired into your existing backend
 * (the one at BACKEND_URL in index.html) without me needing to modify
 * a server codebase I don't have access to.
 *
 * Integration (in your existing Express app):
 *
 *     const enterpriseApi = require("./backend/index.js");
 *     app.use("/api/v2", enterpriseApi);
 *
 * Every route below already existed conceptually in Sprint 1's schema;
 * this file just wires each table to its CRUD router. Mounted under
 * /api/v2 specifically so it cannot collide with the existing
 * /api/supabase or /api/sms routes — nothing already deployed changes.
 */

const express = require("express");

const router = express.Router();
router.use(express.json());

router.use("/wards", require("./wards"));
router.use("/polling-units", require("./pollingUnits"));
router.use("/streets", require("./streets"));
router.use("/executives", require("./executives"));
router.use("/members", require("./members"));
router.use("/attendance-sessions", require("./attendanceSessions"));
router.use("/attendance-records", require("./attendanceRecords"));
router.use("/meetings", require("./meetings"));
router.use("/meeting-minutes", require("./meetingMinutes"));
router.use("/campaigns", require("./campaigns"));
router.use("/campaigns/:campaignId/members", require("./campaignMembers"));
router.use("/notifications", require("./notifications"));
router.use("/audit-logs", require("./auditLogs"));

// Must be mounted after all routes above so every error — including
// ones the individual routers didn't anticipate — still comes back in
// the standardized envelope.
const { standardErrorMiddleware } = require("../../utils/response");
router.use(standardErrorMiddleware);

module.exports = router;
