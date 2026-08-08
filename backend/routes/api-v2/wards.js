const { createCrudRouter } = require("../../services/crudFactory");

module.exports = createCrudRouter("wards", {
  wardScoped: false,
  filterableFields: ["name"],
  searchableFields: ["name"],
  requiredOnCreate: ["name"],
  writableFields: ["settings", "updated_by", "created_by", "device_id"]
});
