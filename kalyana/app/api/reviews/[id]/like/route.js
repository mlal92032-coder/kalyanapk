import { NextResponse } from "next/server";
import getDb from "@/lib/db";

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    const db = getDb();

    const review = db
      .prepare("SELECT id FROM product_reviews WHERE id = ? AND status = 'approved'")
      .get(id);

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    try {
      db.prepare(
        "INSERT INTO review_likes (review_id, session_id) VALUES (?, ?)"
      ).run(id, sessionId);

      const updated = db
        .prepare("SELECT helpful_count FROM product_reviews WHERE id = ?")
        .get(id);

      db.prepare("UPDATE product_reviews SET helpful_count = helpful_count + 1 WHERE id = ?").run(id);

      return NextResponse.json({
        success: true,
        helpfulCount: (updated?.helpful_count || 0) + 1,
      });
    } catch (error) {
      if (error.message.includes("UNIQUE constraint failed")) {
        return NextResponse.json(
          { error: "You have already marked this review as helpful" },
          { status: 409 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("[API] Error in POST /api/reviews/[id]/like:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
