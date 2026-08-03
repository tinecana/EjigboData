const { createCrudRouter } = require("../../services/crudFactory");

module.exports = createCrudRouter("campaigns", {
  filterableFields: ["ward_id", "status"],
  searchableFields: ["name", "coordinator"],
  requiredOnCreate: ["ward_id", "name"],
  writableFields: ["coordinator", "start_date", "end_date", "notes", "performance", "status", "created_by", "device_id"]
});
