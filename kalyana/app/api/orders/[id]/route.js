import { NextResponse } from "next/server";
import getDb from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const db = getDb();

    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const items = db
      .prepare("SELECT * FROM order_items WHERE order_id = ? ORDER BY id")
      .all(id);

    return NextResponse.json({ order, items });
  } catch (error) {
    console.error("[API] Error in GET /api/orders/[id]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
