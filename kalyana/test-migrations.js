import getDb from "./lib/db.js";

console.log("Initializing database with migrations...");
const db = getDb();
console.log("✅ Database initialized");

// Check migrations table
const migrations = db.prepare("SELECT name FROM migrations ORDER BY name").all();
console.log(`\nApplied Migrations: ${migrations.length}`);
migrations.forEach(m => console.log(`  ✓ ${m.name}`));

// Check new tables
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

console.log(`\nNew Tables Created: ${tables.length}`);
for (const table of tables) {
  try {
    const schema = db.pragma(`table_info(${table})`);
    console.log(`  ✓ ${table} (${schema.length} columns)`);
  } catch (err) {
    console.log(`  ✗ ${table} - ERROR: ${err.message}`);
  }
}

// Check products table has_variants column
const productSchema = db.pragma("table_info(products)");
const hasCols = productSchema.map(c => c.name);
console.log(`\nProducts Table Modifications:`);
console.log(`  ✓ has_variants column: ${hasCols.includes("has_variants") ? "YES" : "NO"}`);

// Check orders table modifications
const orderSchema = db.pragma("table_info(orders)");
const orderCols = orderSchema.map(c => c.name);
console.log(`\nOrders Table Modifications:`);
console.log(`  ✓ gateway_transaction_id: ${orderCols.includes("gateway_transaction_id") ? "YES" : "NO"}`);
console.log(`  ✓ payment_reference: ${orderCols.includes("payment_reference") ? "YES" : "NO"}`);
console.log(`  ✓ notes: ${orderCols.includes("notes") ? "YES" : "NO"}`);

// Check payment methods seeded
const paymentMethods = db.prepare("SELECT COUNT(*) as c FROM payment_methods_config").get().c;
console.log(`\nPayment Methods Configured: ${paymentMethods}`);
const methods = db.prepare("SELECT method_name, display_name FROM payment_methods_config").all();
methods.forEach(m => console.log(`  ✓ ${m.method_name} - ${m.display_name}`));

console.log("\n✅ Migration verification complete");
db.close();
