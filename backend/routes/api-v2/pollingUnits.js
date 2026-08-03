const { createCrudRouter } = require("../../services/crudFactory");

module.exports = createCrudRouter("polling_units", {
  filterableFields: ["ward_id", "unit_num"],
  searchableFields: ["unit_num", "name"],
  requiredOnCreate: ["ward_id", "unit_num"],
  writableFields: ["name", "created_by", "device_id"]
});
