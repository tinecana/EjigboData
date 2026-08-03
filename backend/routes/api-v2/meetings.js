const { createCrudRouter } = require("../../services/crudFactory");

module.exports = createCrudRouter("meetings", {
  filterableFields: ["ward_id", "status"],
  searchableFields: ["title", "venue", "agenda"],
  requiredOnCreate: ["ward_id", "title"],
  writableFields: ["meeting_date", "venue", "agenda", "status", "created_by", "device_id"]
});
