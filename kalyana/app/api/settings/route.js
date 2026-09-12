import { NextResponse } from "next/server";
import { getAllSettings } from "@/lib/settings";

export async function GET() {
  return NextResponse.json({ settings: getAllSettings() });
}
