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
    <Link href="/cart" className="relative text-neutral-700 hover:text-amber-800 text-sm font-medium">
      Cart
      {count > 0 && (
        <span className="absolute -top-2 -right-3 bg-amber-800 text-white text-[10px] rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
          {count}
        </span>
      )}
    </Link>
  );
}
