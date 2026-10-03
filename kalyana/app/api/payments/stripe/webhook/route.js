import { NextResponse } from "next/server";
import { Readable } from "stream";
import Stripe from "stripe";
import { handleWebhook } from "@/lib/stripe";
import { sendPaymentVerified, sendPaymentRejected } from "@/lib/email";
import getDb from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_");
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export async function POST(request) {
  try {
    const body = await buffer(request.body);
    const signature = request.headers.get("stripe-signature");

    if (!signature || !webhookSecret) {
      return NextResponse.json(
        { error: "Missing signature or webhook secret" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("[Webhook] Signature verification failed:", err.message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Handle the event
    const db = getDb();

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.orderId;

      db.prepare(`
        UPDATE orders
        SET payment_status = ?, payment_reference = ?, verified_at = ?, updated_at = ?
        WHERE id = ?
      `).run(
        "verified",
        paymentIntent.id,
        new Date().toISOString(),
        new Date().toISOString(),
        orderId
      );

      // Send email
      const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
      if (order) {
        try {
          await sendPaymentVerified(order);
        } catch (err) {
          console.error("[Webhook] Error sending email:", err.message);
        }
      }

      console.log(`[Webhook] Payment succeeded for order ${orderId}`);
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.orderId;

      db.prepare(`
        UPDATE orders
        SET payment_status = ?, verified_at = ?, updated_at = ?
        WHERE id = ?
      `).run(
        "rejected",
        new Date().toISOString(),
        new Date().toISOString(),
        orderId
      );

      // Send email
      const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
      if (order) {
        try {
          await sendPaymentRejected(order, "Payment processing failed");
        } catch (err) {
          console.error("[Webhook] Error sending email:", err.message);
        }
      }

      console.log(`[Webhook] Payment failed for order ${orderId}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[API] Error in Stripe webhook:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
