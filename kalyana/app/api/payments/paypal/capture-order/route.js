import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { captureOrder } from "@/lib/paypal";
import { sendPaymentVerified } from "@/lib/email";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { paypalOrderId, orderId } = body;

    if (!paypalOrderId || !orderId) {
      return NextResponse.json(
        { error: "PayPal order ID and order ID are required." },
        { status: 400 }
      );
    }

    const result = await captureOrder(paypalOrderId);

    if (result.status === "succeeded") {
      const db = getDb();
      const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);

      // Send confirmation email
      try {
        await sendPaymentVerified(order);
      } catch (err) {
        console.error("[API] Error sending email:", err.message);
      }

      console.log(`[API] PayPal payment captured for order ${orderId}`);

      return NextResponse.json({
        success: true,
        message: "Payment captured successfully",
        orderId,
      });
    }

    return NextResponse.json(
      { error: "Payment capture failed", status: result.status },
      { status: 400 }
    );
  } catch (error) {
    console.error("[API] Error in POST /api/payments/paypal/capture-order:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
