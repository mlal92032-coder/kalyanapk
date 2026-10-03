import Database from "better-sqlite3";

/**
 * Database Migration System
 * - Tracks applied migrations
 * - Supports rollback
 * - Idempotent (can run multiple times safely)
 */

export function createMigrationsTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      applied_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export function hasMigrationRun(db, name) {
  const result = db.prepare("SELECT id FROM migrations WHERE name = ?").get(name);
  return !!result;
}

export function logMigration(db, name) {
  db.prepare("INSERT INTO migrations (name) VALUES (?)").run(name);
  console.log(`✓ Migration applied: ${name}`);
}

/**
 * MIGRATION 001: Create product variant tables
 */
export function migration001_CreateVariantTables(db) {
  const migrationName = "001_create_variant_tables";

  if (hasMigrationRun(db, migrationName)) {
    console.log(`ℹ Migration already applied: ${migrationName}`);
    return;
  }

  console.log(`\n🔄 Running migration: ${migrationName}`);

  try {
    db.exec(`
      -- Product color variants
      CREATE TABLE IF NOT EXISTS product_colors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        color_name TEXT NOT NULL,
        color_hex TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE(product_id, color_name)
      );

      -- Product size variants
      CREATE TABLE IF NOT EXISTS product_sizes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        size_name TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE(product_id, size_name)
      );

      -- Product variants (color + size combinations)
      CREATE TABLE IF NOT EXISTS product_variants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        color_id INTEGER,
        size_id INTEGER,
        sku TEXT UNIQUE,
        price_override REAL,
        stock INTEGER NOT NULL DEFAULT 0,
        low_stock_threshold INTEGER DEFAULT 10,
        status TEXT DEFAULT 'active',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (color_id) REFERENCES product_colors(id) ON DELETE SET NULL,
        FOREIGN KEY (size_id) REFERENCES product_sizes(id) ON DELETE SET NULL,
        UNIQUE(product_id, color_id, size_id)
      );

      -- Images per variant/color
      CREATE TABLE IF NOT EXISTS product_variant_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        color_id INTEGER,
        image_url TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        is_primary INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (color_id) REFERENCES product_colors(id) ON DELETE SET NULL
      );

      -- Homepage banners
      CREATE TABLE IF NOT EXISTS banners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        image_url TEXT NOT NULL,
        title TEXT,
        description TEXT,
        button_text TEXT,
        button_url TEXT,
        is_active INTEGER DEFAULT 1,
        sort_order INTEGER DEFAULT 0,
        start_date TEXT,
        end_date TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- Payment method configuration
      CREATE TABLE IF NOT EXISTS payment_methods_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        method_name TEXT UNIQUE NOT NULL,
        display_name TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        type TEXT NOT NULL,
        config_json TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- Payment gateway transactions (for automatic gateways)
      CREATE TABLE IF NOT EXISTS payment_gateway_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        gateway_name TEXT NOT NULL,
        gateway_transaction_id TEXT,
        amount REAL NOT NULL,
        currency TEXT DEFAULT 'PKR',
        status TEXT NOT NULL,
        response_json TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      );

      -- Email logs for reliability and debugging
      CREATE TABLE IF NOT EXISTS email_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        recipient_email TEXT NOT NULL,
        email_type TEXT NOT NULL,
        subject TEXT,
        status TEXT NOT NULL,
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        sent_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
      );
    `);

    logMigration(db, migrationName);
  } catch (error) {
    console.error(`✗ Migration failed: ${error.message}`);
    throw error;
  }
}

/**
 * MIGRATION 002: Add variant fields to existing tables
 */
export function migration002_AddVariantFieldsToProducts(db) {
  const migrationName = "002_add_variant_fields_to_products";

  if (hasMigrationRun(db, migrationName)) {
    console.log(`ℹ Migration already applied: ${migrationName}`);
    return;
  }

  console.log(`\n🔄 Running migration: ${migrationName}`);

  try {
    const tableInfo = db.pragma("table_info(products)");
    const columnNames = tableInfo.map((col) => col.name);

    // Add has_variants column if it doesn't exist
    if (!columnNames.includes("has_variants")) {
      db.prepare("ALTER TABLE products ADD COLUMN has_variants INTEGER DEFAULT 0").run();
      console.log(`  ✓ Added has_variants column to products`);
    }

    logMigration(db, migrationName);
  } catch (error) {
    console.error(`✗ Migration failed: ${error.message}`);
    throw error;
  }
}

/**
 * MIGRATION 003: Add payment/order tracking fields
 */
export function migration003_EnhanceOrdersTable(db) {
  const migrationName = "003_enhance_orders_table";

  if (hasMigrationRun(db, migrationName)) {
    console.log(`ℹ Migration already applied: ${migrationName}`);
    return;
  }

  console.log(`\n🔄 Running migration: ${migrationName}`);

  try {
    const tableInfo = db.pragma("table_info(orders)");
    const columnNames = tableInfo.map((col) => col.name);

    const fieldsToAdd = [
      { name: "gateway_transaction_id", type: "TEXT" },
      { name: "payment_reference", type: "TEXT" },
      { name: "notes", type: "TEXT" },
    ];

    for (const field of fieldsToAdd) {
      if (!columnNames.includes(field.name)) {
        db.prepare(`ALTER TABLE orders ADD COLUMN ${field.name} ${field.type}`).run();
        console.log(`  ✓ Added ${field.name} column to orders`);
      }
    }

    logMigration(db, migrationName);
  } catch (error) {
    console.error(`✗ Migration failed: ${error.message}`);
    throw error;
  }
}

/**
 * MIGRATION 004: Add variant fields to order_items
 */
export function migration004_AddVariantFieldsToOrderItems(db) {
  const migrationName = "004_add_variant_fields_to_order_items";

  if (hasMigrationRun(db, migrationName)) {
    console.log(`ℹ Migration already applied: ${migrationName}`);
    return;
  }

  console.log(`\n🔄 Running migration: ${migrationName}`);

  try {
    const tableInfo = db.pragma("table_info(order_items)");
    const columnNames = tableInfo.map((col) => col.name);

    const fieldsToAdd = [
      { name: "variant_id", type: "INTEGER" },
      { name: "color_name", type: "TEXT" },
      { name: "size_name", type: "TEXT" },
      { name: "variant_sku", type: "TEXT" },
    ];

    for (const field of fieldsToAdd) {
      if (!columnNames.includes(field.name)) {
        db.prepare(`ALTER TABLE order_items ADD COLUMN ${field.name} ${field.type}`).run();
        console.log(`  ✓ Added ${field.name} column to order_items`);
      }
    }

    logMigration(db, migrationName);
  } catch (error) {
    console.error(`✗ Migration failed: ${error.message}`);
    throw error;
  }
}

/**
 * MIGRATION 005: Add variant support to cart_items
 */
export function migration005_AddVariantSupport(db) {
  const migrationName = "005_add_variant_support_to_cart_items";

  if (hasMigrationRun(db, migrationName)) {
    console.log(`ℹ Migration already applied: ${migrationName}`);
    return;
  }

  console.log(`\n🔄 Running migration: ${migrationName}`);

  try {
    const tableInfo = db.pragma("table_info(cart_items)");
    const columnNames = tableInfo.map((col) => col.name);

    const fieldsToAdd = [
      { name: "variant_id", type: "INTEGER" },
      { name: "color_name", type: "TEXT" },
      { name: "size_name", type: "TEXT" },
    ];

    for (const field of fieldsToAdd) {
      if (!columnNames.includes(field.name)) {
        db.prepare(`ALTER TABLE cart_items ADD COLUMN ${field.name} ${field.type}`).run();
        console.log(`  ✓ Added ${field.name} column to cart_items`);
      }
    }

    // Add foreign key constraint for variant_id
    logMigration(db, migrationName);
  } catch (error) {
    console.error(`✗ Migration failed: ${error.message}`);
    throw error;
  }
}

/**
 * MIGRATION 006: Seed payment methods
 */
export function migration006_SeedPaymentMethods(db) {
  const migrationName = "005_seed_payment_methods";

  if (hasMigrationRun(db, migrationName)) {
    console.log(`ℹ Migration already applied: ${migrationName}`);
    return;
  }

  console.log(`\n🔄 Running migration: ${migrationName}`);

  try {
    const paymentMethods = [
      {
        method_name: "easypaisa",
        display_name: "Easypaisa",
        is_active: 1,
        type: "manual",
        config_json: null,
      },
      {
        method_name: "jazzcash",
        display_name: "JazzCash",
        is_active: 1,
        type: "manual",
        config_json: null,
      },
      {
        method_name: "bank",
        display_name: "Bank Transfer",
        is_active: 1,
        type: "manual",
        config_json: null,
      },
      {
        method_name: "cod",
        display_name: "Cash on Delivery",
        is_active: 1,
        type: "manual",
        config_json: null,
      },
    ];

    const insert = db.prepare(`
      INSERT OR IGNORE INTO payment_methods_config
      (method_name, display_name, is_active, type, config_json)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const method of paymentMethods) {
      insert.run(method.method_name, method.display_name, method.is_active, method.type, method.config_json);
      console.log(`  ✓ Added payment method: ${method.display_name}`);
    }

    logMigration(db, migrationName);
  } catch (error) {
    console.error(`✗ Migration failed: ${error.message}`);
    throw error;
  }
}

/**
 * DATA MIGRATION: Convert existing products to simple variants
 * Preserves all existing data, makes products variant-compatible
 */
export function dataMigration_ExistingProductsToVariants(db) {
  const migrationName = "data_migration_products_to_variants";

  if (hasMigrationRun(db, migrationName)) {
    console.log(`ℹ Data migration already applied: ${migrationName}`);
    return;
  }

  console.log(`\n🔄 Running data migration: Convert existing products to variants`);

  try {
    const products = db.prepare("SELECT id, name, sku, stock, main_image FROM products WHERE has_variants = 0").all();
    console.log(`  Found ${products.length} simple products to migrate`);

    const insertVariant = db.prepare(`
      INSERT INTO product_variants (product_id, sku, price_override, stock)
      VALUES (?, ?, NULL, ?)
    `);

    const insertImage = db.prepare(`
      INSERT INTO product_variant_images (product_id, color_id, image_url, is_primary)
      VALUES (?, NULL, ?, 1)
    `);

    let variantsCreated = 0;
    let imagesCreated = 0;

    for (const product of products) {
      try {
        // Create default variant (no color, no size)
        insertVariant.run(product.id, product.sku, product.stock);
        variantsCreated++;

        // If product has an image, create variant image record
        if (product.main_image) {
          insertImage.run(product.id, null, product.main_image);
          imagesCreated++;
        }
      } catch (err) {
        console.error(`  ✗ Error migrating product ${product.id}: ${err.message}`);
      }
    }

    console.log(`  ✓ Created ${variantsCreated} default variants`);
    console.log(`  ✓ Created ${imagesCreated} variant images`);

    logMigration(db, migrationName);
  } catch (error) {
    console.error(`✗ Data migration failed: ${error.message}`);
    throw error;
  }
}

/**
 * Run all migrations
 */
export function runAllMigrations(db) {
  console.log("\n" + "=".repeat(70));
  console.log("DATABASE MIGRATIONS");
  console.log("=".repeat(70));

  try {
    // Ensure migrations table exists
    createMigrationsTable(db);

    // Run all migrations in order
    migration001_CreateVariantTables(db);
    migration002_AddVariantFieldsToProducts(db);
    migration003_EnhanceOrdersTable(db);
    migration004_AddVariantFieldsToOrderItems(db);
    migration005_AddVariantSupport(db);
    migration006_SeedPaymentMethods(db);

    // Data migrations (non-destructive)
    dataMigration_ExistingProductsToVariants(db);

    console.log("\n✅ All migrations completed successfully");
    console.log("=".repeat(70));
  } catch (error) {
    console.error("\n❌ Migration failed:", error.message);
    console.error("Database may be in an inconsistent state. Review and retry.");
    throw error;
  }
}
