import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import getDb from "@/lib/db";
import { signAdminToken, ADMIN_COOKIE_NAME } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  const db = getDb();
  const admin = db
    .prepare("SELECT * FROM admin_users WHERE email = ?")
    .get(email.toLowerCase().trim());

  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  }

  const token = signAdminToken(admin);
  const res = NextResponse.json({
    success: true,
    admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
  });

  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  logActivity({ adminEmail: admin.email, action: "LOGIN", entityType: "admin_user", entityId: admin.id });

  return res;
}
