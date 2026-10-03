import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET(request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const db = getDb();
    const offset = (page - 1) * limit;

    const reviews = db
      .prepare(
        `SELECT
           r.id, r.product_id, r.order_id, r.customer_name, r.customer_email,
           r.rating, r.title, r.content, r.status, r.helpful_count,
           r.created_at, r.approved_at, r.rejected_reason,
           p.name as product_name, p.slug as product_slug
         FROM product_reviews r
         JOIN products p ON r.product_id = p.id
         WHERE r.status = ?
         ORDER BY r.created_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(status, limit, offset);

    const totalResult = db
      .prepare("SELECT COUNT(*) as total FROM product_reviews WHERE status = ?")
      .get(status);

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total: totalResult?.total || 0,
        pages: Math.ceil((totalResult?.total || 0) / limit),
      },
    });
  } catch (error) {
    console.error("[API] Error in GET /api/reviews:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
