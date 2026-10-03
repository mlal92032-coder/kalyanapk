import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, reason } = body;

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "action must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    const db = getDb();

    const review = db
      .prepare("SELECT * FROM product_reviews WHERE id = ?")
      .get(id);

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    if (review.status !== "pending") {
      return NextResponse.json(
        { error: `Review is already ${review.status}` },
        { status: 409 }
      );
    }

    if (action === "approve") {
      db.prepare(
        `UPDATE product_reviews
         SET status = 'approved', approved_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      ).run(id);

      logActivity({
        adminEmail: session.email,
        action: "APPROVE_REVIEW",
        entityType: "product_review",
        entityId: id,
        details: {
          product_id: review.product_id,
          customer_email: review.customer_email,
          rating: review.rating,
        },
      });
    } else {
      if (!reason || reason.trim().length === 0) {
        return NextResponse.json(
          { error: "reason is required for rejection" },
          { status: 400 }
        );
      }

      db.prepare(
        `UPDATE product_reviews
         SET status = 'rejected', rejected_reason = ?
         WHERE id = ?`
      ).run(reason, id);

      logActivity({
        adminEmail: session.email,
        action: "REJECT_REVIEW",
        entityType: "product_review",
        entityId: id,
        details: {
          product_id: review.product_id,
          customer_email: review.customer_email,
          reason,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Review ${action}ed successfully`,
    });
  } catch (error) {
    console.error("[API] Error in PATCH /api/reviews/[id]:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();

    const review = db
      .prepare("SELECT * FROM product_reviews WHERE id = ?")
      .get(id);

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    db.prepare("DELETE FROM product_reviews WHERE id = ?").run(id);

    logActivity({
      adminEmail: session.email,
      action: "DELETE_REVIEW",
      entityType: "product_review",
      entityId: id,
      details: {
        product_id: review.product_id,
        customer_email: review.customer_email,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("[API] Error in DELETE /api/reviews/[id]:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
