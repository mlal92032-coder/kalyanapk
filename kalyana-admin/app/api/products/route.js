import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { logActivity } from "@/lib/activity";

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(request) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q");

  let sql = `SELECT p.*, c.name as category_name, s.name as supplier_name
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             LEFT JOIN suppliers s ON p.supplier_id = s.id
             WHERE 1=1`;
  const args = [];

  if (status) {
    sql += " AND p.status = ?";
    args.push(status);
  }
  if (q) {
    sql += " AND (p.name LIKE ? OR p.sku LIKE ?)";
    args.push(`%${q}%`, `%${q}%`);
  }
  sql += " ORDER BY p.created_at DESC";

  const products = db.prepare(sql).all(...args);
  return NextResponse.json({ products });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const {
    name, sku, category_id, supplier_id, description, short_description,
    base_price, currency, moq, max_quantity, stock, low_stock_threshold,
    main_image, images, status, bulk_pricing,
  } = body;

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Product name is required." }, { status: 400 });
  }
  if (base_price === undefined || base_price === null || isNaN(Number(base_price))) {
    return NextResponse.json({ error: "A valid base price is required." }, { status: 400 });
  }

  const db = getDb();
  let slug = slugify(name);
  const slugExists = db.prepare("SELECT id FROM products WHERE slug = ?").get(slug);
  if (slugExists) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  const insert = db.prepare(`
    INSERT INTO products (name, slug, sku, category_id, supplier_id, description, short_description,
      base_price, currency, moq, max_quantity, stock, low_stock_threshold, main_image, images, status)
    VALUES (@name, @slug, @sku, @category_id, @supplier_id, @description, @short_description,
      @base_price, @currency, @moq, @max_quantity, @stock, @low_stock_threshold, @main_image, @images, @status)
  `);

  const result = insert.run({
    name: name.trim(),
    slug,
    sku: sku || null,
    category_id: category_id || null,
    supplier_id: supplier_id || null,
    description: description || null,
    short_description: short_description || null,
    base_price: Number(base_price),
    currency: currency || "USD",
    moq: moq ? Number(moq) : 1,
    max_quantity: max_quantity ? Number(max_quantity) : null,
    stock: stock ? Number(stock) : 0,
    low_stock_threshold: low_stock_threshold ? Number(low_stock_threshold) : 10,
    main_image: main_image || null,
    images: JSON.stringify(images || []),
    status: status || "draft",
  });

  const productId = result.lastInsertRowid;

  if (Array.isArray(bulk_pricing) && bulk_pricing.length) {
    const insertTier = db.prepare(
      "INSERT INTO bulk_pricing (product_id, min_qty, max_qty, price) VALUES (?, ?, ?, ?)"
    );
    for (const tier of bulk_pricing) {
      if (tier.min_qty === undefined || tier.price === undefined) continue;
      insertTier.run(productId, Number(tier.min_qty), tier.max_qty === "" || tier.max_qty === null ? null : Number(tier.max_qty), Number(tier.price));
    }
  }

  logActivity({ action: "CREATE_PRODUCT", entityType: "product", entityId: productId, details: { name, status } });

  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(productId);
  return NextResponse.json({ product }, { status: 201 });
}
