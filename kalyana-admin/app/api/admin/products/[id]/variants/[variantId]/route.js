import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { getAdminSession } from "@/lib/auth";

export async function DELETE(request, { params }) {
  try {
    const { id, variantId } = await params;
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`[API] DELETE /api/admin/products/${id}/variants/${variantId}`);

    const db = getDb();

    const product = db.prepare("SELECT id FROM products WHERE id = ?").get(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const variant = db.prepare(
      "SELECT id, product_id, sku, stock FROM product_variants WHERE id = ? AND product_id = ?"
    ).get(variantId, id);

    if (!variant) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    }

    db.prepare("DELETE FROM product_variants WHERE id = ?").run(variantId);

    logActivity({
      adminEmail: session?.email,
      action: "DELETE_VARIANT",
      entityType: "variant",
      entityId: variantId,
      details: {
        product_id: id,
        sku: variant.sku,
        stock: variant.stock,
      },
    });

    console.log(`[API] Deleted variant ${variantId} from product ${id}`);
    return NextResponse.json({ success: true, message: "Variant deleted successfully" });
  } catch (error) {
    console.error(`[API] Error in DELETE /api/admin/products/[id]/variants/[variantId]:`, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
