import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function DELETE(request, { params }) {
  try {
    const { id, sizeId } = await params;
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

    // Verify size belongs to this product
    const size = db
      .prepare("SELECT id, size_name FROM product_sizes WHERE products.id = ?")
      .get(sizeId, id);

    if (!size) {
      return NextResponse.json({ error: "Size not found." }, { status: 404 });
    }

    // Delete size (cascade will remove variants)
    db.prepare("DELETE FROM product_sizes WHERE products.id = ?").run(sizeId);

    logActivity({
      adminEmail: session.email,
      action: "DELETE_PRODUCT_SIZE",
      entityType: "product",
      entityId: parseInt(id),
      details: { size_name: size.size_name },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Error in DELETE /api/products/[id]/sizes/[sizeId]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
