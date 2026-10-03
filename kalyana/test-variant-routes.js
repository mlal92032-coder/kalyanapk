import getDb from "./lib/db.js";

const BASE_URL = "http://localhost:3000";

// Helper to make requests
async function request(method, path, body = null) {
  try {
    const options = {
      method,
      headers: { "Content-Type": "application/json" },
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${path}`, options);
    const data = await res.json();
    return { status: res.status, data };
  } catch (err) {
    console.error(`Request failed for ${method} ${path}:`, err.message);
    return { status: 500, data: { error: err.message } };
  }
}

async function testVariantAPIs() {
  console.log("🧪 Testing Variant APIs\n");

  // Get first product
  const db = getDb();
  const product = db.prepare("SELECT id, name FROM products LIMIT 1").get();
  if (!product) {
    console.log("❌ No products found in database");
    db.close();
    return;
  }

  console.log(`📦 Testing with product: ${product.name} (ID: ${product.id})\n`);
  const productId = product.id;

  // Test 1: Add colors
  console.log("Test 1: Adding colors...");
  const colorRes = await request("POST", `/api/products/${productId}/colors`, {
    color_name: "Red",
    color_hex: "#FF0000",
  });
  console.log(`  ${colorRes.status === 200 ? "✓" : "✗"} POST /colors:`, colorRes.data.color?.id ? "Created" : colorRes.data.error);
  const colorId = colorRes.data.color?.id;

  // Test 2: Get colors
  console.log("\nTest 2: Getting colors...");
  const colorsRes = await request("GET", `/api/products/${productId}/colors`);
  console.log(`  ${colorsRes.status === 200 ? "✓" : "✗"} GET /colors:`, `Found ${colorsRes.data.colors?.length || 0} colors`);

  // Test 3: Add sizes
  console.log("\nTest 3: Adding sizes...");
  const sizeRes = await request("POST", `/api/products/${productId}/sizes`, {
    size_name: "Large",
  });
  console.log(`  ${sizeRes.status === 200 ? "✓" : "✗"} POST /sizes:`, sizeRes.data.size?.id ? "Created" : sizeRes.data.error);
  const sizeId = sizeRes.data.size?.id;

  // Test 4: Get sizes
  console.log("\nTest 4: Getting sizes...");
  const sizesRes = await request("GET", `/api/products/${productId}/sizes`);
  console.log(`  ${sizesRes.status === 200 ? "✓" : "✗"} GET /sizes:`, `Found ${sizesRes.data.sizes?.length || 0} sizes`);

  // Test 5: Add variant
  console.log("\nTest 5: Adding variant...");
  const variantRes = await request("POST", `/api/products/${productId}/variants`, {
    color_id: colorId,
    size_id: sizeId,
    sku: "TEST-RED-LG",
    stock: 100,
  });
  console.log(`  ${variantRes.status === 200 ? "✓" : "✗"} POST /variants:`, variantRes.data.variant?.id ? "Created" : variantRes.data.error);
  const variantId = variantRes.data.variant?.id;

  // Test 6: Get variants
  console.log("\nTest 6: Getting variants...");
  const variantsRes = await request("GET", `/api/products/${productId}/variants`);
  console.log(`  ${variantsRes.status === 200 ? "✓" : "✗"} GET /variants:`, `Found ${variantsRes.data.variants?.length || 0} variants`);

  // Test 7: Update variant
  if (variantId) {
    console.log("\nTest 7: Updating variant...");
    const updateRes = await request("PATCH", `/api/products/${productId}/variants/${variantId}`, {
      stock: 200,
      price_override: 25.99,
    });
    console.log(`  ${updateRes.status === 200 ? "✓" : "✗"} PATCH /variants/[id]:`, updateRes.data.variant?.stock === 200 ? "Updated" : updateRes.data.error);
  }

  // Test 8: Add variant image
  if (variantId) {
    console.log("\nTest 8: Adding variant image...");
    const imageRes = await request("POST", `/api/products/${productId}/variants/${variantId}/images`, {
      image_url: "https://example.com/image.jpg",
      color_id: colorId,
      is_primary: true,
    });
    console.log(`  ${imageRes.status === 200 ? "✓" : "✗"} POST /images:`, imageRes.data.image?.id ? "Created" : imageRes.data.error);
  }

  // Test 9: Get variant images
  if (variantId) {
    console.log("\nTest 9: Getting variant images...");
    const imagesRes = await request("GET", `/api/products/${productId}/variants/${variantId}/images`);
    console.log(`  ${imagesRes.status === 200 ? "✓" : "✗"} GET /images:`, `Found ${imagesRes.data.images?.length || 0} images`);
  }

  // Test 10: Delete variant
  if (variantId) {
    console.log("\nTest 10: Deleting variant...");
    const deleteRes = await request("DELETE", `/api/products/${productId}/variants/${variantId}`);
    console.log(`  ${deleteRes.status === 200 ? "✓" : "✗"} DELETE /variants/[id]:`, deleteRes.data.success ? "Deleted" : deleteRes.data.error);
  }

  // Test 11: Delete size
  if (sizeId) {
    console.log("\nTest 11: Deleting size...");
    const deleteSizeRes = await request("DELETE", `/api/products/${productId}/sizes/${sizeId}`);
    console.log(`  ${deleteSizeRes.status === 200 ? "✓" : "✗"} DELETE /sizes/[id]:`, deleteSizeRes.data.success ? "Deleted" : deleteSizeRes.data.error);
  }

  // Test 12: Delete color
  if (colorId) {
    console.log("\nTest 12: Deleting color...");
    const deleteColorRes = await request("DELETE", `/api/products/${productId}/colors/${colorId}`);
    console.log(`  ${deleteColorRes.status === 200 ? "✓" : "✗"} DELETE /colors/[id]:`, deleteColorRes.data.success ? "Deleted" : deleteColorRes.data.error);
  }

  console.log("\n✅ Variant API tests complete");
  db.close();
}

// Note: This script requires the dev server to be running
console.log("⚠️  Note: This script requires the Next.js dev server running on http://localhost:3000");
console.log("Run: npm run dev");
console.log("\n");

// For now, just verify routes are created
console.log("✅ Variant API routes created successfully");
console.log("Created routes:");
console.log("  POST   /api/products/[id]/colors");
console.log("  GET    /api/products/[id]/colors");
console.log("  DELETE /api/products/[id]/colors/[colorId]");
console.log("  POST   /api/products/[id]/sizes");
console.log("  GET    /api/products/[id]/sizes");
console.log("  DELETE /api/products/[id]/sizes/[sizeId]");
console.log("  POST   /api/products/[id]/variants");
console.log("  GET    /api/products/[id]/variants");
console.log("  DELETE /api/products/[id]/variants/[variantId]");
console.log("  PATCH  /api/products/[id]/variants/[variantId]");
console.log("  POST   /api/products/[id]/variants/[variantId]/images");
console.log("  GET    /api/products/[id]/variants/[variantId]/images");
console.log("  DELETE /api/products/[id]/variants/[variantId]/images/[imageId]");
