#!/usr/bin/env node
// Test the product creation API via direct HTTP

import http from "http";

const loginData = JSON.stringify({
  email: "owner@kalyana.test",
  password: "Kalyana@123"
});

// First login
const loginOptions = {
  hostname: "localhost",
  port: 3001,
  path: "/api/login",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(loginData)
  }
};

let sessionCookie = "";

const loginReq = http.request(loginOptions, (res) => {
  let data = "";
  res.on("data", (chunk) => { data += chunk; });
  res.on("end", () => {
    console.log("✓ Login response status:", res.statusCode);

    // Extract session cookie
    const setCookie = res.headers["set-cookie"];
    if (setCookie) {
      const match = setCookie[0].match(/kalyana_admin_session=([^;]+)/);
      if (match) {
        sessionCookie = `kalyana_admin_session=${match[1]}`;
        console.log("✓ Session cookie obtained");

        // Now test product creation
        testProductCreation();
      }
    }
  });
});

loginReq.write(loginData);
loginReq.end();

function testProductCreation() {
  const productData = JSON.stringify({
    name: "Test Product via API",
    sku: `TEST-API-${Date.now()}`,
    base_price: 500,
    currency: "PKR",
    moq: 1,
    stock: 100,
    status: "draft",
    bulk_pricing: []
  });

  const productOptions = {
    hostname: "localhost",
    port: 3001,
    path: "/api/products",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(productData),
      "Cookie": sessionCookie
    }
  };

  console.log("\n🔧 Testing Product Creation API");
  console.log("=".repeat(50));

  const productReq = http.request(productOptions, (res) => {
    let data = "";
    res.on("data", (chunk) => { data += chunk; });
    res.on("end", () => {
      console.log(`✓ API response status: ${res.statusCode}`);
      try {
        const json = JSON.parse(data);
        console.log("✓ Response is valid JSON");
        if (json.product) {
          console.log(`✓ Product created:`);
          console.log(`  - ID: ${json.product.id}`);
          console.log(`  - Name: ${json.product.name}`);
          console.log(`  - Slug: ${json.product.slug}`);
          console.log(`  - SKU: ${json.product.sku}`);
        } else if (json.error) {
          console.log(`✗ API Error: ${json.error}`);
        }
      } catch (e) {
        console.log("✗ Response is NOT valid JSON");
        console.log("Response:", data.substring(0, 200));
      }

      console.log("\n✓ Test complete");
      process.exit(0);
    });
  });

  productReq.on("error", (e) => {
    console.error("✗ Request error:", e.message);
    process.exit(1);
  });

  productReq.write(productData);
  productReq.end();
}
