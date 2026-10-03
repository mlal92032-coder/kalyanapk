import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { getAdminSession } from "@/lib/auth";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    console.log(`[API] GET /api/products/${id}`);

    const db = getDb();
    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(id);

    if (!product) {
      console.log(`[API] Product ${id} not found`);
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    console.log(`[API] Found product: ${product.name} (ID: ${id})`);
    const bulk_pricing = db
      .prepare("SELECT * FROM bulk_pricing WHERE product_id = ? ORDER BY min_qty ASC")
      .all(id);

    console.log(`[API] Found ${bulk_pricing.length} bulk pricing tiers`);
    return NextResponse.json({ product, bulk_pricing });
  } catch (error) {
    console.error(`[API] Error in GET /api/products/[id]:`, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const db = getDb();
  const session = await getAdminSession();

  const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const fields = [
    "name", "sku", "category_id", "supplier_id", "description", "short_description",
    "base_price", "currency", "moq", "max_quantity", "stock", "low_stock_threshold",
    "main_image", "images", "status",
  ];
  const updates = {};
  for (const f of fields) {
    if (body[f] !== undefined) updates[f] = body[f];
  }
  if (updates.images !== undefined) updates.images = JSON.stringify(updates.images);
  updates.updated_at = new Date().toISOString();

  // Inventory change tracking
  if (updates.stock !== undefined && Number(updates.stock) !== existing.stock) {
    db.prepare(
      "INSERT INTO inventory_logs (product_id, previous_qty, new_qty, reason, admin_email) VALUES (?, ?, ?, ?, ?)"
    ).run(id, existing.stock, Number(updates.stock), body.stock_reason || "Manual adjustment", session?.email || null);
  }

  const setClause = Object.keys(updates).map((k) => `${k} = @${k}`).join(", ");
  if (setClause) {
    db.prepare(`UPDATE products SET ${setClause} WHERE id = @id`).run({ ...updates, id });
  }

  // Bulk pricing replace (owner edits tiers, e.g. 50-99 $6 -> $5.50)
  if (Array.isArray(body.bulk_pricing)) {
    db.prepare("DELETE FROM bulk_pricing WHERE product_id = ?").run(id);
    const insertTier = db.prepare(
      "INSERT INTO bulk_pricing (product_id, min_qty, max_qty, price) VALUES (?, ?, ?, ?)"
    );
    for (const tier of body.bulk_pricing) {
      if (tier.min_qty === undefined || tier.price === undefined) continue;
      insertTier.run(
        id,
        Number(tier.min_qty),
        tier.max_qty === "" || tier.max_qty === null ? null : Number(tier.max_qty),
        Number(tier.price)
      );
    }
  }

  logActivity({
    adminEmail: session?.email,
    action: "UPDATE_PRODUCT",
    entityType: "product",
    entityId: id,
    details: {
      changed: Object.keys(updates),
      old_price: existing.base_price,
      new_price: updates.base_price,
    },
  });

  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
  const bulk_pricing = db
    .prepare("SELECT * FROM bulk_pricing WHERE product_id = ? ORDER BY min_qty ASC")
    .all(id);
  return NextResponse.json({ product, bulk_pricing });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const db = getDb();
  const session = await getAdminSession();

  const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const orderCount = db
    .prepare("SELECT COUNT(*) c FROM order_items WHERE product_id = ?")
    .get(id).c;

  if (orderCount > 0) {
    db.prepare("UPDATE products SET status = 'archived' WHERE id = ?").run(id);
    logActivity({ adminEmail: session?.email, action: "ARCHIVE_PRODUCT", entityType: "product", entityId: id });
    return NextResponse.json({
      archived: true,
      message: `This product has ${orderCount} historical order line(s). It has been archived instead of permanently deleted to preserve order records.`,
    });
  }

  db.prepare("DELETE FROM bulk_pricing WHERE product_id = ?").run(id);
  db.prepare("DELETE FROM products WHERE id = ?").run(id);
  logActivity({ adminEmail: session?.email, action: "DELETE_PRODUCT", entityType: "product", entityId: id });

  return NextResponse.json({ success: true });
}
