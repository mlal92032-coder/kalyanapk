import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import getDb from "./db";

const CART_COOKIE = "kalyana_cart_sid";

export async function getOrCreateCartId() {
  const store = await cookies();
  let sid = store.get(CART_COOKIE)?.value;
  const db = getDb();

  if (sid) {
    const existing = db.prepare("SELECT id FROM carts WHERE session_id = ?").get(sid);
    if (existing) return { cartId: existing.id, sid, isNew: false };
  }

  sid = randomUUID();
  const result = db.prepare("INSERT INTO carts (session_id) VALUES (?)").run(sid);
  return { cartId: result.lastInsertRowid, sid, isNew: true };
}

export function attachCartCookie(res, sid) {
  res.cookies.set(CART_COOKIE, sid, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export const CART_COOKIE_NAME = CART_COOKIE;
