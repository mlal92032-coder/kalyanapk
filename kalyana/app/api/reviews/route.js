import { NextResponse } from "next/server";
import getDb from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!productId) {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400 }
      );
    }

    const db = getDb();
    const offset = (page - 1) * limit;

    const reviews = db
      .prepare(
        `SELECT
           id, product_id, customer_name, rating, title, content,
           helpful_count, created_at, approved_at
         FROM product_reviews
         WHERE product_id = ? AND status = 'approved'
         ORDER BY helpful_count DESC, approved_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(productId, limit, offset);

    const totalResult = db
      .prepare(
        "SELECT COUNT(*) as total FROM product_reviews WHERE product_id = ? AND status = 'approved'"
      )
      .get(productId);

    const statsResult = db
      .prepare(
        `SELECT
           AVG(rating) as average_rating,
           COUNT(*) as total_reviews,
           SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
           SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
           SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
           SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
           SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
         FROM product_reviews
         WHERE product_id = ? AND status = 'approved'`
      )
      .get(productId);

    return NextResponse.json({
      reviews,
      stats: {
        averageRating: statsResult?.average_rating ? parseFloat(statsResult.average_rating.toFixed(1)) : 0,
        totalReviews: statsResult?.total_reviews || 0,
        distribution: {
          5: statsResult?.five_star || 0,
          4: statsResult?.four_star || 0,
          3: statsResult?.three_star || 0,
          2: statsResult?.two_star || 0,
          1: statsResult?.one_star || 0,
        },
      },
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

export async function POST(request) {
  try {
    const body = await request.json();
    const { productId, orderId, customerName, customerEmail, rating, title, content } = body;

    if (!productId || !orderId || !customerName || !customerEmail || !rating || !title || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const db = getDb();

    const order = db
      .prepare("SELECT id, customer_email FROM orders WHERE id = ? AND customer_email = ?")
      .get(orderId, customerEmail);

    if (!order) {
      return NextResponse.json(
        { error: "Order not found or email doesn't match" },
        { status: 404 }
      );
    }

    const existingReview = db
      .prepare("SELECT id FROM product_reviews WHERE order_id = ? AND product_id = ?")
      .get(orderId, productId);

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 409 }
      );
    }

    const result = db
      .prepare(
        `INSERT INTO product_reviews
         (product_id, order_id, customer_name, customer_email, rating, title, content, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`
      )
      .run(productId, orderId, customerName, customerEmail, rating, title, content);

    return NextResponse.json(
      {
        success: true,
        message: "Review submitted successfully. It will appear after admin approval.",
        reviewId: result.lastInsertRowid,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API] Error in POST /api/reviews:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
