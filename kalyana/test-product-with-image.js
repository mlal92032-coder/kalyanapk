#!/usr/bin/env node
// Test product creation with a simulated image

import http from "http";
import fs from "fs";

const loginData = JSON.stringify({
  email: "owner@kalyana.test",
  password: "Kalyana@123"
});

// Create a test image (small PNG data URI)
const smallImageDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

// Create a fake larger image
const largeImageDataUrl = "data:image/png;base64," + "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==".repeat(1000);

console.log(`Small image size: ${smallImageDataUrl.length} chars`);
console.log(`Large image size: ${largeImageDataUrl.length} chars`);

let sessionCookie = "";

const loginReq = http.request({
  hostname: "localhost",
  port: 3001,
  path: "/api/login",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(loginData)
  }
}, (res) => {
  let data = "";
  res.on("data", (chunk) => { data += chunk; });
  res.on("end", () => {
    console.log("✓ Login successful");

    const setCookie = res.headers["set-cookie"];
    if (setCookie) {
      const match = setCookie[0].match(/kalyana_admin_session=([^;]+)/);
      if (match) {
        sessionCookie = `kalyana_admin_session=${match[1]}`;
        testWithSmallImage();
      }
    }
  });
});

loginReq.write(loginData);
loginReq.end();

function testWithSmallImage() {
  console.log("\n🔧 Test 1: Product with SMALL image");
  console.log("=".repeat(50));

  const productData = JSON.stringify({
    name: "Product with Small Image",
    sku: `TEST-IMG-S-${Date.now()}`,
    base_price: 500,
    currency: "PKR",
    moq: 1,
    stock: 100,
    main_image: smallImageDataUrl,
    status: "draft",
    bulk_pricing: []
  });

  console.log(`Payload size: ${productData.length} bytes`);

  makeRequest(productData, () => {
    testWithLargeImage();
  });
}

function testWithLargeImage() {
  console.log("\n🔧 Test 2: Product with LARGE image");
  console.log("=".repeat(50));

  const productData = JSON.stringify({
    name: "Product with Large Image",
    sku: `TEST-IMG-L-${Date.now()}`,
    base_price: 500,
    currency: "PKR",
    moq: 1,
    stock: 100,
    main_image: largeImageDataUrl,
    status: "draft",
    bulk_pricing: []
  });

  console.log(`Payload size: ${productData.length} bytes`);

  makeRequest(productData, () => {
    console.log("\n✓ All tests complete");
    process.exit(0);
  });
}

function makeRequest(productData, callback) {
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

  const req = http.request(productOptions, (res) => {
    let data = "";
    res.on("data", (chunk) => { data += chunk; });
    res.on("end", () => {
      console.log(`✓ Response status: ${res.statusCode}`);
      try {
        const json = JSON.parse(data);
        if (json.product) {
          console.log(`✓ Product created: ID=${json.product.id}`);
          if (json.product.main_image) {
            console.log(`✓ Image saved (${json.product.main_image.length} chars)`);
          } else {
            console.log(`✗ Image NOT saved (main_image is null)`);
          }
        } else if (json.error) {
          console.log(`✗ Error: ${json.error}`);
        }
      } catch (e) {
        console.log("✗ Response is not valid JSON:", data.substring(0, 100));
      }
      callback();
    });
  });

  req.on("error", (e) => {
    console.error("✗ Request error:", e.message);
    process.exit(1);
  });

  req.write(productData);
  req.end();
}
