import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getOrCreateCartId, attachCartCookie } from "@/lib/cart";
import { priceLines } from "@/lib/pricing";

async function buildCartResponse(cartId) {
  const db = getDb();
  const items = db
    .prepare("SELECT product_id as productId, quantity FROM cart_items WHERE cart_id = ?")
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
  const { productId, quantity } = body;

  if (!productId || !quantity || quantity < 1) {
    return NextResponse.json({ error: "productId and a positive quantity are required." }, { status: 400 });
  }

  const db = getDb();
  const product = db
    .prepare("SELECT * FROM products WHERE id = ? AND status = 'published'")
    .get(productId);
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const { cartId, sid } = await getOrCreateCartId();

  const existing = db
    .prepare("SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?")
    .get(cartId, productId);

  const qty = Math.max(1, parseInt(quantity, 10));

  if (existing) {
    db.prepare("UPDATE cart_items SET quantity = ? WHERE id = ?").run(qty, existing.id);
  } else {
    db.prepare("INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)").run(
      cartId, productId, qty
    );
  }

  const data = await buildCartResponse(cartId);
  const res = NextResponse.json(data);
  return attachCartCookie(res, sid);
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const { cartId, sid } = await getOrCreateCartId();
  const db = getDb();

  if (productId) {
    db.prepare("DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?").run(cartId, productId);
  } else {
    db.prepare("DELETE FROM cart_items WHERE cart_id = ?").run(cartId);
  }

  const data = await buildCartResponse(cartId);
  const res = NextResponse.json(data);
  return attachCartCookie(res, sid);
}
