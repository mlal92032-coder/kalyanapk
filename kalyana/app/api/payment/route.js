import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { processPayment } from "@/lib/payment";

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId, gateway } = body;

    if (!orderId || !gateway) {
      return NextResponse.json(
        { error: "Order ID and payment gateway are required." },
        { status: 400 }
      );
    }

    const db = getDb();
    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.payment_status === "completed") {
      return NextResponse.json(
        { error: "Payment already completed for this order." },
        { status: 400 }
      );
    }

    // Process payment
    const paymentResult = await processPayment({
      amount: order.total,
      orderId: order.id,
      customerEmail: order.customer_email,
      gateway
    });

    // Update order payment status based on gateway
    let paymentStatus = 'pending';
    let orderStatus = 'pending';

    if (gateway === 'jazzcash' || gateway === 'easypaisa') {
      // Online payments complete immediately
      paymentStatus = 'completed';
      orderStatus = 'confirmed';
    } else if (gateway === 'bank') {
      // Bank transfers are pending until verified
      paymentStatus = 'pending';
      orderStatus = 'pending';
    } else if (gateway === 'cod') {
      // COD is pending until delivery
      paymentStatus = 'pending';
      orderStatus = 'confirmed';
    }

    db.prepare(
      "UPDATE orders SET payment_status = ?, order_status = ? WHERE id = ?"
    ).run(paymentStatus, orderStatus, order.id);

    // Store payment transaction in orders table
    db.prepare(
      "UPDATE orders SET payment_method = ?, transaction_id = ? WHERE id = ?"
    ).run(gateway, paymentResult.transactionId, order.id);

    return NextResponse.json({
      success: true,
      payment: paymentResult,
      order: db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId)
    });
  } catch (error) {
    console.error("Payment processing error:", error);
    return NextResponse.json(
      { error: "Payment processing failed. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get("transactionId");
    const gateway = searchParams.get("gateway");

    if (!transactionId || !gateway) {
      return NextResponse.json(
        { error: "Transaction ID and gateway are required." },
        { status: 400 }
      );
    }

    const db = getDb();
    const tx = db
      .prepare(
        "SELECT * FROM payment_transactions WHERE transaction_id = ? AND gateway = ?"
      )
      .get(transactionId, gateway);

    if (!tx) {
      return NextResponse.json(
        { error: "Transaction not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ transaction: tx });
  } catch (error) {
    console.error("Error fetching payment status:", error);
    return NextResponse.json(
      { error: "Could not fetch payment status." },
      { status: 500 }
    );
  }
}
