import Stripe from "stripe";
import getDb from "./db.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_");

export async function createPaymentIntent(order) {
  try {
    const amountInCents = Math.round(order.total * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      metadata: {
        orderId: order.id,
        orderNumber: order.order_number,
        customerEmail: order.customer_email,
      },
      description: `Order ${order.order_number} for ${order.customer_name}`,
    });

    // Store in database
    const db = getDb();
    db.prepare(`
      INSERT INTO payment_gateway_transactions
      (order_id, gateway_name, gateway_transaction_id, amount, currency, status, response_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      order.id,
      "stripe",
      paymentIntent.id,
      order.total,
      "USD",
      "pending",
      JSON.stringify({ clientSecret: paymentIntent.client_secret })
    );

    return {
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
    };
  } catch (error) {
    console.error("[Stripe] Error creating payment intent:", error.message);
    throw error;
  }
}

export async function confirmPayment(paymentIntentId) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    const db = getDb();

    if (paymentIntent.status === "succeeded") {
      // Update transaction
      db.prepare(`
        UPDATE payment_gateway_transactions
        SET status = ?, response_json = ?, updated_at = ?
        WHERE gateway_transaction_id = ?
      `).run(
        "succeeded",
        JSON.stringify({ chargeId: paymentIntent.charges.data[0]?.id }),
        new Date().toISOString(),
        paymentIntentId
      );

      // Update order
      db.prepare(`
        UPDATE orders
        SET payment_status = ?, payment_reference = ?, gateway_transaction_id = ?, updated_at = ?
        WHERE id = ?
      `).run(
        "verified",
        paymentIntent.id,
        paymentIntent.id,
        new Date().toISOString(),
        paymentIntent.metadata.orderId
      );

      return { status: "succeeded", orderId: paymentIntent.metadata.orderId };
    }

    return { status: paymentIntent.status, orderId: paymentIntent.metadata.orderId };
  } catch (error) {
    console.error("[Stripe] Error confirming payment:", error.message);
    throw error;
  }
}

export async function handleWebhook(event) {
  try {
    const db = getDb();

    switch (event.type) {
      case "payment_intent.succeeded":
        const pi = event.data.object;
        db.prepare(`
          UPDATE orders
          SET payment_status = ?, updated_at = ?
          WHERE id = ?
        `).run("verified", new Date().toISOString(), pi.metadata.orderId);

        console.log(`[Stripe] Payment succeeded: ${pi.id}`);
        break;

      case "payment_intent.payment_failed":
        const failedPi = event.data.object;
        db.prepare(`
          UPDATE orders
          SET payment_status = ?, updated_at = ?
          WHERE id = ?
        `).run("rejected", new Date().toISOString(), failedPi.metadata.orderId);

        console.log(`[Stripe] Payment failed: ${failedPi.id}`);
        break;

      case "charge.refunded":
        const charge = event.data.object;
        console.log(`[Stripe] Charge refunded: ${charge.id}`);
        break;
    }

    return { received: true };
  } catch (error) {
    console.error("[Stripe] Webhook error:", error.message);
    throw error;
  }
}

export async function refundPayment(paymentIntentId, amount = null) {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
    });

    const db = getDb();
    db.prepare(`
      UPDATE payment_gateway_transactions
      SET status = ?, response_json = ?, updated_at = ?
      WHERE gateway_transaction_id = ?
    `).run(
      "refunded",
      JSON.stringify({ refundId: refund.id }),
      new Date().toISOString(),
      paymentIntentId
    );

    console.log(`[Stripe] Refund created: ${refund.id}`);
    return refund;
  } catch (error) {
    console.error("[Stripe] Error creating refund:", error.message);
    throw error;
  }
}

export function getStripeInstance() {
  return stripe;
}
