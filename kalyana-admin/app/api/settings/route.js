import { NextResponse } from "next/server";
import { getAllSettings, setSettings } from "@/lib/settings";
import { logActivity } from "@/lib/activity";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  return NextResponse.json({ settings: getAllSettings() });
}

export async function PATCH(request) {
  const body = await request.json().catch(() => ({}));
  const session = await getAdminSession();
  const settings = setSettings(body);
  logActivity({ adminEmail: session?.email, action: "UPDATE_SETTINGS", entityType: "settings", details: body });
  return NextResponse.json({ settings });
}
