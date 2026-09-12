import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";

const SECRET = process.env.ADMIN_JWT_SECRET || "kalyana-dev-secret-change-me";
const COOKIE_NAME = "kalyana_admin_session";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow login page without authentication
  if (pathname === "/login") return NextResponse.next();

  // Allow the /api/login route (POST to login)
  if (pathname === "/api/login") return NextResponse.next();

  // All other routes require authentication
  const token = request.cookies.get(COOKIE_NAME)?.value;
  let valid = false;
  if (token) {
    try {
      jwt.verify(token, SECRET);
      valid = true;
    } catch {
      valid = false;
    }
  }

  if (!valid) {
    // If it's an API route, return 401
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Otherwise redirect to login
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
