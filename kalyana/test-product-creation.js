#!/usr/bin/env node
// Direct test of product creation without UI
import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, "data", "kalyana.db");

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

console.log("📊 Database Status");
console.log("=".repeat(50));

// Check existing products
const productCount = db.prepare("SELECT COUNT(*) as c FROM products").get().c;
console.log(`✓ Total products in DB: ${productCount}`);

// Check schema
console.log("\n📋 Products Table Schema:");
const schema = db.prepare("PRAGMA table_info(products)").all();
schema.forEach(col => {
  console.log(`  - ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}`);
});

// Try to create a test product
console.log("\n🔧 Testing Product Creation");
console.log("=".repeat(50));

try {
  const testProduct = {
    name: "Test Product - Direct Creation",
    slug: "test-product-direct-" + Date.now(),
    sku: "TEST-DIRECT-" + Math.random().toString(36).slice(2, 7),
    category_id: null,
    supplier_id: null,
    description: "Test via direct DB insertion",
    short_description: "Test short desc",
    base_price: 999.99,
    currency: "PKR",
    moq: 1,
    max_quantity: null,
    stock: 50,
    low_stock_threshold: 5,
    main_image: "test-image-url",
    images: "[]",
    status: "draft",
  };

  const insert = db.prepare(`
    INSERT INTO products (name, slug, sku, category_id, supplier_id, description, short_description,
      base_price, currency, moq, max_quantity, stock, low_stock_threshold, main_image, images, status)
    VALUES (@name, @slug, @sku, @category_id, @supplier_id, @description, @short_description,
      @base_price, @currency, @moq, @max_quantity, @stock, @low_stock_threshold, @main_image, @images, @status)
  `);

  const result = insert.run(testProduct);
  console.log(`✓ Insert successful! Product ID: ${result.lastInsertRowid}`);

  // Fetch it back
  const created = db.prepare("SELECT * FROM products WHERE id = ?").get(result.lastInsertRowid);
  console.log(`✓ Verification: Product found in DB`);
  console.log(`  Name: ${created.name}`);
  console.log(`  Slug: ${created.slug}`);
  console.log(`  Price: ${created.base_price}`);
  console.log(`  Status: ${created.status}`);

  // Now try with bulk pricing
  const tierInsert = db.prepare(
    "INSERT INTO bulk_pricing (product_id, min_qty, max_qty, price) VALUES (?, ?, ?, ?)"
  );
  tierInsert.run(result.lastInsertRowid, 10, 49, 900);
  tierInsert.run(result.lastInsertRowid, 50, 99, 850);
  tierInsert.run(result.lastInsertRowid, 100, null, 800);
  console.log(`✓ Bulk pricing tiers inserted successfully`);

  // Fetch tiers back
  const tiers = db.prepare("SELECT * FROM bulk_pricing WHERE product_id = ?").all(result.lastInsertRowid);
  console.log(`✓ Tiers in DB: ${tiers.length}`);
  tiers.forEach(t => {
    console.log(`  - ${t.min_qty}-${t.max_qty ?? '∞'}: ₨${t.price}`);
  });

} catch (error) {
  console.log(`✗ Error: ${error.message}`);
  console.log(error.stack);
}

// Check final count
const finalCount = db.prepare("SELECT COUNT(*) as c FROM products").get().c;
console.log(`\n📊 Final product count: ${finalCount}`);

db.close();
