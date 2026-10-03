import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { size_name } = body;

    if (!size_name) {
      return NextResponse.json({ error: "Size name is required." }, { status: 400 });
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

    // Check if size already exists for this product
    const existing = db
      .prepare("SELECT id FROM product_sizes WHERE products.id = ? AND size_name = ?")
      .get(id, size_name);

    if (existing) {
      return NextResponse.json(
        { error: "Size already exists for this product." },
        { status: 400 }
      );
    }

    // Add size
    const result = db
      .prepare(
        "INSERT INTO product_sizes (product_id, size_name, sort_order) VALUES (?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM product_sizes WHERE products.id = ?))"
      )
      .run(id, size_name, id);

    logActivity({
      adminEmail: session.email,
      action: "ADD_PRODUCT_SIZE",
      entityType: "product",
      entityId: parseInt(id),
      details: { size_name },
    });

    const size = db
      .prepare("SELECT id, product_id, size_name, sort_order FROM product_sizes WHERE products.id = ?")
      .get(result.lastInsertRowid);

    return NextResponse.json({ size });
  } catch (error) {
    console.error("[API] Error in POST /api/products/[id]/sizes:", error);
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

    const sizes = db
      .prepare("SELECT id, product_id, size_name, sort_order FROM product_sizes WHERE products.id = ? ORDER BY sort_order")
      .all(id);

    return NextResponse.json({ sizes });
  } catch (error) {
    console.error("[API] Error in GET /api/products/[id]/sizes:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
