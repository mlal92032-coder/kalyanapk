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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const db = getDb();
    const offset = (page - 1) * limit;

    const banners = db
      .prepare(
        `SELECT * FROM banners ORDER BY position ASC, created_at DESC LIMIT ? OFFSET ?`
      )
      .all(limit, offset);

    const totalResult = db
      .prepare("SELECT COUNT(*) as total FROM banners")
      .get();

    return NextResponse.json({
      banners,
      pagination: {
        page,
        limit,
        total: totalResult?.total || 0,
        pages: Math.ceil((totalResult?.total || 0) / limit),
      },
    });
  } catch (error) {
    console.error("[API] Error in GET /api/banners:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, image_url, link_url, position, status } = body;

    if (!title || !image_url) {
      return NextResponse.json(
        { error: "title and image_url are required" },
        { status: 400 }
      );
    }

    const db = getDb();

    const result = db
      .prepare(
        `INSERT INTO banners (title, description, image_url, link_url, position, status)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(title, description || null, image_url, link_url || null, position || 0, status || "active");

    logActivity({
      adminEmail: session.email,
      action: "CREATE_BANNER",
      entityType: "banner",
      entityId: result.lastInsertRowid,
      details: { title },
    });

    return NextResponse.json(
      { success: true, bannerId: result.lastInsertRowid },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API] Error in POST /api/banners:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
