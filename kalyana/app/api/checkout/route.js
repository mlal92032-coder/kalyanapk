import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getOrCreateCartId, attachCartCookie } from "@/lib/cart";
import { priceLines } from "@/lib/pricing";
import { logActivity } from "@/lib/activity";
import { saveBase64Image, isBase64 } from "@/lib/fileStorage";

const SHIPPING_FLAT_FEE = 15;
const TAX_RATE = 0; // configurable in a real deployment via Settings

function generateOrderNumber() {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  const rand = Math.floor(Math.random() * 900 + 100);
  return `KLY-${stamp}-${rand}`;
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const {
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    payment_method,
    transaction_id,
    payment_screenshot_url,
  } = body;

  if (!customer_name || !customer_email || !shipping_address) {
    return NextResponse.json(
      { error: "Name, email, and shipping address are required." },
      { status: 400 }
    );
  }

  // Validate payment information
  if (!payment_method) {
    return NextResponse.json(
      { error: "Payment method is required." },
      { status: 400 }
    );
  }

  const validPaymentMethods = ["easypaisa", "jazzcash", "bank", "cod"];
  if (!validPaymentMethods.includes(payment_method)) {
    return NextResponse.json(
      { error: "Invalid payment method." },
      { status: 400 }
    );
  }

  // For manual payment methods, transaction ID and screenshot are required
  if (["easypaisa", "jazzcash", "bank"].includes(payment_method)) {
    if (!transaction_id || !transaction_id.trim()) {
      return NextResponse.json(
        { error: "Transaction ID is required for this payment method." },
        { status: 400 }
      );
    }
    if (!payment_screenshot_url) {
      return NextResponse.json(
        { error: "Payment screenshot is required for this payment method." },
        { status: 400 }
      );
    }
  }

  // Convert Base64 screenshot to file if needed
  let screenshotUrl = payment_screenshot_url;
  if (payment_screenshot_url && isBase64(payment_screenshot_url)) {
    try {
      screenshotUrl = saveBase64Image(payment_screenshot_url, `payment-${Date.now()}.jpg`);
    } catch (err) {
      console.error("[Checkout] Error saving screenshot:", err.message);
      // Fall back to storing Base64 if file save fails
      screenshotUrl = payment_screenshot_url;
    }
  }

  const db = getDb();
  const { cartId, sid } = await getOrCreateCartId();

  const cartItems = db
    .prepare(`
      SELECT
        product_id as productId,
        variant_id as variantId,
        color_name as colorName,
        size_name as sizeName,
        quantity
      FROM cart_items WHERE cart_id = ?
    `)
    .all(cartId);

  if (!cartItems.length) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  // Server re-validates stock + recomputes every price. The browser's
  // numbers are never trusted here.
  const { lines, subtotal } = priceLines(cartItems);

  for (const line of lines) {
    if (line.quantity < line.moq) {
      return NextResponse.json(
        { error: `${line.name} requires a minimum order quantity of ${line.moq}.` },
        { status: 400 }
      );
    }
    if (line.quantity > line.stock) {
      return NextResponse.json(
        { error: `Only ${line.stock} units of ${line.name} are in stock.` },
        { status: 400 }
      );
    }
  }

  const shippingFee = SHIPPING_FLAT_FEE;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const discount = 0;
  const total = Math.round((subtotal + shippingFee + tax - discount) * 100) / 100;
  const orderNumber = generateOrderNumber();

  const createOrder = db.transaction(() => {
    const orderResult = db
      .prepare(
        `INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, shipping_address,
          subtotal, shipping_fee, tax, discount, total, payment_method, transaction_id, payment_screenshot_url,
          payment_status, order_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_verification', 'pending')`
      )
      .run(
        orderNumber,
        customer_name,
        customer_email,
        customer_phone || null,
        shipping_address,
        subtotal,
        shippingFee,
        tax,
        discount,
        total,
        payment_method,
        transaction_id || null,
        screenshotUrl || null
      );

    const orderId = orderResult.lastInsertRowid;

    const insertItem = db.prepare(
      `INSERT INTO order_items (
        order_id, product_id, product_name, quantity, unit_price, line_total,
        variant_id, color_name, size_name, variant_sku
      )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const decrementStock = db.prepare(
      "UPDATE products SET stock = stock - ? WHERE id = ?"
    );
    const decrementVariantStock = db.prepare(
      "UPDATE product_variants SET stock = stock - ? WHERE id = ?"
    );
    const logInventory = db.prepare(
      `INSERT INTO inventory_logs (product_id, previous_qty, new_qty, reason, admin_email)
       VALUES (?, ?, ?, ?, ?)`
    );

    for (const line of lines) {
      insertItem.run(
        orderId,
        line.productId,
        line.name,
        line.quantity,
        line.unitPrice,
        line.lineTotal,
        line.variantId || null,
        line.colorName || null,
        line.sizeName || null,
        line.sku || null
      );

      // Decrement both product and variant stock if variant exists
      decrementStock.run(line.quantity, line.productId);
      if (line.variantId) {
        decrementVariantStock.run(line.quantity, line.variantId);
      }

      logInventory.run(
        line.productId,
        line.stock,
        line.stock - line.quantity,
        `Order ${orderNumber}`,
        "system"
      );
    }

    db.prepare("DELETE FROM cart_items WHERE cart_id = ?").run(cartId);

    return orderId;
  });

  let orderId;
  try {
    orderId = createOrder();
  } catch (err) {
    return NextResponse.json({ error: "Could not place order. Please try again." }, { status: 500 });
  }

  logActivity({ action: "PLACE_ORDER", entityType: "order", entityId: orderId, details: { orderNumber, total } });

  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
  const res = NextResponse.json({ order });
  return attachCartCookie(res, sid);
}
