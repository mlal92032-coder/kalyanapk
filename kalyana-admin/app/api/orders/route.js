import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

export async function GET(request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("paymentStatus");

    let sql = "SELECT * FROM orders WHERE 1=1";
    const args = [];

    if (status) {
      sql += " AND order_status = ?";
      args.push(status);
    }

    if (paymentStatus) {
      sql += " AND payment_status = ?";
      args.push(paymentStatus);
    }

    sql += " ORDER BY created_at DESC LIMIT 100";

    const orders = db.prepare(sql).all(...args);
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("[API] Error in GET /api/orders:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { orderId, order_status } = body;

    if (!orderId || !order_status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = getDb();
    const order = db.prepare("SELECT id FROM orders WHERE id = ?").get(orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    db.prepare(
      "UPDATE orders SET order_status = ?, updated_at = ? WHERE id = ?"
    ).run(order_status, new Date().toISOString(), orderId);

    const updated = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
    return NextResponse.json({ order: updated });
  } catch (error) {
    console.error("[API] Error in PATCH /api/orders:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
