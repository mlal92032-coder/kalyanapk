import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { logActivity } from "@/lib/activity";

export async function GET(request, { params }) {
  const { id } = await params;
  const db = getDb();
  const supplier = db.prepare("SELECT * FROM suppliers WHERE id = ?").get(id);
  if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ supplier });
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const db = getDb();

  const existing = db.prepare("SELECT * FROM suppliers WHERE id = ?").get(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const fields = [
    "name", "logo", "description", "location", "contact_email",
    "contact_phone", "years_in_business", "verified", "status",
  ];
  const updates = {};
  for (const f of fields) {
    if (body[f] !== undefined) updates[f] = body[f];
  }
  if (updates.verified !== undefined) updates.verified = updates.verified ? 1 : 0;

  const setClause = Object.keys(updates).map((k) => `${k} = @${k}`).join(", ");
  if (setClause) {
    db.prepare(`UPDATE suppliers SET ${setClause} WHERE id = @id`).run({ ...updates, id });
  }

  logActivity({ action: "UPDATE_SUPPLIER", entityType: "supplier", entityId: id, details: updates });

  const supplier = db.prepare("SELECT * FROM suppliers WHERE id = ?").get(id);
  return NextResponse.json({ supplier });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const db = getDb();

  const existing = db.prepare("SELECT * FROM suppliers WHERE id = ?").get(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const productCount = db.prepare("SELECT COUNT(*) c FROM products WHERE supplier_id = ?").get(id).c;

  if (productCount > 0) {
    // Archive instead of destroying — preserves product/order history integrity
    db.prepare("UPDATE suppliers SET status = 'suspended' WHERE id = ?").run(id);
    logActivity({ action: "SUSPEND_SUPPLIER", entityType: "supplier", entityId: id });
    return NextResponse.json({
      archived: true,
      message: `This supplier has ${productCount} product(s) linked. It has been suspended instead of deleted to preserve product and order history.`,
    });
  }

  db.prepare("DELETE FROM suppliers WHERE id = ?").run(id);
  logActivity({ action: "DELETE_SUPPLIER", entityType: "supplier", entityId: id });
  return NextResponse.json({ success: true });
}
