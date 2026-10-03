import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function DELETE(request, { params }) {
  try {
    const { id, colorId } = await params;
    console.log(`[API] DELETE /api/admin/products/${id}/colors/${colorId}`);

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

    // Verify color exists and belongs to this product
    const color = db
      .prepare("SELECT * FROM product_colors WHERE id = ? AND product_id = ?")
      .get(colorId, id);

    if (!color) {
      console.log(`[API] Color ${colorId} not found for product ${id}`);
      return NextResponse.json({ error: "Color not found" }, { status: 404 });
    }

    // Check if color is used in any product variants
    const variantCount = db
      .prepare("SELECT COUNT(*) c FROM product_variants WHERE color_id = ?")
      .get(colorId).c;

    if (variantCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete color as it is used in ${variantCount} variant(s)`,
          variants_count: variantCount,
        },
        { status: 409 }
      );
    }

    // Delete the color
    db.prepare("DELETE FROM product_colors WHERE id = ?").run(colorId);

    // Log activity
    logActivity({
      adminEmail: session.email,
      action: "DELETE_PRODUCT_COLOR",
      entityType: "product_color",
      entityId: colorId,
      details: { product_id: id, color_name: color.color_name, color_hex: color.color_hex },
    });

    console.log(`[API] Color ${colorId} deleted successfully`);
    return NextResponse.json({ success: true, message: "Color deleted successfully" });
  } catch (error) {
    console.error(`[API] Error in DELETE /api/admin/products/[id]/colors/[colorId]:`, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
