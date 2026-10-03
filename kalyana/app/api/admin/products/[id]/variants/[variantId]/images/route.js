import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function POST(request, { params }) {
  try {
    const { id, variantId } = await params;
    const body = await request.json().catch(() => ({}));
    const { image_url, color_id, is_primary } = body;

    if (!image_url) {
      return NextResponse.json({ error: "Image URL is required." }, { status: 400 });
    }

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
      .prepare("SELECT id FROM product_variants WHERE products.id = ?")
      .get(variantId, id);

    if (!variant) {
      return NextResponse.json({ error: "Variant not found." }, { status: 404 });
    }

    // If color_id provided, verify it belongs to this product
    if (color_id) {
      const color = db
        .prepare("SELECT id FROM product_colors WHERE products.id = ?")
        .get(color_id, id);
      if (!color) {
        return NextResponse.json({ error: "Color not found for this product." }, { status: 404 });
      }
    }

    // If marking as primary, unmark any existing primary for this color
    if (is_primary) {
      db.prepare(
        "UPDATE product_variant_images SET is_primary = 0 WHERE products.id = ? AND color_id IS ? AND is_primary = 1"
      ).run(id, color_id || null);
    }

    // Add image
    const result = db
      .prepare(
        `INSERT INTO product_variant_images (product_id, color_id, image_url, sort_order, is_primary)
         VALUES (?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM product_variant_images WHERE products.id = ? AND color_id IS ?), ?)`
      )
      .run(id, color_id || null, image_url, id, color_id || null, is_primary ? 1 : 0);

    logActivity({
      adminEmail: session.email,
      action: "ADD_VARIANT_IMAGE",
      entityType: "product",
      entityId: parseInt(id),
      details: { variant_id: variantId, color_id, is_primary },
    });

    const image = db
      .prepare(
        "SELECT id, product_id, color_id, image_url, sort_order, is_primary FROM product_variant_images WHERE products.id = ?"
      )
      .get(result.lastInsertRowid);

    return NextResponse.json({ image });
  } catch (error) {
    console.error("[API] Error in POST /api/products/[id]/variants/[variantId]/images:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    const { id, variantId } = await params;
    const db = getDb();

    // Verify product exists
    const product = db.prepare("SELECT id FROM products WHERE products.id = ?").get(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    // Verify variant belongs to this product
    const variant = db
      .prepare("SELECT id FROM product_variants WHERE products.id = ?")
      .get(variantId, id);

    if (!variant) {
      return NextResponse.json({ error: "Variant not found." }, { status: 404 });
    }

    const images = db
      .prepare(
        "SELECT id, product_id, color_id, image_url, sort_order, is_primary FROM product_variant_images WHERE products.id = ? ORDER BY sort_order"
      )
      .all(id);

    return NextResponse.json({ images });
  } catch (error) {
    console.error("[API] Error in GET /api/products/[id]/variants/[variantId]/images:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
