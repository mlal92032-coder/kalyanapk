import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    console.log(`[API] GET /api/admin/products/${id}/colors`);

    // Verify admin session
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();

    // Verify product exists
    const product = db.prepare("SELECT id FROM products WHERE id = ?").get(id);
    if (!product) {
      console.log(`[API] Product ${id} not found`);
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Fetch all colors for this product
    const colors = db
      .prepare("SELECT * FROM product_colors WHERE product_id = ? ORDER BY created_at DESC")
      .all(id);

    console.log(`[API] Found ${colors.length} colors for product ${id}`);
    return NextResponse.json({ colors });
  } catch (error) {
    console.error(`[API] Error in GET /api/admin/products/[id]/colors:`, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    console.log(`[API] POST /api/admin/products/${id}/colors`);

    // Verify admin session
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { color_name, color_hex } = body;

    // Validate input
    if (!color_name || !color_hex) {
      return NextResponse.json(
        { error: "color_name and color_hex are required" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Verify product exists
    const product = db.prepare("SELECT id FROM products WHERE id = ?").get(id);
    if (!product) {
      console.log(`[API] Product ${id} not found`);
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if color already exists for this product
    const existingColor = db
      .prepare("SELECT id FROM product_colors WHERE product_id = ? AND color_name = ?")
      .get(id, color_name);

    if (existingColor) {
      return NextResponse.json(
        { error: "Color already exists for this product" },
        { status: 409 }
      );
    }

    // Insert new color
    const stmt = db.prepare(
      "INSERT INTO product_colors (product_id, color_name, color_hex) VALUES (?, ?, ?)"
    );
    const result = stmt.run(id, color_name, color_hex);
    const colorId = result.lastInsertRowid;

    // Log activity
    logActivity({
      adminEmail: session.email,
      action: "ADD_PRODUCT_COLOR",
      entityType: "product_color",
      entityId: colorId,
      details: { product_id: id, color_name, color_hex },
    });

    console.log(`[API] Color created with ID ${colorId}`);

    const newColor = db.prepare("SELECT * FROM product_colors WHERE id = ?").get(colorId);
    return NextResponse.json({ color: newColor }, { status: 201 });
  } catch (error) {
    console.error(`[API] Error in POST /api/admin/products/[id]/colors:`, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
