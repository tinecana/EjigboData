/**
 * PWMS ENTERPRISE REFACTOR — SPRINT 2: GENERIC CRUD ROUTER FACTORY
 * =====================================================================
 * Every entity (members, meetings, campaigns, ...) needs the same
 * shape of GET/POST/PUT/DELETE, pagination, filtering, searching, and
 * incremental sync. Rather than hand-write that eleven times (and
 * eleven chances to drift out of sync), this factory builds it once;
 * each routes/*.js file just supplies the table name and its
 * entity-specific config.
 *
 * All identifiers (table/column names) come ONLY from the config each
 * route file supplies at startup — never from request input — so
 * there is no SQL-injection surface from dynamic identifiers. Values
 * are always passed as parameterized query args ($1, $2, ...).
 */

const express = require("express");
const { query, withTransaction } = require("../database/db");
const { sendSuccess, ApiError, asyncHandler } = require("../utils/response");

const MAX_PAGE_SIZE = 200;
const DEFAULT_PAGE_SIZE = 50;

/**
 * @param {string} table - physical table name (from schema, trusted)
 * @param {object} config
 * @param {string[]} config.filterableFields - columns allowed in ?field=value filters
 * @param {string[]} config.searchableFields - text columns included in ?search=
 * @param {string[]} config.requiredOnCreate - columns that must be present on POST
 * @param {boolean}  config.wardScoped - whether this table has a ward_id column
 */
function createCrudRouter(table, config) {
  const {
    filterableFields = [],
    searchableFields = [],
    requiredOnCreate = [],
    wardScoped = true
  } = config;

  const router = express.Router();

  // -------------------------------------------------------------
  // GET / — list, with pagination + filtering + searching + updatedAfter
  // -------------------------------------------------------------
  router.get("/", asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(req.query.pageSize, 10) || DEFAULT_PAGE_SIZE));
    const offset = (page - 1) * pageSize;

    const conditions = ["deleted = false"];
    const values = [];

    if (wardScoped && req.query.ward_id) {
      values.push(req.query.ward_id);
      conditions.push(`ward_id = $${values.length}`);
    }

    for (const field of filterableFields) {
      if (req.query[field] !== undefined) {
        values.push(req.query[field]);
        conditions.push(`${field} = $${values.length}`);
      }
    }

    if (req.query.updatedAfter) {
      values.push(req.query.updatedAfter);
      conditions.push(`updated_at > $${values.length}`);
    }

    if (req.query.search && searchableFields.length) {
      values.push(`%${req.query.search}%`);
      const idx = values.length;
      conditions.push(`(${searchableFields.map(f => `${f} ILIKE $${idx}`).join(" OR ")})`);
    }

    const whereClause = conditions.length ? `where ${conditions.join(" and ")}` : "";

    const countResult = await query(`select count(*)::int as total from ${table} ${whereClause}`, values);
    const total = countResult.rows[0].total;

    const listValues = [...values, pageSize, offset];
    const rows = await query(
      `select * from ${table} ${whereClause} order by updated_at desc limit $${listValues.length - 1} offset $${listValues.length}`,
      listValues
    );

    sendSuccess(res, rows.rows, {
      pagination: {
        page, pageSize, total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  }));

  // -------------------------------------------------------------
  // GET /:id — single record
  // -------------------------------------------------------------
  router.get("/:id", asyncHandler(async (req, res) => {
    const result = await query(`select * from ${table} where id = $1 and deleted = false`, [req.params.id]);
    if (result.rows.length === 0) {
      throw new ApiError(404, "NOT_FOUND", `${table} record ${req.params.id} not found.`);
    }
    sendSuccess(res, result.rows[0]);
  }));

  // -------------------------------------------------------------
  // POST / — create (transactional)
  // -------------------------------------------------------------
  router.post("/", asyncHandler(async (req, res) => {
    const body = req.body || {};

    for (const field of requiredOnCreate) {
      if (body[field] === undefined || body[field] === null || body[field] === "") {
        throw new ApiError(400, "VALIDATION_ERROR", `Field "${field}" is required.`);
      }
    }

    const allowedColumns = [...new Set([...filterableFields, ...requiredOnCreate, ...(config.writableFields || [])])];
    const columns = allowedColumns.filter(c => body[c] !== undefined);

    if (columns.length === 0) {
      throw new ApiError(400, "VALIDATION_ERROR", "No writable fields supplied.");
    }

    const values = columns.map(c => body[c]);
    const placeholders = columns.map((_, i) => `$${i + 1}`);

    const created = await withTransaction(async (client) => {
      const insertResult = await client.query(
        `insert into ${table} (${columns.join(", ")}) values (${placeholders.join(", ")}) returning *`,
        values
      );
      return insertResult.rows[0];
    });

    sendSuccess(res, created, { status: 201 });
  }));

  // -------------------------------------------------------------
  // PUT /:id — update (transactional, bumps version + updated_at)
  // -------------------------------------------------------------
  router.put("/:id", asyncHandler(async (req, res) => {
    const body = req.body || {};
    const allowedColumns = [...new Set([...filterableFields, ...requiredOnCreate, ...(config.writableFields || [])])];
    const columns = allowedColumns.filter(c => body[c] !== undefined);

    const updated = await withTransaction(async (client) => {
      const existing = await client.query(`select * from ${table} where id = $1 and deleted = false for update`, [req.params.id]);
      if (existing.rows.length === 0) {
        throw new ApiError(404, "NOT_FOUND", `${table} record ${req.params.id} not found.`);
      }

      const setClauses = columns.map((c, i) => `${c} = $${i + 2}`);
      setClauses.push(`updated_at = now()`);
      setClauses.push(`version = version + 1`);
      if (body.updated_by !== undefined) setClauses.push(`updated_by = $${columns.length + 2}`);

      const values = [req.params.id, ...columns.map(c => body[c])];
      if (body.updated_by !== undefined) values.push(body.updated_by);

      const result = await client.query(
        `update ${table} set ${setClauses.join(", ")} where id = $1 returning *`,
        values
      );
      return result.rows[0];
    });

    sendSuccess(res, updated);
  }));

  // -------------------------------------------------------------
  // DELETE /:id — soft delete (transactional)
  // -------------------------------------------------------------
  router.delete("/:id", asyncHandler(async (req, res) => {
    const deleted = await withTransaction(async (client) => {
      const existing = await client.query(`select * from ${table} where id = $1 and deleted = false for update`, [req.params.id]);
      if (existing.rows.length === 0) {
        throw new ApiError(404, "NOT_FOUND", `${table} record ${req.params.id} not found.`);
      }
      const result = await client.query(
        `update ${table} set deleted = true, deleted_at = now(), updated_at = now(), version = version + 1 where id = $1 returning *`,
        [req.params.id]
      );
      return result.rows[0];
    });

    sendSuccess(res, deleted);
  }));

  return router;
}

module.exports = { createCrudRouter };
