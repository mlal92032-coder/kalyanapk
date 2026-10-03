import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function DELETE(request, { params }) {
  try {
    const { id, colorId } = await params;
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

    // Verify color belongs to this product
    const color = db
      .prepare("SELECT id, color_name FROM product_colors WHERE products.id = ?")
      .get(colorId, id);

    if (!color) {
      return NextResponse.json({ error: "Color not found." }, { status: 404 });
    }

    // Delete color (cascade will remove variants and images)
    db.prepare("DELETE FROM product_colors WHERE products.id = ?").run(colorId);

    logActivity({
      adminEmail: session.email,
      action: "DELETE_PRODUCT_COLOR",
      entityType: "product",
      entityId: parseInt(id),
      details: { color_name: color.color_name },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Error in DELETE /api/products/[id]/colors/[colorId]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
