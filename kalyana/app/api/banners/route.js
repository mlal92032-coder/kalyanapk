import { NextResponse } from "next/server";
import getDb from "@/lib/db";

export async function GET(request) {
  try {
    const db = getDb();

    let banners = [];
    try {
      banners = db
        .prepare(
          `SELECT id, title, description, image_url, link_url, position
           FROM banners
           WHERE status = 'active'
           AND (start_date IS NULL OR start_date <= CURRENT_DATE)
           AND (end_date IS NULL OR end_date >= CURRENT_DATE)
           ORDER BY position ASC`
        )
        .all();
    } catch (tableError) {
      console.log("Banners table not initialized yet");
      banners = [];
    }

    return NextResponse.json({
      banners,
      total: banners.length,
    });
  } catch (error) {
    console.error("[API] Error in GET /api/banners:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
