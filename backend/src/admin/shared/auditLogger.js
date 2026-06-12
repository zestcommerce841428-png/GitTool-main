import { supabase } from "../../shared/supabase.js";

const RETRY_DELAY_MS = 250;

function structuredFallbackLog(action, targetType, targetId, details, err) {
  // Write a structured JSON line to stderr so log shippers / CloudWatch / Datadog can capture it
  process.stderr.write(
    JSON.stringify({
      level: "ERROR",
      event: "audit_log_failure",
      action,
      targetType,
      targetId: String(targetId || ""),
      details,
      error: err.message,
      timestamp: new Date().toISOString(),
    }) + "\n"
  );
}

/**
 * Logs every admin action to the audit_logs table.
 *
 * @param {object}  req        - Express request (used for admin identity + IP)
 * @param {string}  action     - What happened, e.g. "suspend_user"
 * @param {string}  targetType - Resource type, e.g. "user"
 * @param {string}  targetId   - Resource ID
 * @param {object}  details    - Extra context to record
 * @param {object}  [opts]
 * @param {boolean} [opts.critical=false]
 *   When true the error is re-thrown after the fallback log so the calling
 *   controller returns 500. Use for compliance-sensitive actions (ban, delete,
 *   token adjustment) where proceeding without an audit trail is unacceptable.
 */
export async function auditLog(req, action, targetType, targetId, details = {}, { critical = false } = {}) {
  const record = {
    admin_email: req.admin?.adminEmail || "unknown",
    admin_role:  req.admin?.role       || "unknown",
    action,
    target_type: targetType,
    target_id:   String(targetId || ""),
    details,
    ip_address:  req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown",
  };

  // First attempt
  const { error: firstErr } = await supabase.from("audit_logs").insert(record);
  if (!firstErr) return;

  // One retry after a short delay
  await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
  const { error: retryErr } = await supabase.from("audit_logs").insert(record);
  if (!retryErr) return;

  // Both attempts failed — write structured fallback to stderr
  structuredFallbackLog(action, targetType, targetId, details, retryErr);

  if (critical) {
    throw new Error(`Audit log unavailable — ${action} aborted to preserve compliance record.`);
  }
}
