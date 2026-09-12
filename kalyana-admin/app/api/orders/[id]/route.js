import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { getAdminSession } from "@/lib/auth";

const VALID_STATUSES = [
  "pending", "confirmed", "processing", "packed", "shipped", "delivered", "cancelled", "refunded",
];

export async function GET(request, { params }) {
  const { id } = await params;
  const db = getDb();
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(id);
  return NextResponse.json({ order, items });
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const db = getDb();
  const session = await getAdminSession();

  const existing = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updates = {};
  if (body.order_status !== undefined) {
    if (!VALID_STATUSES.includes(body.order_status)) {
      return NextResponse.json({ error: "Invalid order status." }, { status: 400 });
    }
    updates.order_status = body.order_status;
  }
  if (body.payment_status !== undefined) {
    updates.payment_status = body.payment_status;
  }
  updates.updated_at = new Date().toISOString();

  const setClause = Object.keys(updates).map((k) => `${k} = @${k}`).join(", ");
  db.prepare(`UPDATE orders SET ${setClause} WHERE id = @id`).run({ ...updates, id });

  logActivity({
    adminEmail: session?.email,
    action: "UPDATE_ORDER_STATUS",
    entityType: "order",
    entityId: id,
    details: { from: existing.order_status, to: updates.order_status, payment_status: updates.payment_status },
  });

  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
  return NextResponse.json({ order });
}
