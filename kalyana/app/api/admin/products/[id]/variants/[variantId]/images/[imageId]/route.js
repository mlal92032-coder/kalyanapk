import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function DELETE(request, { params }) {
  try {
    const { id, variantId, imageId } = await params;
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

    // Verify image belongs to this product
    const image = db
      .prepare("SELECT id, image_url FROM product_variant_images WHERE products.id = ?")
      .get(imageId, id);

    if (!image) {
      return NextResponse.json({ error: "Image not found." }, { status: 404 });
    }

    // Delete image
    db.prepare("DELETE FROM product_variant_images WHERE products.id = ?").run(imageId);

    logActivity({
      adminEmail: session.email,
      action: "DELETE_VARIANT_IMAGE",
      entityType: "product",
      entityId: parseInt(id),
      details: { variant_id: variantId, image_url: image.image_url },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Error in DELETE /api/products/[id]/variants/[variantId]/images/[imageId]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
