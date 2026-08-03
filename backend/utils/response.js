/**
 * PWMS ENTERPRISE REFACTOR — SPRINT 2: STANDARDIZED RESPONSE ENVELOPE
 * =====================================================================
 * Every endpoint in Sprint 2 returns exactly one of these two shapes —
 * enforced here in one place so no individual route can drift from it.
 *
 * Success:
 *   {
 *     "success": true,
 *     "data": <payload>,
 *     "error": null,
 *     "meta": { "timestamp": "...", "pagination": { ... } | undefined }
 *   }
 *
 * Failure:
 *   {
 *     "success": false,
 *     "data": null,
 *     "error": { "code": "NOT_FOUND", "message": "..." },
 *     "meta": { "timestamp": "..." }
 *   }
 */

class ApiError extends Error {
  constructor(status, code, message, details = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function buildConflictError({
  entity,
  entityId,
  localVersion,
  remoteVersion,
  localUpdatedAt,
  remoteUpdatedAt,
  localUpdatedBy,
  remoteUpdatedBy,
  deviceId,
  conflictingFields,
  mergePolicy = "newest_wins",
  serverRecord,
  clientRecord,
  message = "Record version conflict."
} = {}) {
  return {
    code: "VERSION_CONFLICT",
    message,
    entity,
    entityId,
    localVersion,
    remoteVersion,
    localUpdatedAt,
    remoteUpdatedAt,
    localUpdatedBy,
    remoteUpdatedBy,
    deviceId,
    conflictingFields,
    mergePolicy,
    serverRecord,
    clientRecord
  };
}

function sendSuccess(res, data, { pagination, status = 200 } = {}) {
  const meta = { timestamp: new Date().toISOString() };
  if (pagination) meta.pagination = pagination;
  res.status(status).json({ success: true, data, error: null, meta });
}

function sendError(res, status, code, message, details = {}) {
  const errorPayload = { code, message, ...details };
  res.status(status).json({
    success: false,
    data: null,
    error: errorPayload,
    meta: { timestamp: new Date().toISOString() }
  });
}

// Wraps an async Express handler so a thrown error is forwarded to the
// standardized error middleware instead of crashing the process or
// producing a non-enveloped response.
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// Mount this LAST, after all routes: guarantees every unhandled error
// (including ones this module didn't anticipate) still returns the
// standardized envelope rather than Express's default HTML error page.
function standardErrorMiddleware(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof ApiError) {
    return sendError(res, err.status, err.code, err.message, err.details || {});
  }
  console.error("[API] Unhandled error:", err);
  return sendError(res, 500, "INTERNAL_ERROR", "An unexpected error occurred.");
}

module.exports = { ApiError, buildConflictError, sendSuccess, sendError, asyncHandler, standardErrorMiddleware };
