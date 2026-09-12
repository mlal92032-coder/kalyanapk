import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { logActivity } from "@/lib/activity";

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET() {
  const db = getDb();
  const categories = db
    .prepare(
      `SELECT c.*, p.name as parent_name,
        (SELECT COUNT(*) FROM products WHERE category_id = c.id) as product_count
       FROM categories c LEFT JOIN categories p ON c.parent_id = p.id
       ORDER BY c.sort_order ASC, c.id ASC`
    )
    .all();
  return NextResponse.json({ categories });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { name, parent_id, image, status } = body;

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Category name is required." }, { status: 400 });
  }

  const db = getDb();
  const slug = slugify(name);

  const existing = db.prepare("SELECT id FROM categories WHERE slug = ?").get(slug);
  if (existing) {
    return NextResponse.json(
      { error: "A category with a similar name already exists." },
      { status: 409 }
    );
  }

  const maxOrder = db.prepare("SELECT COALESCE(MAX(sort_order),0) m FROM categories").get().m;

  const result = db
    .prepare(
      "INSERT INTO categories (name, slug, parent_id, image, status, sort_order) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .run(name.trim(), slug, parent_id || null, image || null, status || "published", maxOrder + 1);

  logActivity({ action: "CREATE_CATEGORY", entityType: "category", entityId: result.lastInsertRowid, details: { name } });

  const category = db.prepare("SELECT * FROM categories WHERE id = ?").get(result.lastInsertRowid);
  return NextResponse.json({ category }, { status: 201 });
}
