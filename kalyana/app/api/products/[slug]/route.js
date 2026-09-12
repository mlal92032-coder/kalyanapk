import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getBulkTiers, resolveUnitPrice } from "@/lib/pricing";

export async function GET(request, { params }) {
  const { slug } = await params;
  const db = getDb();

  const product = db
    .prepare(
      `SELECT p.*, c.name as category_name, c.slug as category_slug,
              s.name as supplier_name, s.slug as supplier_slug, s.verified as supplier_verified,
              s.location as supplier_location
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       WHERE p.slug = ? AND p.status = 'published'`
    )
    .get(slug);

  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const bulk_pricing = getBulkTiers(product.id);
  const { searchParams } = new URL(request.url);
  const qty = Number(searchParams.get("qty")) || product.moq || 1;
  const unitPrice = resolveUnitPrice(product, qty);

  return NextResponse.json({
    product: { ...product, images: JSON.parse(product.images || "[]") },
    bulk_pricing,
    quote: {
      quantity: qty,
      unitPrice,
      total: Math.round(unitPrice * qty * 100) / 100,
    },
  });
}
