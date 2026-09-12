import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const SECRET = process.env.ADMIN_JWT_SECRET || "kalyana-dev-secret-change-me";
const COOKIE_NAME = "kalyana_admin_session";

export function signAdminToken(admin) {
  return jwt.sign(
    { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyAdminToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
