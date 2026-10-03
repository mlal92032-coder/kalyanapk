import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

function getPeriodDate(period) {
  const now = new Date();
  switch (period) {
    case "7days":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30days":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "90days":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default:
      return new Date("2000-01-01");
  }
}

export async function GET(request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30days";
    const periodDate = getPeriodDate(period);

    const db = getDb();

    // Revenue stats
    const revenueData = db
      .prepare(
        `SELECT
          SUM(total) as total,
          AVG(total) as avgOrderValue,
          COUNT(*) as orderCount
         FROM orders
         WHERE created_at > ?`
      )
      .get(periodDate.toISOString());

    // Previous period for comparison
    const previousPeriodDate = new Date(
      periodDate.getTime() - (new Date() - periodDate)
    );
    const previousRevenueData = db
      .prepare(
        `SELECT SUM(total) as total FROM orders WHERE created_at > ? AND created_at < ?`
      )
      .get(previousPeriodDate.toISOString(), periodDate.toISOString());

    const revenueChange =
      previousRevenueData.total > 0
        ? ((revenueData.total - previousRevenueData.total) / previousRevenueData.total) *
          100
        : 0;

    // Payment status breakdown
    const paymentStats = db
      .prepare(
        `SELECT
          payment_status,
          COUNT(*) as count
         FROM orders
         WHERE created_at > ?
         GROUP BY payment_status`
      )
      .all(periodDate.toISOString());

    const payments = {
      pending: 0,
      verified: 0,
      rejected: 0,
    };

    paymentStats.forEach((stat) => {
      if (stat.payment_status === "pending_verification") payments.pending = stat.count;
      else if (stat.payment_status === "verified") payments.verified = stat.count;
      else if (stat.payment_status === "rejected") payments.rejected = stat.count;
    });

    // Payment method breakdown
    const methodStats = db
      .prepare(
        `SELECT
          payment_method,
          COUNT(*) as count,
          SUM(total) as amount
         FROM orders
         WHERE created_at > ?
         GROUP BY payment_method`
      )
      .all(periodDate.toISOString());

    const paymentMethods = [
      { method: "cod", displayName: "Cash on Delivery", count: 0, amount: 0 },
      { method: "easypaisa", displayName: "Easypaisa", count: 0, amount: 0 },
      { method: "jazzcash", displayName: "JazzCash", count: 0, amount: 0 },
      { method: "bank", displayName: "Bank Transfer", count: 0, amount: 0 },
      { method: "stripe", displayName: "Stripe", count: 0, amount: 0 },
      { method: "paypal", displayName: "PayPal", count: 0, amount: 0 },
    ];

    methodStats.forEach((stat) => {
      const method = paymentMethods.find((m) => m.method === stat.payment_method);
      if (method) {
        method.count = stat.count;
        method.amount = stat.amount;
      }
    });

    // Top products
    const topProducts = db
      .prepare(
        `SELECT
          p.id,
          p.name,
          COUNT(oi.id) as unitsSold,
          SUM(oi.line_total) as revenue,
          AVG(oi.unit_price) as avgPrice
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         JOIN orders o ON oi.order_id = o.id
         WHERE o.created_at > ?
         GROUP BY p.id
         ORDER BY revenue DESC
         LIMIT 10`
      )
      .all(periodDate.toISOString());

    return NextResponse.json({
      revenue: {
        total: revenueData.total || 0,
        avgOrderValue: revenueData.avgOrderValue || 0,
        change: revenueChange,
      },
      orders: {
        total: revenueData.orderCount || 0,
        conversionRate: 0.85, // Placeholder - would need visitor data
      },
      payments,
      paymentMethods: paymentMethods.filter((m) => m.count > 0),
      topProducts,
    });
  } catch (error) {
    console.error("[API] Error in GET /api/analytics:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
