const { createCrudRouter } = require("../../services/crudFactory");

module.exports = createCrudRouter("meeting_minutes", {
  wardScoped: false, // scoped by meeting_id, not directly by ward_id
  filterableFields: ["meeting_id"],
  searchableFields: ["content", "action_points"],
  requiredOnCreate: ["meeting_id"],
  writableFields: ["content", "action_points", "recorded_by", "recorded_at", "created_by", "device_id"]
});
