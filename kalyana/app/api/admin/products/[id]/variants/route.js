import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { color_id, size_id, sku, price_override, stock } = body;

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

    // Verify color and size if provided
    if (color_id) {
      const color = db
        .prepare("SELECT id FROM product_colors WHERE products.id = ?")
        .get(color_id, id);
      if (!color) {
        return NextResponse.json({ error: "Color not found for this product." }, { status: 404 });
      }
    }

    if (size_id) {
      const size = db
        .prepare("SELECT id FROM product_sizes WHERE products.id = ?")
        .get(size_id, id);
      if (!size) {
        return NextResponse.json({ error: "Size not found for this product." }, { status: 404 });
      }
    }

    // Check for duplicate variant (same color + size combo)
    const existing = db
      .prepare(
        "SELECT id FROM product_variants WHERE products.id = ? AND (color_id IS NULL ? ? = ?) AND (size_id IS NULL ? ? = ?)"
      )
      .get(id, color_id === null ? 1 : 0, color_id, size_id === null ? 1 : 0, size_id);

    if (existing) {
      return NextResponse.json(
        { error: "Variant with this color/size combination already exists." },
        { status: 400 }
      );
    }

    // Add variant
    const result = db
      .prepare(
        `INSERT INTO product_variants (product_id, color_id, size_id, sku, price_override, stock, low_stock_threshold, status)
         VALUES (?, ?, ?, ?, ?, ?, 10, 'active')`
      )
      .run(
        id,
        color_id || null,
        size_id || null,
        sku || null,
        price_override || null,
        stock || 0
      );

    logActivity({
      adminEmail: session.email,
      action: "ADD_PRODUCT_VARIANT",
      entityType: "product",
      entityId: parseInt(id),
      details: { color_id, size_id, sku, stock },
    });

    const variant = db
      .prepare(
        `SELECT id, product_id, color_id, size_id, sku, price_override, stock, low_stock_threshold, status, created_at, updated_at
         FROM product_variants WHERE products.id = ?`
      )
      .get(result.lastInsertRowid);

    return NextResponse.json({ variant });
  } catch (error) {
    console.error("[API] Error in POST /api/products/[id]/variants:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const db = getDb();

    const product = db.prepare("SELECT id FROM products WHERE products.id = ?").get(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const variants = db
      .prepare(
        `SELECT
           v.id, v.product_id, v.color_id, v.size_id, v.sku, v.price_override, v.stock,
           v.low_stock_threshold, v.status, v.created_at, v.updated_at,
           c.color_name, c.color_hex, s.size_name
         FROM product_variants v
         LEFT JOIN product_colors c ON v.color_id = c.id
         LEFT JOIN product_sizes s ON v.size_id = s.id
         WHERE products.id = ?
         ORDER BY v.created_at`
      )
      .all(id);

    return NextResponse.json({ variants });
  } catch (error) {
    console.error("[API] Error in GET /api/products/[id]/variants:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
