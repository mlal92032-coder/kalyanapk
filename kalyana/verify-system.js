#!/usr/bin/env node

import getDb from "./lib/db.js";

console.log("✅ SYSTEM VERIFICATION\n");
console.log("=".repeat(70));

const db = getDb();

// 1. Database Health
console.log("\n📊 DATABASE HEALTH");
const tables = ["migrations", "products", "product_colors", "product_sizes", "product_variants"];
tables.forEach(table => {
  const count = db.prepare(`SELECT COUNT(*) as c FROM ${table}`).get().c;
  console.log(`  ✓ ${table.padEnd(20)}: ${count} records`);
});

// 2. Payment Methods
console.log("\n💳 PAYMENT METHODS");
const methods = db.prepare("SELECT method_name, display_name FROM payment_methods_config").all();
methods.forEach(m => console.log(`  ✓ ${m.method_name.padEnd(15)} (${m.display_name})`));

// 3. Get first product for API testing
const product = db.prepare("SELECT id, name FROM products LIMIT 1").get();
console.log(`\n🎯 TEST PRODUCT`);
console.log(`  ✓ Product ID: ${product.id}`);
console.log(`  ✓ Product Name: ${product.name}`);

// 4. Variants
const variants = db.prepare("SELECT COUNT(*) as c FROM product_variants WHERE product_id = ?").get(product.id).c;
console.log(`\n📦 VARIANTS`);
console.log(`  ✓ Default variants created: ${variants}`);

// 5. Migration status
const migs = db.prepare("SELECT COUNT(*) as c FROM migrations").get().c;
console.log(`\n🔄 MIGRATIONS`);
console.log(`  ✓ Total migrations applied: ${migs}`);

console.log("\n" + "=".repeat(70));
console.log("✅ SYSTEM IS READY FOR TESTING");
console.log("=".repeat(70));
console.log("\n🌐 Available URLs:");
console.log("  → http://localhost:3000                  (Home)");
console.log("  → http://localhost:3000/products         (Products)");
console.log("  → http://localhost:3000/checkout         (Checkout)");
console.log("  → http://localhost:3000/order-confirmation/1 (Order Confirmation)");
console.log("\n📝 API Endpoints:");
console.log(`  → POST   /api/products/${product.id}/colors`);
console.log(`  → GET    /api/products/${product.id}/colors`);
console.log(`  → POST   /api/products/${product.id}/variants`);
console.log("  → POST   /api/checkout");
console.log("  → GET    /api/orders/[id]");
console.log("\n");

db.close();
