const { createCrudRouter } = require("../../services/crudFactory");

module.exports = createCrudRouter("attendance_sessions", {
  filterableFields: ["ward_id", "status"],
  searchableFields: ["title", "venue"],
  requiredOnCreate: ["ward_id", "title"],
  writableFields: ["venue", "session_date", "status", "closed_at", "created_by", "device_id"]
});
