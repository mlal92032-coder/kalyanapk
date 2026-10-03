import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { getAdminSession } from "@/lib/auth";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    console.log(`[API] GET /api/admin/products/${id}/variants`);

    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();

    const product = db.prepare("SELECT id FROM products WHERE id = ?").get(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const variants = db.prepare(`
      SELECT
        pv.id,
        pv.product_id,
        pv.color_id,
        pv.size_id,
        pv.sku,
        pv.stock,
        pv.created_at,
        pc.color_name,
        pc.color_hex,
        ps.size_name
      FROM product_variants pv
      LEFT JOIN product_colors pc ON pv.color_id = pc.id
      LEFT JOIN product_sizes ps ON pv.size_id = ps.id
      WHERE pv.product_id = ?
      ORDER BY pv.created_at DESC
    `).all(id);

    console.log(`[API] Found ${variants.length} variants for product ${id}`);
    return NextResponse.json({ variants });
  } catch (error) {
    console.error(`[API] Error in GET /api/admin/products/[id]/variants:`, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`[API] POST /api/admin/products/${id}/variants`);

    const db = getDb();

    const product = db.prepare("SELECT id FROM products WHERE id = ?").get(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const { color_id, size_id, sku, stock } = body;

    if (sku === undefined || stock === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: sku, stock" },
        { status: 400 }
      );
    }

    if (stock < 0) {
      return NextResponse.json(
        { error: "Stock cannot be negative" },
        { status: 400 }
      );
    }

    if (color_id !== undefined && color_id !== null) {
      const color = db.prepare("SELECT id FROM product_colors WHERE id = ? AND product_id = ?").get(color_id, id);
      if (!color) {
        return NextResponse.json(
          { error: "Color not found for this product" },
          { status: 404 }
        );
      }
    }

    if (size_id !== undefined && size_id !== null) {
      const size = db.prepare("SELECT id FROM product_sizes WHERE id = ? AND product_id = ?").get(size_id, id);
      if (!size) {
        return NextResponse.json(
          { error: "Size not found for this product" },
          { status: 404 }
        );
      }
    }

    const existingSku = db.prepare("SELECT id FROM product_variants WHERE sku = ?").get(sku);
    if (existingSku) {
      return NextResponse.json(
        { error: "SKU already exists" },
        { status: 409 }
      );
    }

    const variantId = db
      .prepare(`
        INSERT INTO product_variants (product_id, color_id, size_id, sku, stock)
        VALUES (?, ?, ?, ?, ?)
      `)
      .run(
        id,
        color_id || null,
        size_id || null,
        sku,
        Number(stock)
      ).lastInsertRowid;

    logActivity({
      adminEmail: session?.email,
      action: "CREATE_VARIANT",
      entityType: "variant",
      entityId: variantId,
      details: {
        product_id: id,
        sku,
        stock,
        color_id: color_id || null,
        size_id: size_id || null,
      },
    });

    const variant = db.prepare(`
      SELECT
        pv.id,
        pv.product_id,
        pv.color_id,
        pv.size_id,
        pv.sku,
        pv.stock,
        pv.created_at,
        pc.color_name,
        pc.color_hex,
        ps.size_name
      FROM product_variants pv
      LEFT JOIN product_colors pc ON pv.color_id = pc.id
      LEFT JOIN product_sizes ps ON pv.size_id = ps.id
      WHERE pv.id = ?
    `).get(variantId);

    console.log(`[API] Created variant ${variantId} for product ${id}`);
    return NextResponse.json({ variant }, { status: 201 });
  } catch (error) {
    console.error(`[API] Error in POST /api/admin/products/[id]/variants:`, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
