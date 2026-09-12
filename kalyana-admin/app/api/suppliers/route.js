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
  const suppliers = db
    .prepare(
      `SELECT s.*, (SELECT COUNT(*) FROM products WHERE supplier_id = s.id) as product_count
       FROM suppliers s ORDER BY s.created_at DESC`
    )
    .all();
  return NextResponse.json({ suppliers });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { name, description, location, contact_email, contact_phone, years_in_business, logo, verified } = body;

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Supplier name is required." }, { status: 400 });
  }

  const db = getDb();
  const slug = slugify(name) + "-" + Date.now().toString(36).slice(-4);

  const result = db
    .prepare(
      `INSERT INTO suppliers (name, slug, logo, description, location, contact_email, contact_phone, years_in_business, verified, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`
    )
    .run(
      name.trim(),
      slug,
      logo || null,
      description || null,
      location || null,
      contact_email || null,
      contact_phone || null,
      years_in_business || null,
      verified ? 1 : 0
    );

  logActivity({ action: "CREATE_SUPPLIER", entityType: "supplier", entityId: result.lastInsertRowid, details: { name } });

  const supplier = db.prepare("SELECT * FROM suppliers WHERE id = ?").get(result.lastInsertRowid);
  return NextResponse.json({ supplier }, { status: 201 });
}
