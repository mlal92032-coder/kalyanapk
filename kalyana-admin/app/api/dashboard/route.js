import { NextResponse } from "next/server";
import getDb from "@/lib/db";

export async function GET() {
  const db = getDb();

  const totalProducts = db.prepare("SELECT COUNT(*) c FROM products").get().c;
  const publishedProducts = db
    .prepare("SELECT COUNT(*) c FROM products WHERE status = 'published'")
    .get().c;
  const totalCategories = db.prepare("SELECT COUNT(*) c FROM categories").get().c;
  const totalSuppliers = db.prepare("SELECT COUNT(*) c FROM suppliers").get().c;
  const totalOrders = db.prepare("SELECT COUNT(*) c FROM orders").get().c;
  const pendingOrders = db
    .prepare("SELECT COUNT(*) c FROM orders WHERE order_status = 'pending'")
    .get().c;
  const revenue =
    db.prepare("SELECT COALESCE(SUM(total),0) r FROM orders WHERE payment_status = 'paid'").get()
      .r || 0;
  const lowStock = db
    .prepare(
      "SELECT id, name, stock, low_stock_threshold FROM products WHERE stock <= low_stock_threshold AND status != 'archived'"
    )
    .all();
  const recentOrders = db
    .prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 5")
    .all();

  return NextResponse.json({
    totalProducts,
    publishedProducts,
    totalCategories,
    totalSuppliers,
    totalOrders,
    pendingOrders,
    revenue,
    lowStock,
    recentOrders,
  });
}
