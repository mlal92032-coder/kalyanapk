import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function DELETE(request, { params }) {
  try {
    const { id, variantId } = await params;
    const db = getDb();
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify product exists
    const product = db.prepare("SELECT id FROM products WHERE products.id = ?").get(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    // Verify variant belongs to this product
    const variant = db
      .prepare("SELECT id, sku FROM product_variants WHERE products.id = ?")
      .get(variantId, id);

    if (!variant) {
      return NextResponse.json({ error: "Variant not found." }, { status: 404 });
    }

    // Delete variant (cascade will remove images)
    db.prepare("DELETE FROM product_variants WHERE products.id = ?").run(variantId);

    logActivity({
      adminEmail: session.email,
      action: "DELETE_PRODUCT_VARIANT",
      entityType: "product",
      entityId: parseInt(id),
      details: { variant_sku: variant.sku },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Error in DELETE /api/products/[id]/variants/[variantId]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id, variantId } = await params;
    const body = await request.json().catch(() => ({}));
    const { sku, price_override, stock, low_stock_threshold, status } = body;

    const db = getDb();
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify product exists
    const product = db.prepare("SELECT id FROM products WHERE products.id = ?").get(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    // Verify variant belongs to this product
    const variant = db
      .prepare("SELECT * FROM product_variants WHERE products.id = ?")
      .get(variantId, id);

    if (!variant) {
      return NextResponse.json({ error: "Variant not found." }, { status: 404 });
    }

    // Build update query (only update provided fields)
    const updates = [];
    const values = [];

    if (sku !== undefined) {
      updates.push("sku = ?");
      values.push(sku || null);
    }
    if (price_override !== undefined) {
      updates.push("price_override = ?");
      values.push(price_override || null);
    }
    if (stock !== undefined) {
      updates.push("stock = ?");
      values.push(stock);
    }
    if (low_stock_threshold !== undefined) {
      updates.push("low_stock_threshold = ?");
      values.push(low_stock_threshold);
    }
    if (status !== undefined) {
      updates.push("status = ?");
      values.push(status);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No fields to update." },
        { status: 400 }
      );
    }

    updates.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(variantId);

    const query = `UPDATE product_variants SET ${updates.join(", ")} WHERE products.id = ?`;
    db.prepare(query).run(...values);

    logActivity({
      adminEmail: session.email,
      action: "UPDATE_PRODUCT_VARIANT",
      entityType: "product",
      entityId: parseInt(id),
      details: { variant_id: variantId, changes: { sku, price_override, stock, status } },
    });

    const updated = db
      .prepare(
        `SELECT id, product_id, color_id, size_id, sku, price_override, stock, low_stock_threshold,
          status, created_at, updated_at FROM product_variants WHERE products.id = ?`
      )
      .get(variantId);

    return NextResponse.json({ variant: updated });
  } catch (error) {
    console.error("[API] Error in PATCH /api/products/[id]/variants/[variantId]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
