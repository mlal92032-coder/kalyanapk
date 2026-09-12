import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { resolveUnitPrice } from "@/lib/pricing";

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

  const qty = Math.max(1, parseInt(quantity, 10));
  if (product.max_quantity && qty > product.max_quantity) {
    return NextResponse.json(
      { error: `Maximum orderable quantity is ${product.max_quantity}.` },
      { status: 400 }
    );
  }
  if (qty > product.stock) {
    return NextResponse.json(
      { error: `Only ${product.stock} units in stock.` },
      { status: 400 }
    );
  }

  const unitPrice = resolveUnitPrice(product, qty);
  const total = Math.round(unitPrice * qty * 100) / 100;

  return NextResponse.json({ quantity: qty, unitPrice, total, currency: product.currency });
}
