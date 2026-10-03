import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, "data", "kalyana.db");

const db = new Database(DB_PATH);

console.log("📊 Product Verification");
console.log("=".repeat(70));

const products = db.prepare("SELECT id, name, slug, status FROM products ORDER BY id DESC").all();
console.log(`\n✓ Total products: ${products.length}\n`);

products.forEach(p => {
  console.log(`  ID: ${p.id} | Status: ${p.status.padEnd(10)} | Name: ${p.name}`);
  console.log(`       Slug: ${p.slug}`);
});

console.log("\n" + "=".repeat(70));

// Check if our test products are there
const testProduct5 = db.prepare("SELECT * FROM products WHERE id = ?").get(5);
const testProduct6 = db.prepare("SELECT * FROM products WHERE id = ?").get(6);
const testProduct7 = db.prepare("SELECT * FROM products WHERE id = ?").get(7);

console.log("\n🔍 Checking test products:");
if (testProduct5) {
  console.log(`✓ Product 5: ${testProduct5.name}`);
  console.log(`  - Image stored: ${testProduct5.main_image ? "YES (" + testProduct5.main_image.length + " chars)" : "NO"}`);
}
if (testProduct6) {
  console.log(`✓ Product 6: ${testProduct6.name}`);
  console.log(`  - Image stored: ${testProduct6.main_image ? "YES (" + testProduct6.main_image.length + " chars)" : "NO"}`);
}
if (testProduct7) {
  console.log(`✓ Product 7: ${testProduct7.name}`);
  console.log(`  - Image stored: ${testProduct7.main_image ? "YES (" + testProduct7.main_image.length + " chars)" : "NO"}`);
}

db.close();
console.log("\n✓ Database verification complete");
