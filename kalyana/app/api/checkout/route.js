import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getOrCreateCartId, attachCartCookie } from "@/lib/cart";
import { priceLines } from "@/lib/pricing";
import { logActivity } from "@/lib/activity";

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
  const { customer_name, customer_email, customer_phone, shipping_address } = body;

  if (!customer_name || !customer_email || !shipping_address) {
    return NextResponse.json(
      { error: "Name, email, and shipping address are required." },
      { status: 400 }
    );
  }

  const db = getDb();
  const { cartId, sid } = await getOrCreateCartId();

  const cartItems = db
    .prepare("SELECT product_id as productId, quantity FROM cart_items WHERE cart_id = ?")
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
          subtotal, shipping_fee, tax, discount, total, payment_status, order_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending')`
      )
      .run(orderNumber, customer_name, customer_email, customer_phone || null, shipping_address,
        subtotal, shippingFee, tax, discount, total);

    const orderId = orderResult.lastInsertRowid;

    const insertItem = db.prepare(
      `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, line_total)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    const decrementStock = db.prepare(
      "UPDATE products SET stock = stock - ? WHERE id = ?"
    );
    const logInventory = db.prepare(
      `INSERT INTO inventory_logs (product_id, previous_qty, new_qty, reason, admin_email)
       VALUES (?, ?, ?, ?, ?)`
    );

    for (const line of lines) {
      insertItem.run(orderId, line.productId, line.name, line.quantity, line.unitPrice, line.lineTotal);
      decrementStock.run(line.quantity, line.productId);
      logInventory.run(line.productId, line.stock, line.stock - line.quantity, `Order ${orderNumber}`, "system");
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
