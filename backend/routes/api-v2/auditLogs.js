const { createCrudRouter } = require("../../services/crudFactory");

// Audit logs are append-only by application convention (see index.html's
// audit() function). PUT/DELETE exist here because the Master Prompt
// requires every endpoint to support all four verbs, but wiring an
// authorization layer that actually restricts them to administrators is
// a Sprint 2 gap — there is no server-side auth/session system in the
// code I have visibility into (the frontend's PBKDF2 login is local-only).
// Flagged again in the Risks section of this sprint's report.
module.exports = createCrudRouter("audit_logs", {
  filterableFields: ["ward_id", "action", "role", "actor_user"],
  searchableFields: ["action", "actor_user"],
  requiredOnCreate: ["action"],
  writableFields: ["ward_id", "role", "actor_user", "meta", "occurred_at", "created_by", "device_id"]
});
