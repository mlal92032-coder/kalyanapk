import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { createPaymentIntent } from "@/lib/stripe";

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

    const paymentIntent = await createPaymentIntent(order);

    console.log(`[API] Payment intent created for order ${orderId}`);

    return NextResponse.json({
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.clientSecret,
      amount: paymentIntent.amount,
    });
  } catch (error) {
    console.error("[API] Error in POST /api/payments/stripe/intent:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
