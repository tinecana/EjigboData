/**
 * PWMS ENTERPRISE REFACTOR — SPRINT 2: CAMPAIGN <-> MEMBER ASSOCIATIONS
 * =====================================================================
 * campaign_members is a join table (no id-based CRUD makes sense for
 * "the relationship between a campaign and a member"), and assigning
 * or removing a member genuinely needs a transaction: both the
 * campaign and the member must exist before the link is created, and
 * that check-then-insert must be atomic.
 *
 * Mounted at: /api/v2/campaigns/:campaignId/members
 */

const express = require("express");
const { withTransaction, query } = require("../../database/db");
const { sendSuccess, ApiError, asyncHandler, buildConflictError } = require("../../utils/response");

const router = express.Router({ mergeParams: true });

// GET /api/v2/campaigns/:campaignId/members — list assigned members
router.get("/", asyncHandler(async (req, res) => {
  const result = await query(
    `select m.* from campaign_members cm
     join members m on m.id = cm.member_id and m.deleted = false
     where cm.campaign_id = $1
     order by m.name`,
    [req.params.campaignId]
  );
  sendSuccess(res, result.rows);
}));

// POST /api/v2/campaigns/:campaignId/members  { member_id }
router.post("/", asyncHandler(async (req, res) => {
  const { member_id } = req.body || {};
  if (!member_id) {
    throw new ApiError(400, "VALIDATION_ERROR", "member_id is required.");
  }

  const created = await withTransaction(async (client) => {
    const campaign = await client.query(
      "select id from campaigns where id = $1 and deleted = false for update", [req.params.campaignId]
    );
    if (campaign.rows.length === 0) {
      throw new ApiError(404, "NOT_FOUND", `Campaign ${req.params.campaignId} not found.`);
    }

    const member = await client.query(
      "select id from members where id = $1 and deleted = false", [member_id]
    );
    if (member.rows.length === 0) {
      throw new ApiError(404, "NOT_FOUND", `Member ${member_id} not found.`);
    }

    const link = await client.query(
      `insert into campaign_members (campaign_id, member_id)
       values ($1, $2)
       on conflict (campaign_id, member_id) do nothing
       returning *`,
      [req.params.campaignId, member_id]
    );
    return link.rows[0] || { campaign_id: req.params.campaignId, member_id, already_assigned: true };
  });

  sendSuccess(res, created, { status: 201 });
}));

// DELETE /api/v2/campaigns/:campaignId/members/:memberId
router.delete("/:memberId", asyncHandler(async (req, res) => {
  const removed = await withTransaction(async (client) => {
    const result = await client.query(
      `delete from campaign_members where campaign_id = $1 and member_id = $2 returning *`,
      [req.params.campaignId, req.params.memberId]
    );
    if (result.rows.length === 0) {
      throw new ApiError(404, "NOT_FOUND", "This member is not assigned to this campaign.");
    }
    return result.rows[0];
  });

  sendSuccess(res, removed);
}));

module.exports = router;
