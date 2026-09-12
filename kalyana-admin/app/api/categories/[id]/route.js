import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { logActivity } from "@/lib/activity";

export async function GET(request, { params }) {
  const { id } = await params;
  const db = getDb();
  const category = db.prepare("SELECT * FROM categories WHERE id = ?").get(id);
  if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ category });
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const db = getDb();

  const existing = db.prepare("SELECT * FROM categories WHERE id = ?").get(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const fields = ["name", "parent_id", "image", "status", "sort_order"];
  const updates = {};
  for (const f of fields) {
    if (body[f] !== undefined) updates[f] = body[f];
  }

  const setClause = Object.keys(updates)
    .map((k) => `${k} = @${k}`)
    .join(", ");

  if (setClause) {
    db.prepare(`UPDATE categories SET ${setClause} WHERE id = @id`).run({ ...updates, id });
  }

  logActivity({ action: "UPDATE_CATEGORY", entityType: "category", entityId: id, details: updates });

  const category = db.prepare("SELECT * FROM categories WHERE id = ?").get(id);
  return NextResponse.json({ category });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const db = getDb();

  const existing = db.prepare("SELECT * FROM categories WHERE id = ?").get(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const productCount = db
    .prepare("SELECT COUNT(*) c FROM products WHERE category_id = ?")
    .get(id).c;
  const childCount = db
    .prepare("SELECT COUNT(*) c FROM categories WHERE parent_id = ?")
    .get(id).c;

  if (productCount > 0 || childCount > 0) {
    return NextResponse.json(
      {
        error: `This category is used by ${productCount} product(s) and ${childCount} subcategory(ies). Reassign or delete those first, or hide the category instead.`,
        productCount,
        childCount,
      },
      { status: 409 }
    );
  }

  db.prepare("DELETE FROM categories WHERE id = ?").run(id);
  logActivity({ action: "DELETE_CATEGORY", entityType: "category", entityId: id });

  return NextResponse.json({ success: true });
}
