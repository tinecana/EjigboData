const { createCrudRouter } = require("../../services/crudFactory");

module.exports = createCrudRouter("streets", {
  filterableFields: ["ward_id", "name"],
  searchableFields: ["name", "leader"],
  requiredOnCreate: ["ward_id", "name"],
  writableFields: ["leader", "notes", "created_by", "device_id"]
});
