import Database from "better-sqlite3";
import path from "path";
import bcrypt from "bcryptjs";

// Reference the shared database from the main app
const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), "..", "kalyana", "data", "kalyana.db");

let db;

function getDb() {
  if (db) return db;
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  init(db);
  return db;
}

function init(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'owner',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      parent_id INTEGER,
      image TEXT,
      status TEXT NOT NULL DEFAULT 'published', -- published | hidden
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      logo TEXT,
      description TEXT,
      location TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      years_in_business INTEGER,
      verified INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active', -- active | suspended
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      sku TEXT UNIQUE,
      category_id INTEGER,
      supplier_id INTEGER,
      description TEXT,
      short_description TEXT,
      base_price REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      moq INTEGER NOT NULL DEFAULT 1,
      max_quantity INTEGER,
      stock INTEGER NOT NULL DEFAULT 0,
      low_stock_threshold INTEGER NOT NULL DEFAULT 10,
      main_image TEXT,
      images TEXT, -- JSON array of image urls
      status TEXT NOT NULL DEFAULT 'draft', -- draft | published | hidden | archived
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS bulk_pricing (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      min_qty INTEGER NOT NULL,
      max_qty INTEGER, -- NULL means unbounded (500+)
      price REAL NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      phone TEXT,
      country TEXT,
      status TEXT NOT NULL DEFAULT 'active', -- active | suspended
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS carts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      customer_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cart_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT,
      shipping_address TEXT,
      subtotal REAL NOT NULL,
      shipping_fee REAL NOT NULL DEFAULT 0,
      tax REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'pending', -- pending | paid | failed | refunded
      order_status TEXT NOT NULL DEFAULT 'pending', -- pending|confirmed|processing|packed|shipped|delivered|cancelled|refunded
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      line_total REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS inventory_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      previous_qty INTEGER NOT NULL,
      new_qty INTEGER NOT NULL,
      reason TEXT,
      admin_email TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_email TEXT,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      details TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  seed(db);
}

const DEFAULT_SETTINGS = {
  business_name: "Kalyana",
  hero_heading: "Global Products. Trusted Suppliers.",
  hero_subheading: "Source bulk-ready products directly from verified suppliers, at the right price for the quantity you need.",
  hero_button_label: "Browse Products",
  hero_button_link: "/products",
  contact_email: "support@kalyana.test",
  contact_phone: "+92 300 1234567",
  contact_whatsapp: "+92 300 1234567",
  contact_address: "Karachi, Sindh, Pakistan",
  footer_text: "Kalyana is a B2B marketplace connecting bulk buyers with verified suppliers worldwide.",
};

function seed(db) {
  const settingsCount = db.prepare("SELECT COUNT(*) as c FROM settings").get().c;
  if (settingsCount === 0) {
    const insertSetting = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      insertSetting.run(key, value);
    }
  }

  const adminCount = db.prepare("SELECT COUNT(*) as c FROM admin_users").get().c;
  if (adminCount === 0) {
    const hash = bcrypt.hashSync("Kalyana@123", 10);
    db.prepare(
      "INSERT INTO admin_users (name, email, password_hash, role) VALUES (?, ?, ?, ?)"
    ).run("Owner", "owner@kalyana.test", hash, "owner");
  }

  const catCount = db.prepare("SELECT COUNT(*) as c FROM categories").get().c;
  if (catCount === 0) {
    const insertCat = db.prepare(
      "INSERT INTO categories (name, slug, parent_id, image, status, sort_order) VALUES (?, ?, ?, ?, 'published', ?)"
    );
    const fashion = insertCat.run("Fashion", "fashion", null, null, 1).lastInsertRowid;
    const electronics = insertCat.run("Electronics", "electronics", null, null, 2).lastInsertRowid;
    const home = insertCat.run("Home & Garden", "home-garden", null, null, 3).lastInsertRowid;
    insertCat.run("Men's Clothing", "mens-clothing", fashion, null, 1);
    insertCat.run("Mobile Accessories", "mobile-accessories", electronics, null, 1);

    const supplierCount = db.prepare("SELECT COUNT(*) as c FROM suppliers").get().c;
    let supplierId;
    if (supplierCount === 0) {
      supplierId = db
        .prepare(
          `INSERT INTO suppliers (name, slug, description, location, contact_email, contact_phone, years_in_business, verified, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'active')`
        )
        .run(
          "Kalyana Textiles Co.",
          "kalyana-textiles-co",
          "Manufacturer of premium cotton apparel for global bulk buyers.",
          "Karachi, Pakistan",
          "sales@kalyanatextiles.test",
          "+92 300 1234567",
          8
        ).lastInsertRowid;
    } else {
      supplierId = db.prepare("SELECT id FROM suppliers LIMIT 1").get().id;
    }

    const insertProduct = db.prepare(`
      INSERT INTO products (name, slug, sku, category_id, supplier_id, description, short_description,
        base_price, currency, moq, max_quantity, stock, low_stock_threshold, main_image, images, status)
      VALUES (@name, @slug, @sku, @category_id, @supplier_id, @description, @short_description,
        @base_price, @currency, @moq, @max_quantity, @stock, @low_stock_threshold, @main_image, @images, @status)
    `);

    const p1 = insertProduct.run({
      name: "Premium Cotton T-Shirt",
      slug: "premium-cotton-t-shirt",
      sku: "KLY-TSHIRT-001",
      category_id: fashion,
      supplier_id: supplierId,
      description:
        "100% combed cotton t-shirt, available in bulk quantities for retailers and distributors. Soft, durable, and pre-shrunk fabric.",
      short_description: "Bulk-ready premium cotton t-shirt.",
      base_price: 10,
      currency: "USD",
      moq: 1,
      max_quantity: null,
      stock: 10000,
      low_stock_threshold: 200,
      main_image: null,
      images: JSON.stringify([]),
      status: "published",
    }).lastInsertRowid;

    const p2 = insertProduct.run({
      name: "Premium Shoes",
      slug: "premium-shoes",
      sku: "KLY-SHOES-001",
      category_id: fashion,
      supplier_id: supplierId,
      description:
        "Durable everyday shoes manufactured for wholesale distribution, comfortable sole and reinforced stitching.",
      short_description: "Wholesale-ready everyday shoes.",
      base_price: 20,
      currency: "USD",
      moq: 10,
      max_quantity: null,
      stock: 10000,
      low_stock_threshold: 200,
      main_image: null,
      images: JSON.stringify([]),
      status: "published",
    }).lastInsertRowid;

    const insertBulk = db.prepare(
      "INSERT INTO bulk_pricing (product_id, min_qty, max_qty, price) VALUES (?, ?, ?, ?)"
    );
    insertBulk.run(p1, 1, 9, 10);
    insertBulk.run(p1, 10, 49, 8);
    insertBulk.run(p1, 50, 99, 6);
    insertBulk.run(p1, 100, 499, 5);
    insertBulk.run(p1, 500, null, 4);

    insertBulk.run(p2, 10, 49, 20);
    insertBulk.run(p2, 50, 99, 18);
    insertBulk.run(p2, 100, 499, 15);
    insertBulk.run(p2, 500, null, 12);
  }
}

export default getDb;
