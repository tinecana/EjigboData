const { createCrudRouter } = require("../../services/crudFactory");

module.exports = createCrudRouter("attendance_records", {
  wardScoped: false, // scoped by session_id, not directly by ward_id
  filterableFields: ["session_id", "member_id", "attendee_type", "approved"],
  searchableFields: ["name", "phone"],
  requiredOnCreate: ["session_id"],
  writableFields: ["member_id", "attendee_type", "name", "phone", "approved", "correction_notes", "marked_at", "created_by", "device_id"]
});
