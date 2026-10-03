import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    console.log(`[API] GET /api/admin/products/${id}/sizes`);

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

    // Fetch all sizes for this product
    const sizes = db
      .prepare("SELECT * FROM product_sizes WHERE product_id = ? ORDER BY created_at DESC")
      .all(id);

    console.log(`[API] Found ${sizes.length} sizes for product ${id}`);
    return NextResponse.json({ sizes });
  } catch (error) {
    console.error(`[API] Error in GET /api/admin/products/[id]/sizes:`, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    console.log(`[API] POST /api/admin/products/${id}/sizes`);

    // Verify admin session
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { size_name } = body;

    // Validate input
    if (!size_name) {
      return NextResponse.json(
        { error: "size_name is required" },
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

    // Check if size already exists for this product
    const existingSize = db
      .prepare("SELECT id FROM product_sizes WHERE product_id = ? AND size_name = ?")
      .get(id, size_name);

    if (existingSize) {
      return NextResponse.json(
        { error: "Size already exists for this product" },
        { status: 409 }
      );
    }

    // Insert new size
    const stmt = db.prepare(
      "INSERT INTO product_sizes (product_id, size_name) VALUES (?, ?)"
    );
    const result = stmt.run(id, size_name);
    const sizeId = result.lastInsertRowid;

    // Log activity
    logActivity({
      adminEmail: session.email,
      action: "ADD_PRODUCT_SIZE",
      entityType: "product_size",
      entityId: sizeId,
      details: { product_id: id, size_name },
    });

    console.log(`[API] Size created with ID ${sizeId}`);

    const newSize = db.prepare("SELECT * FROM product_sizes WHERE id = ?").get(sizeId);
    return NextResponse.json({ size: newSize }, { status: 201 });
  } catch (error) {
    console.error(`[API] Error in POST /api/admin/products/[id]/sizes:`, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
