import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { createOrder } from "@/lib/paypal";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required." }, { status: 400 });
    }

    const db = getDb();
    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.payment_status !== "pending_verification") {
      return NextResponse.json(
        { error: "Order payment already processed." },
        { status: 400 }
      );
    }

    const returnUrl = `${process.env.APP_URL || "http://localhost:3000"}/payment-success/${orderId}`;
    const cancelUrl = `${process.env.APP_URL || "http://localhost:3000"}/order-confirmation/${orderId}`;

    const paypalOrder = await createOrder(order, returnUrl, cancelUrl);

    console.log(`[API] PayPal order created for order ${orderId}`);

    return NextResponse.json({
      paypalOrderId: paypalOrder.id,
      approvalUrl: paypalOrder.approvalUrl,
    });
  } catch (error) {
    console.error("[API] Error in POST /api/payments/paypal/create-order:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
