import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getBulkTiers } from "@/lib/pricing";

export async function GET(request) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const category = searchParams.get("category");
  const limit = Math.min(Number(searchParams.get("limit")) || 24, 100);

  let sql = `
    SELECT p.*, c.name as category_name, c.slug as category_slug, s.name as supplier_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE p.status = 'published'
  `;
  const args = [];

  if (category) {
    sql += " AND c.slug = ?";
    args.push(category);
  }
  if (q) {
    sql +=
      " AND (p.name LIKE ? OR p.description LIKE ? OR p.short_description LIKE ? OR c.name LIKE ? OR s.name LIKE ? OR p.sku LIKE ?)";
    const like = `%${q}%`;
    args.push(like, like, like, like, like, like);
  }

  sql += " ORDER BY p.created_at DESC LIMIT ?";
  args.push(limit);

  const products = db.prepare(sql).all(...args);
  const withTiers = products.map((p) => ({
    ...p,
    images: JSON.parse(p.images || "[]"),
    bulk_pricing: getBulkTiers(p.id),
  }));

  return NextResponse.json({ products: withTiers });
}
