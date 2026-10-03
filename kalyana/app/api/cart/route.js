import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getOrCreateCartId, attachCartCookie } from "@/lib/cart";
import { priceLines } from "@/lib/pricing";

async function buildCartResponse(cartId) {
  const db = getDb();
  const items = db
    .prepare(`
      SELECT
        ci.product_id as productId,
        ci.variant_id as variantId,
        ci.color_name as colorName,
        ci.size_name as sizeName,
        ci.quantity
      FROM cart_items ci
      WHERE ci.cart_id = ?
    `)
    .all(cartId);
  const { lines, subtotal } = priceLines(items);
  return { items: lines, subtotal };
}

export async function GET() {
  const { cartId, sid } = await getOrCreateCartId();
  const data = await buildCartResponse(cartId);
  const res = NextResponse.json(data);
  return attachCartCookie(res, sid);
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { productId, quantity, variantId } = body;

  if (!productId || !quantity || quantity < 1) {
    return NextResponse.json({ error: "productId and a positive quantity are required." }, { status: 400 });
  }

  const db = getDb();
  const product = db
    .prepare("SELECT * FROM products WHERE id = ? AND status = 'published'")
    .get(productId);
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  // Validate variant if provided
  let colorName = null;
  let sizeName = null;
  let variantSku = null;
  if (variantId) {
    const variant = db
      .prepare(`
        SELECT pv.id, pv.sku, pc.color_name, ps.size_name
        FROM product_variants pv
        LEFT JOIN product_colors pc ON pv.color_id = pc.id
        LEFT JOIN product_sizes ps ON pv.size_id = ps.id
        WHERE pv.id = ? AND pv.product_id = ?
      `)
      .get(variantId, productId);
    if (!variant) {
      return NextResponse.json({ error: "Variant not found for this product." }, { status: 404 });
    }
    colorName = variant.color_name;
    sizeName = variant.size_name;
    variantSku = variant.sku;
  }

  const { cartId, sid } = await getOrCreateCartId();

  // Look for existing cart item with same product+variant combination
  const existing = db
    .prepare(`
      SELECT * FROM cart_items
      WHERE cart_id = ? AND product_id = ? AND (
        (variant_id IS NULL AND ? IS NULL) OR variant_id = ?
      )
    `)
    .get(cartId, productId, variantId, variantId);

  const qty = Math.max(1, parseInt(quantity, 10));

  if (existing) {
    db.prepare("UPDATE cart_items SET quantity = ? WHERE id = ?").run(qty, existing.id);
  } else {
    db.prepare(`
      INSERT INTO cart_items (cart_id, product_id, variant_id, color_name, size_name, quantity)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      cartId, productId, variantId || null, colorName, sizeName, qty
    );
  }

  const data = await buildCartResponse(cartId);
  const res = NextResponse.json(data);
  return attachCartCookie(res, sid);
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const variantId = searchParams.get("variantId");
  const { cartId, sid } = await getOrCreateCartId();
  const db = getDb();

  if (productId && variantId) {
    // Delete specific variant of product
    db.prepare("DELETE FROM cart_items WHERE cart_id = ? AND product_id = ? AND variant_id = ?").run(cartId, productId, variantId);
  } else if (productId) {
    // Delete all variants of product
    db.prepare("DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?").run(cartId, productId);
  } else {
    // Clear entire cart
    db.prepare("DELETE FROM cart_items WHERE cart_id = ?").run(cartId);
  }

  const data = await buildCartResponse(cartId);
  const res = NextResponse.json(data);
  return attachCartCookie(res, sid);
}
