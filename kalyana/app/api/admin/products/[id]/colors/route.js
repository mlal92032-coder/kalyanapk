import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { color_name, color_hex } = body;

    if (!color_name) {
      return NextResponse.json({ error: "Color name is required." }, { status: 400 });
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

    // Check if color already exists for this product
    const existing = db
      .prepare("SELECT id FROM product_colors WHERE products.id = ? AND color_name = ?")
      .get(id, color_name);

    if (existing) {
      return NextResponse.json(
        { error: "Color already exists for this product." },
        { status: 400 }
      );
    }

    // Add color
    const result = db
      .prepare(
        "INSERT INTO product_colors (product_id, color_name, color_hex, sort_order) VALUES (?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM product_colors WHERE products.id = ?))"
      )
      .run(id, color_name, color_hex || null, id);

    logActivity({
      adminEmail: session.email,
      action: "ADD_PRODUCT_COLOR",
      entityType: "product",
      entityId: parseInt(id),
      details: { color_name, color_hex },
    });

    const color = db
      .prepare("SELECT id, product_id, color_name, color_hex, sort_order FROM product_colors WHERE products.id = ?")
      .get(result.lastInsertRowid);

    return NextResponse.json({ color });
  } catch (error) {
    console.error("[API] Error in POST /api/products/[id]/colors:", error);
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

    const colors = db
      .prepare("SELECT id, product_id, color_name, color_hex, sort_order FROM product_colors WHERE products.id = ? ORDER BY sort_order")
      .all(id);

    return NextResponse.json({ colors });
  } catch (error) {
    console.error("[API] Error in GET /api/products/[id]/colors:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
