import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { sendPaymentVerified, sendPaymentRejected } from "@/lib/email";

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { action, notes } = body;

    console.log(`[API] PATCH /api/orders/${id}/payment - Action: ${action}`);

    // Validate action
    if (!["verify", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Action must be 'verify' or 'reject'." },
        { status: 400 }
      );
    }

    const db = getDb();
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get order
    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // Check if payment is pending verification
    if (order.payment_status !== "pending_verification") {
      return NextResponse.json(
        { error: `Payment status is already '${order.payment_status}'. Cannot change it.` },
        { status: 400 }
      );
    }

    // Update payment status
    const newStatus = action === "verify" ? "verified" : "rejected";
    const verifiedAt = new Date().toISOString();

    db.prepare(
      `UPDATE orders SET payment_status = ?, payment_notes = ?, verified_by = ?, verified_at = ? WHERE id = ?`
    ).run(newStatus, notes || null, session.email, verifiedAt, id);

    console.log(`[API] Payment ${newStatus} for order ${id} by ${session.email}`);

    // Send email notification
    try {
      if (action === "verify") {
        await sendPaymentVerified(order);
      } else {
        await sendPaymentRejected(order, notes);
      }
    } catch (emailErr) {
      console.error(`[API] Error sending email notification:`, emailErr.message);
    }

    logActivity({
      adminEmail: session.email,
      action: action === "verify" ? "VERIFY_PAYMENT" : "REJECT_PAYMENT",
      entityType: "order",
      entityId: id,
      details: { order_number: order.order_number, payment_method: order.payment_method, notes },
    });

    const updated = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
    return NextResponse.json({ order: updated, success: true });
  } catch (error) {
    console.error(`[API] Error in PATCH /api/orders/[id]/payment:`, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
