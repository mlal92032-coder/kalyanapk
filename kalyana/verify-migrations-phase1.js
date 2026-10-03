import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, "data", "kalyana.db");

const db = new Database(DB_PATH);

console.log("✅ VERIFYING PHASE 1 MIGRATIONS");
console.log("=".repeat(70));

// Check migrations table
const migrations = db.prepare("SELECT name FROM migrations ORDER BY name").all();
console.log(`\n📋 Applied Migrations: ${migrations.length}`);
migrations.forEach(m => console.log(`  ✓ ${m.name}`));

// Check new tables exist
const tables = [
  "product_colors",
  "product_sizes",
  "product_variants",
  "product_variant_images",
  "banners",
  "payment_methods_config",
  "payment_gateway_transactions",
  "email_logs",
];

console.log(`\n📊 New Tables Created: ${tables.length}`);
for (const table of tables) {
  try {
    const schema = db.pragma(`table_info(${table})`);
    console.log(`  ✓ ${table.padEnd(30)} (${schema.length} columns)`);
  } catch (err) {
    console.log(`  ✗ ${table} - ERROR`);
  }
}

// Check products table modifications
const productSchema = db.pragma("table_info(products)");
const productCols = productSchema.map(c => c.name);
console.log(`\n📝 Products Table Modifications:`);
console.log(`  ✓ has_variants column: ${productCols.includes("has_variants") ? "YES" : "NO"}`);

// Check orders table modifications
const orderSchema = db.pragma("table_info(orders)");
const orderCols = orderSchema.map(c => c.name);
console.log(`\n📝 Orders Table Modifications:`);
console.log(`  ✓ gateway_transaction_id: ${orderCols.includes("gateway_transaction_id") ? "YES" : "NO"}`);
console.log(`  ✓ payment_reference: ${orderCols.includes("payment_reference") ? "YES" : "NO"}`);
console.log(`  ✓ notes: ${orderCols.includes("notes") ? "YES" : "NO"}`);

// Check order_items table modifications
const orderItemSchema = db.pragma("table_info(order_items)");
const orderItemCols = orderItemSchema.map(c => c.name);
console.log(`\n📝 Order Items Table Modifications:`);
console.log(`  ✓ variant_id: ${orderItemCols.includes("variant_id") ? "YES" : "NO"}`);
console.log(`  ✓ color_name: ${orderItemCols.includes("color_name") ? "YES" : "NO"}`);
console.log(`  ✓ size_name: ${orderItemCols.includes("size_name") ? "YES" : "NO"}`);
console.log(`  ✓ variant_sku: ${orderItemCols.includes("variant_sku") ? "YES" : "NO"}`);

// Check payment methods seeded
const paymentMethods = db.prepare("SELECT COUNT(*) as c FROM payment_methods_config").get().c;
console.log(`\n💳 Payment Methods Configured: ${paymentMethods}`);
const methods = db.prepare("SELECT method_name, display_name FROM payment_methods_config").all();
methods.forEach(m => console.log(`  ✓ ${m.method_name.padEnd(20)} - ${m.display_name}`));

// Check product variants created for existing products
const productsCount = db.prepare("SELECT COUNT(*) as c FROM products WHERE has_variants = 0").get().c;
const variantsCount = db.prepare("SELECT COUNT(*) as c FROM product_variants").get().c;
console.log(`\n🔄 Data Migration Status:`);
console.log(`  ✓ Simple products: ${productsCount}`);
console.log(`  ✓ Default variants created: ${variantsCount}`);

console.log("\n" + "=".repeat(70));
console.log("✅ PHASE 1 MIGRATION VERIFICATION COMPLETE");

db.close();
