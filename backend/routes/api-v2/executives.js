const { createCrudRouter } = require("../../services/crudFactory");

module.exports = createCrudRouter("executives", {
  filterableFields: ["ward_id", "position"],
  searchableFields: ["position", "name", "phone"],
  requiredOnCreate: ["ward_id", "position"],
  writableFields: ["name", "phone", "created_by", "device_id"]
});
