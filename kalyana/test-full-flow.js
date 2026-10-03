#!/usr/bin/env node
// Complete test of the product creation + edit flow

import http from "http";

let sessionCookie = "";

async function httpRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        resolve({ status: res.statusCode, data, headers: res.headers });
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function run() {
  console.log("🧪 FULL PRODUCT CREATION + EDIT FLOW TEST");
  console.log("=".repeat(70));

  // Step 1: Login
  console.log("\n📍 Step 1: LOGIN");
  console.log("-".repeat(70));
  const loginBody = JSON.stringify({ email: "owner@kalyana.test", password: "Kalyana@123" });
  const loginRes = await httpRequest({
    hostname: "localhost", port: 3001, path: "/api/login", method: "POST",
    headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(loginBody) }
  }, loginBody);
  console.log(`✓ Login status: ${loginRes.status}`);

  const setCookie = loginRes.headers["set-cookie"];
  if (setCookie) {
    const match = setCookie[0].match(/kalyana_admin_session=([^;]+)/);
    if (match) sessionCookie = `kalyana_admin_session=${match[1]}`;
  }
  console.log(`✓ Session cookie obtained`);

  // Step 2: Create product
  console.log("\n📍 Step 2: CREATE PRODUCT");
  console.log("-".repeat(70));
  const productBody = JSON.stringify({
    name: "Full Flow Test Product",
    sku: `TEST-FLOW-${Date.now()}`,
    base_price: 777,
    currency: "PKR",
    moq: 2,
    stock: 99,
    status: "draft",
    bulk_pricing: [
      { min_qty: 10, max_qty: 49, price: 750 },
      { min_qty: 50, max_qty: null, price: 700 }
    ]
  });

  const createRes = await httpRequest({
    hostname: "localhost", port: 3001, path: "/api/products", method: "POST",
    headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(productBody), "Cookie": sessionCookie }
  }, productBody);

  console.log(`✓ Create status: ${createRes.status}`);
  const createdProduct = JSON.parse(createRes.data).product;
  console.log(`✓ Product ID: ${createdProduct.id}`);
  console.log(`✓ Product Slug: ${createdProduct.slug}`);
  console.log(`✓ Product Name: ${createdProduct.name}`);

  // Step 3: Fetch product immediately (simulating page load after redirect)
  console.log("\n📍 Step 3: FETCH PRODUCT (simulating edit page load)");
  console.log("-".repeat(70));
  const getRes = await httpRequest({
    hostname: "localhost", port: 3001, path: `/api/products/${createdProduct.id}`, method: "GET",
    headers: { "Cookie": sessionCookie }
  });

  console.log(`✓ Get status: ${getRes.status}`);
  if (getRes.status === 200) {
    const fetchedProduct = JSON.parse(getRes.data);
    console.log(`✓ Fetched product: ${fetchedProduct.product.name}`);
    console.log(`✓ Bulk pricing tiers: ${fetchedProduct.bulk_pricing.length}`);
    fetchedProduct.bulk_pricing.forEach((t, i) => {
      console.log(`  Tier ${i+1}: ${t.min_qty}-${t.max_qty ?? '∞'} = ₨${t.price}`);
    });
  } else {
    console.log(`✗ Failed to fetch: ${getRes.data}`);
  }

  // Step 4: Update product
  console.log("\n📍 Step 4: UPDATE PRODUCT");
  console.log("-".repeat(70));
  const updateBody = JSON.stringify({
    name: "Updated Full Flow Test Product",
    base_price: 888,
    status: "published"
  });

  const updateRes = await httpRequest({
    hostname: "localhost", port: 3001, path: `/api/products/${createdProduct.id}`, method: "PATCH",
    headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(updateBody), "Cookie": sessionCookie }
  }, updateBody);

  console.log(`✓ Update status: ${updateRes.status}`);
  const updatedProduct = JSON.parse(updateRes.data).product;
  console.log(`✓ Updated name: ${updatedProduct.name}`);
  console.log(`✓ Updated price: ₨${updatedProduct.base_price}`);
  console.log(`✓ Updated status: ${updatedProduct.status}`);

  // Step 5: List products (verify it shows in list)
  console.log("\n📍 Step 5: LIST PRODUCTS (verify in listing)");
  console.log("-".repeat(70));
  const listRes = await httpRequest({
    hostname: "localhost", port: 3001, path: "/api/products", method: "GET",
    headers: { "Cookie": sessionCookie }
  });

  console.log(`✓ List status: ${listRes.status}`);
  const products = JSON.parse(listRes.data).products;
  const ourProduct = products.find(p => p.id === createdProduct.id);
  if (ourProduct) {
    console.log(`✓ Product found in list`);
    console.log(`  Name: ${ourProduct.name}`);
    console.log(`  Status: ${ourProduct.status}`);
    console.log(`  Price: ${ourProduct.currency} ${ourProduct.base_price}`);
  } else {
    console.log(`✗ Product NOT found in list!`);
  }

  // Step 6: Check public API (should NOT be visible until published)
  console.log("\n📍 Step 6: CHECK PUBLIC API");
  console.log("-".repeat(70));
  const publicRes = await httpRequest({
    hostname: "localhost", port: 3000, path: `/api/products/${updatedProduct.slug}`, method: "GET"
  });

  console.log(`✓ Public API status: ${publicRes.status}`);
  if (publicRes.status === 200) {
    const publicProduct = JSON.parse(publicRes.data);
    console.log(`✓ Public can see product: ${publicProduct.product.name}`);
    console.log(`✓ Public sees status: ${publicProduct.product.status}`);
  } else {
    console.log(`✗ Public API returned: ${publicRes.status} (Expected 200)`);
  }

  console.log("\n" + "=".repeat(70));
  console.log("✓ FULL FLOW TEST COMPLETE");
  process.exit(0);
}

run().catch(err => {
  console.error("✗ Test error:", err.message);
  process.exit(1);
});
