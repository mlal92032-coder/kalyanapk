import { NextResponse } from "next/server";
import getDb from "@/lib/db";

export async function GET() {
  const db = getDb();
  const categories = db
    .prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM products WHERE category_id = c.id AND status = 'published') as product_count
       FROM categories c
       WHERE c.status = 'published'
       ORDER BY c.sort_order ASC, c.id ASC`
    )
    .all();
  return NextResponse.json({ categories });
}
