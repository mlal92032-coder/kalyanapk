import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const db = getDb();

    const banner = db.prepare("SELECT * FROM banners WHERE id = ?").get(id);
    if (!banner) {
      return NextResponse.json({ error: "Banner not found." }, { status: 404 });
    }

    return NextResponse.json({ banner });
  } catch (error) {
    console.error("[API] Error in GET /api/banners/[id]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const db = getDb();

    const banner = db.prepare("SELECT * FROM banners WHERE id = ?").get(id);
    if (!banner) {
      return NextResponse.json({ error: "Banner not found." }, { status: 404 });
    }

    // Build update query
    const updates = [];
    const values = [];

    if (body.image_url !== undefined) {
      updates.push("image_url = ?");
      values.push(body.image_url);
    }
    if (body.title !== undefined) {
      updates.push("title = ?");
      values.push(body.title || null);
    }
    if (body.description !== undefined) {
      updates.push("description = ?");
      values.push(body.description || null);
    }
    if (body.button_text !== undefined) {
      updates.push("button_text = ?");
      values.push(body.button_text || null);
    }
    if (body.button_url !== undefined) {
      updates.push("button_url = ?");
      values.push(body.button_url || null);
    }
    if (body.is_active !== undefined) {
      updates.push("is_active = ?");
      values.push(body.is_active ? 1 : 0);
    }
    if (body.sort_order !== undefined) {
      updates.push("sort_order = ?");
      values.push(body.sort_order);
    }
    if (body.start_date !== undefined) {
      updates.push("start_date = ?");
      values.push(body.start_date || null);
    }
    if (body.end_date !== undefined) {
      updates.push("end_date = ?");
      values.push(body.end_date || null);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update." }, { status: 400 });
    }

    updates.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);

    const query = `UPDATE banners SET ${updates.join(", ")} WHERE id = ?`;
    db.prepare(query).run(...values);

    logActivity({
      adminEmail: session.email,
      action: "UPDATE_BANNER",
      entityType: "banner",
      entityId: parseInt(id),
      details: { changes: body },
    });

    const updated = db.prepare("SELECT * FROM banners WHERE id = ?").get(id);
    return NextResponse.json({ banner: updated });
  } catch (error) {
    console.error("[API] Error in PATCH /api/banners/[id]:", error);
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
      return NextResponse.json({ error: "Banner not found." }, { status: 404 });
    }

    db.prepare("DELETE FROM banners WHERE id = ?").run(id);

    logActivity({
      adminEmail: session.email,
      action: "DELETE_BANNER",
      entityType: "banner",
      entityId: parseInt(id),
      details: { title: banner.title },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Error in DELETE /api/banners/[id]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
