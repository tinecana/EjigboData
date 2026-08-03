const { createCrudRouter } = require("../../services/crudFactory");

module.exports = createCrudRouter("notifications", {
  filterableFields: ["ward_id", "channel", "status", "recipient_member_id"],
  searchableFields: ["message", "recipient_phone"],
  requiredOnCreate: ["ward_id", "message"],
  writableFields: ["channel", "recipient_member_id", "recipient_phone", "status", "sent_at", "created_by", "device_id"]
});
