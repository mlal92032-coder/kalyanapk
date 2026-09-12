import { NextResponse } from "next/server";
import getDb from "@/lib/db";

export async function GET(request) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let sql = "SELECT * FROM orders WHERE 1=1";
  const args = [];
  if (status) {
    sql += " AND order_status = ?";
    args.push(status);
  }
  sql += " ORDER BY created_at DESC";

  const orders = db.prepare(sql).all(...args);
  return NextResponse.json({ orders });
}
