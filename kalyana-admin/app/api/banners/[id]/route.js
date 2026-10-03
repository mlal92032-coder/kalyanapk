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
    const { title, description, image_url, link_url, position, status } = body;

    const db = getDb();

    const banner = db.prepare("SELECT * FROM banners WHERE id = ?").get(id);
    if (!banner) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    db.prepare(
      `UPDATE banners SET title = ?, description = ?, image_url = ?, link_url = ?, position = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(title || banner.title, description || null, image_url || banner.image_url, link_url || null, position !== undefined ? position : banner.position, status || banner.status, id);

    logActivity({
      adminEmail: session.email,
      action: "UPDATE_BANNER",
      entityType: "banner",
      entityId: id,
      details: { title: title || banner.title },
    });

    return NextResponse.json({ success: true, message: "Banner updated" });
  } catch (error) {
    console.error("[API] Error in PATCH /api/banners/[id]:", error.message);
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
    const banner = db.prepare("SELECT * FROM banners WHERE id = ?").get(id);

    if (!banner) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    db.prepare("DELETE FROM banners WHERE id = ?").run(id);

    logActivity({
      adminEmail: session.email,
      action: "DELETE_BANNER",
      entityType: "banner",
      entityId: id,
      details: { title: banner.title },
    });

    return NextResponse.json({ success: true, message: "Banner deleted" });
  } catch (error) {
    console.error("[API] Error in DELETE /api/banners/[id]:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
