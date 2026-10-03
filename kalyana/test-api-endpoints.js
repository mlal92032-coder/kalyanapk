import getDb from "./lib/db.js";

const BASE_URL = "http://localhost:3001";

async function testEndpoints() {
  console.log("🧪 TESTING API ENDPOINTS\n");
  console.log("=".repeat(70));

  const db = getDb();

  // Get first product
  const product = db.prepare("SELECT id, name FROM products LIMIT 1").get();
  if (!product) {
    console.log("❌ No products found");
    db.close();
    return;
  }

  console.log(`\n📦 Using product: ${product.name} (ID: ${product.id})\n`);

  const productId = product.id;
  let passed = 0, failed = 0;

  // Helper function
  async function test(method, path, body = null, expected = 200) {
    try {
      const options = {
        method,
        headers: { "Content-Type": "application/json" },
      };
      if (body) options.body = JSON.stringify(body);

      const res = await fetch(`${BASE_URL}${path}`, options);
      const data = await res.json().catch(() => ({}));

      if (res.status === expected || res.ok) {
        console.log(`✓ ${method.padEnd(6)} ${path.substring(0, 50).padEnd(50)}`);
        passed++;
        return { status: res.status, data };
      } else {
        console.log(`✗ ${method.padEnd(6)} ${path.substring(0, 50).padEnd(50)} [${res.status}]`);
        failed++;
        return { status: res.status, data };
      }
    } catch (err) {
      console.log(`✗ ${method.padEnd(6)} ${path.substring(0, 50).padEnd(50)} - ${err.message}`);
      failed++;
      return null;
    }
  }

  // Test endpoints
  console.log("GET ENDPOINTS:");
  await test("GET", `/api/products/${productId}/colors`, null, 200);
  await test("GET", `/api/products/${productId}/sizes`, null, 200);
  await test("GET", `/api/products/${productId}/variants`, null, 200);

  console.log("\nPOST ENDPOINTS (Create):");

  const colorRes = await test("POST", `/api/products/${productId}/colors`, {
    color_name: "Test Red",
    color_hex: "#FF0000",
  }, 200);
  const colorId = colorRes?.data?.color?.id;

  const sizeRes = await test("POST", `/api/products/${productId}/sizes`, {
    size_name: "Large",
  }, 200);
  const sizeId = sizeRes?.data?.size?.id;

  if (colorId && sizeId) {
    const variantRes = await test("POST", `/api/products/${productId}/variants`, {
      color_id: colorId,
      size_id: sizeId,
      sku: "TEST-001",
      stock: 50,
    }, 200);
    const variantId = variantRes?.data?.variant?.id;

    if (variantId) {
      console.log("\nVARIANT OPERATIONS:");
      await test("PATCH", `/api/products/${productId}/variants/${variantId}`, {
        stock: 100,
        price_override: 29.99,
      }, 200);

      await test("POST", `/api/products/${productId}/variants/${variantId}/images`, {
        image_url: "https://example.com/image.jpg",
        color_id: colorId,
        is_primary: true,
      }, 200);

      await test("GET", `/api/products/${productId}/variants/${variantId}/images`, null, 200);

      console.log("\nDELETE ENDPOINTS:");
      await test("DELETE", `/api/products/${productId}/variants/${variantId}`, null, 200);
    }
  }

  // Test checkout (no auth needed for customer)
  console.log("\nCHECKOUT FLOW:");
  const checkoutRes = await test("POST", `/api/checkout`, {
    customer_name: "Test Customer",
    customer_email: "test@example.com",
    customer_phone: "+92 300 1234567",
    shipping_address: "123 Test St, Test City",
    payment_method: "cod",
  }, 400); // Expected 400 because cart is empty, but endpoint exists

  console.log("\n" + "=".repeat(70));
  console.log(`✅ Passed: ${passed} | ❌ Failed: ${failed}`);
  console.log("=".repeat(70));

  db.close();
}

console.log("⚠️  Make sure the dev server is running on http://localhost:3001");
console.log("Run: npm run dev\n");

// Wait for server to be ready
setTimeout(testEndpoints, 1000);
