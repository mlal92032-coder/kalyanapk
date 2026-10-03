import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function DELETE(request, { params }) {
  try {
    const { id, sizeId } = await params;
    console.log(`[API] DELETE /api/admin/products/${id}/sizes/${sizeId}`);

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

    // Verify size exists and belongs to this product
    const size = db
      .prepare("SELECT * FROM product_sizes WHERE id = ? AND product_id = ?")
      .get(sizeId, id);

    if (!size) {
      console.log(`[API] Size ${sizeId} not found for product ${id}`);
      return NextResponse.json({ error: "Size not found" }, { status: 404 });
    }

    // Check if this size is used in any variants
    const variantCount = db
      .prepare("SELECT COUNT(*) c FROM product_variants WHERE size_id = ?")
      .get(sizeId).c;

    if (variantCount > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete size",
          message: `This size is used in ${variantCount} product variant(s). Please update or remove those variants first.`,
        },
        { status: 409 }
      );
    }

    // Delete the size
    db.prepare("DELETE FROM product_sizes WHERE id = ?").run(sizeId);

    // Log activity
    logActivity({
      adminEmail: session.email,
      action: "DELETE_PRODUCT_SIZE",
      entityType: "product_size",
      entityId: sizeId,
      details: { product_id: id, size_name: size.size_name },
    });

    console.log(`[API] Size ${sizeId} deleted successfully`);
    return NextResponse.json({ success: true, message: "Size deleted successfully" });
  } catch (error) {
    console.error(`[API] Error in DELETE /api/admin/products/[id]/sizes/[sizeId]:`, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
