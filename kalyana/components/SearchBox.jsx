"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBox() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSubmit(e) {
    e.preventDefault();
    if (!q.trim()) return;
    router.push(`/products?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full">
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search products, categories, suppliers..."
        className="w-full rounded-l-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700/40"
      />
      <button
        type="submit"
        className="rounded-r-md bg-amber-800 text-white px-4 text-sm font-medium hover:bg-amber-900"
      >
        Search
      </button>
    </form>
  );
}
