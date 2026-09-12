"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function CartLink() {
  const [count, setCount] = useState(0);

  async function refresh() {
    try {
      const res = await fetch("/api/cart");
      const data = await res.json();
      const total = (data.items || []).reduce((sum, i) => sum + i.quantity, 0);
      setCount(total);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    refresh();
    window.addEventListener("kalyana:cart-updated", refresh);
    return () => window.removeEventListener("kalyana:cart-updated", refresh);
  }, []);

  return (
    <Link href="/cart" className="relative text-cyan-100 hover:text-yellow-300 text-sm font-bold flex items-center gap-2 transition-colors">
      🛒 Cart
      {count > 0 && (
        <span className="absolute -top-3 -right-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xs font-bold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center shadow-lg">
          {count}
        </span>
      )}
    </Link>
  );
}
