const { createCrudRouter } = require("../../services/crudFactory");

module.exports = createCrudRouter("members", {
  filterableFields: ["ward_id", "polling_unit_id", "street_id", "status", "apc_caucus", "phone", "nin", "vin", "qr_id"],
  searchableFields: ["name", "phone", "email", "nin", "vin", "membership_number"],
  requiredOnCreate: ["ward_id", "name"],
  writableFields: [
    "polling_unit_id", "street_id", "gender", "date_of_birth", "alt_phone", "email",
    "occupation", "support_level", "address", "notes", "apc_caucus", "passport_url",
    "membership_number", "registration_date", "created_by", "device_id"
  ]
});
