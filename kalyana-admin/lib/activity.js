import getDb from "./db";

export function logActivity({ adminEmail, action, entityType, entityId, details }) {
  const db = getDb();
  db.prepare(
    `INSERT INTO activity_logs (admin_email, action, entity_type, entity_id, details)
     VALUES (?, ?, ?, ?, ?)`
  ).run(
    adminEmail || null,
    action,
    entityType || null,
    entityId || null,
    details ? JSON.stringify(details) : null
  );
}
